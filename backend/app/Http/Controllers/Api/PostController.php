<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Services\ContentModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * PostController
 *
 * Manages CRUD operations for posts.
 *
 * Moderation flow (v2 — post-publication):
 *  1. User creates a post → immediately published (status = "approved")
 *  2. ContentModerationService checks for bad words
 *  3. If bad words found → is_flagged = true (post still visible)
 *  4. Admin reviews flagged content and can reject or delete
 *
 * Feed only shows status = "approved" posts.
 */
class PostController extends Controller
{
    /**
     * ContentModerationService instance for bad-word detection.
     *
     * @var \App\Services\ContentModerationService
     */
    protected ContentModerationService $moderationService;

    /**
     * Inject the ContentModerationService via constructor.
     *
     * @param  \App\Services\ContentModerationService  $moderationService
     */
    public function __construct(ContentModerationService $moderationService)
    {
        $this->moderationService = $moderationService;
    }

    /**
     * Get the public feed of approved posts.
     *
     * Supports optional hashtag filtering via query param ?hashtag=coding
     * Posts are sorted by newest first.
     * Each post includes author info and approved comment count.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Post::approved()
            ->with([
                'user:id,name,profile_picture',
                'likes',
                'comments' => function ($q) {
                    $q->approved()->whereNull('parent_id')->with(['user:id,name,profile_picture', 'likes', 'replies.user', 'replies.likes'])->latest();
                },
            ])
            ->latest();

        if ($request->filled('hashtag')) {
            $hashtag = ltrim($request->input('hashtag'), '#');
            $query->where('content', 'LIKE', "%#{$hashtag}%");
        }

        $posts = $query->paginate(15);

        $posts->getCollection()->transform(fn($post) => $this->appendUrls($post));

        return response()->json([
            'success' => true,
            'data'    => $posts,
        ]);
    }

    /**
     * Create a new post.
     *
     * The post is immediately published (status = "approved").
     * Bad-word detection sets is_flagged = true if triggered.
     * Flagged posts remain visible but appear in admin review queue.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:250',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'    => 'nullable|file|mimes:pdf,doc,docx,txt,zip|max:10240',
        ]);

        // Run moderation — returns is_flagged + detected words
        $moderation = $this->moderationService->analyse($validated['content']);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('posts/images', 'public');
        }

        if ($request->hasFile('file')) {
            $validated['file'] = $request->file('file')->store('posts/files', 'public');
        }

        // Always approved on creation; is_flagged signals admin review needed
        $post = Post::create([
            'user_id'    => $request->user()->id,
            'content'    => $validated['content'],
            'image'      => $validated['image'] ?? null,
            'file'       => $validated['file'] ?? null,
            'status'     => 'approved',
            'is_flagged' => $moderation['is_flagged'],
        ]);

        $post->load('user:id,name,profile_picture');

        return response()->json([
            'success' => true,
            'message' => $moderation['is_flagged']
                ? 'Post published. Content has been flagged for admin review.'
                : 'Post published successfully.',
            'data'    => $this->appendUrls($post),
        ], 201);
    }

    /**
     * Get a single post by ID.
     *
     * Only returns the post if it is approved.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $post = Post::approved()
            ->with([
                'user:id,name,profile_picture',
                'likes',
                'comments' => function ($q) {
                    $q->approved()->whereNull('parent_id')->with(['user:id,name,profile_picture', 'likes', 'replies.user', 'replies.likes'])->latest();
                },
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->appendUrls($post),
        ]);
    }

    /**
     * Update an existing post.
     *
     * Only the post owner can update their post.
     * Re-runs moderation on updated content.
     * Updated post is set back to "approved" with new flag result.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        if ($post->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to edit this post.',
            ], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:250',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'    => 'nullable|file|mimes:pdf,doc,docx,txt,zip|max:10240',
        ]);

        $moderation = $this->moderationService->analyse($validated['content']);

        if ($request->hasFile('image')) {
            if ($post->image) Storage::disk('public')->delete($post->image);
            $validated['image'] = $request->file('image')->store('posts/images', 'public');
        }

        if ($request->hasFile('file')) {
            if ($post->file) Storage::disk('public')->delete($post->file);
            $validated['file'] = $request->file('file')->store('posts/files', 'public');
        }

        $post->update([
            'content'    => $validated['content'],
            'image'      => $validated['image'] ?? $post->image,
            'file'       => $validated['file'] ?? $post->file,
            'status'     => 'approved',
            'is_flagged' => $moderation['is_flagged'],
        ]);

        $post->load('user:id,name,profile_picture');

        return response()->json([
            'success' => true,
            'message' => $moderation['is_flagged']
                ? 'Post updated and re-published. Content flagged for admin review.'
                : 'Post updated successfully.',
            'data'    => $this->appendUrls($post),
        ]);
    }

    /**
     * Delete a post.
     *
     * Only the post owner (or admin) can delete a post.
     * Cleans up associated image and file from storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $user = $request->user();

        if ($post->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this post.',
            ], 403);
        }

        if ($post->image) Storage::disk('public')->delete($post->image);
        if ($post->file)  Storage::disk('public')->delete($post->file);

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully.',
        ]);
    }

    /**
     * Get posts by the authenticated user (their own posts).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myPosts(Request $request): JsonResponse
    {
        $posts = Post::where('user_id', $request->user()->id)
            ->with(['user:id,name,profile_picture', 'likes', 'comments.likes'])
            ->latest()
            ->paginate(15);

        $posts->getCollection()->transform(fn($post) => $this->appendUrls($post));

        return response()->json([
            'success' => true,
            'data'    => $posts,
        ]);
    }

    /**
     * Append full storage URLs to a post's image and file attributes.
     *
     * @param  \App\Models\Post  $post
     * @return \App\Models\Post
     */
    private function appendUrls(Post $post): Post
    {
        $post->image_url = $post->image_url;
        $post->file_url  = $post->file_url;

        if ($post->relationLoaded('comments')) {
            $post->comments->transform(function ($comment) {
                $comment->image_url = $comment->image_url;
                $comment->file_url  = $comment->file_url;
                if ($comment->user) {
                    $comment->user->profile_picture_url = $comment->user->profile_picture_url;
                }
                return $comment;
            });
        }

        if ($post->user) {
            $post->user->profile_picture_url = $post->user->profile_picture_url;
        }

        return $post;
    }

    /**
     * Toggle like for a post.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleLike(Request $request, int $id): JsonResponse
    {
        $post = Post::approved()->findOrFail($id);
        $userId = $request->user()->id;

        $like = $post->likes()->where('user_id', $userId)->first();

        if ($like) {
            $like->delete();
            $isLiked = false;
        } else {
            $post->likes()->create(['user_id' => $userId]);
            $isLiked = true;

            if ($post->user_id !== $userId) {
                \App\Models\Notification::create([
                    'user_id' => $post->user_id,
                    'type'    => 'like_post',
                    'data'    => [
                        'sender_id'   => $userId,
                        'sender_name' => $request->user()->name,
                        'post_id'     => $post->id,
                    ]
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'likes_count' => $post->likes()->count(),
                'is_liked'    => $isLiked,
            ]
        ]);
    }
}
