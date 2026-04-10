<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Services\ContentModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * CommentController
 *
 * Manages CRUD operations for comments on posts.
 *
 * Moderation flow (v2 — post-publication):
 *  1. User posts a comment → immediately published (status = "approved")
 *  2. ContentModerationService checks for bad words
 *  3. If bad words found → is_flagged = true (comment still visible)
 *  4. Admin reviews flagged content and can reject or delete
 *
 * Feed only shows status = "approved" comments.
 */
class CommentController extends Controller
{
    /**
     * ContentModerationService for bad-word detection.
     *
     * @var \App\Services\ContentModerationService
     */
    protected ContentModerationService $moderationService;

    /**
     * Inject ContentModerationService.
     *
     * @param  \App\Services\ContentModerationService  $moderationService
     */
    public function __construct(ContentModerationService $moderationService)
    {
        $this->moderationService = $moderationService;
    }

    /**
     * Get all approved comments for a specific post.
     *
     * Supports optional hashtag filtering via ?hashtag=coding
     * Comments are sorted by newest first.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $postId
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, int $postId): JsonResponse
    {
        $post = Post::approved()->findOrFail($postId);

        $query = Comment::approved()
            ->where('post_id', $postId)
            ->whereNull('parent_id')
            ->with(['user:id,name,profile_picture', 'likes', 'replies' => function($q) {
                $q->approved()->with(['user:id,name,profile_picture', 'likes'])->latest();
            }])
            ->latest();

        if ($request->filled('hashtag')) {
            $hashtag = ltrim($request->input('hashtag'), '#');
            $query->where('content', 'LIKE', "%#{$hashtag}%");
        }

        $comments = $query->paginate(20);
        $comments->getCollection()->transform(fn($c) => $this->appendUrls($c));

        return response()->json([
            'success' => true,
            'data'    => $comments,
        ]);
    }

    /**
     * Create a new comment on a post.
     *
     * The comment is immediately published (status = "approved").
     * Bad-word detection sets is_flagged = true if triggered.
     * Flagged comments remain visible but appear in admin review queue.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $postId
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, int $postId): JsonResponse
    {
        Post::approved()->findOrFail($postId);

        $validated = $request->validate([
            'content'   => 'required|string|max:250',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'      => 'nullable|file|mimes:pdf,doc,docx,txt,zip|max:10240',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $moderation = $this->moderationService->analyse($validated['content']);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('comments/images', 'public');
        }

        if ($request->hasFile('file')) {
            $validated['file'] = $request->file('file')->store('comments/files', 'public');
        }

        // Always approved on creation; is_flagged signals admin review needed
        $comment = Comment::create([
            'post_id'    => $postId,
            'user_id'    => $request->user()->id,
            'parent_id'  => $validated['parent_id'] ?? null,
            'content'    => $validated['content'],
            'image'      => $validated['image'] ?? null,
            'file'       => $validated['file'] ?? null,
            'status'     => 'approved',
            'is_flagged' => $moderation['is_flagged'],
        ]);

        $comment->load('user:id,name,profile_picture');

        return response()->json([
            'success' => true,
            'message' => $moderation['is_flagged']
                ? 'Comment posted. Content has been flagged for admin review.'
                : 'Comment posted successfully.',
            'data'    => $this->appendUrls($comment),
        ], 201);
    }

    /**
     * Update an existing comment.
     *
     * Only the comment owner can edit.
     * Re-runs moderation on updated content.
     * Updated comment is set back to "approved" with new flag result.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $postId
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $postId, int $id): JsonResponse
    {
        $comment = Comment::where('post_id', $postId)->findOrFail($id);

        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to edit this comment.',
            ], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:250',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'    => 'nullable|file|mimes:pdf,doc,docx,txt,zip|max:10240',
        ]);

        $moderation = $this->moderationService->analyse($validated['content']);

        if ($request->hasFile('image')) {
            if ($comment->image) Storage::disk('public')->delete($comment->image);
            $validated['image'] = $request->file('image')->store('comments/images', 'public');
        }

        if ($request->hasFile('file')) {
            if ($comment->file) Storage::disk('public')->delete($comment->file);
            $validated['file'] = $request->file('file')->store('comments/files', 'public');
        }

        $comment->update([
            'content'    => $validated['content'],
            'image'      => $validated['image'] ?? $comment->image,
            'file'       => $validated['file'] ?? $comment->file,
            'status'     => 'approved',
            'is_flagged' => $moderation['is_flagged'],
        ]);

        $comment->load('user:id,name,profile_picture');

        return response()->json([
            'success' => true,
            'message' => $moderation['is_flagged']
                ? 'Comment updated. Content flagged for admin review.'
                : 'Comment updated successfully.',
            'data'    => $this->appendUrls($comment),
        ]);
    }

    /**
     * Delete a comment.
     *
     * Only the comment owner or an admin can delete.
     * Cleans up associated files from storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $postId
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, int $postId, int $id): JsonResponse
    {
        $comment = Comment::where('post_id', $postId)->findOrFail($id);
        $user    = $request->user();

        if ($comment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this comment.',
            ], 403);
        }

        if ($comment->image) Storage::disk('public')->delete($comment->image);
        if ($comment->file)  Storage::disk('public')->delete($comment->file);

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully.',
        ]);
    }

    /**
     * Append full URLs for image and file attachments on a comment.
     *
     * @param  \App\Models\Comment  $comment
     * @return \App\Models\Comment
     */
    private function appendUrls(Comment $comment): Comment
    {
        $comment->image_url = $comment->image_url;
        $comment->file_url  = $comment->file_url;

        if ($comment->user) {
            $comment->user->profile_picture_url = $comment->user->profile_picture_url;
        }

        if ($comment->relationLoaded('replies')) {
            $comment->replies->transform(function ($reply) {
                return $this->appendUrls($reply);
            });
        }

        return $comment;
    }

    /**
     * Toggle like for a comment.
     */
    public function toggleLike(Request $request, int $id): JsonResponse
    {
        $comment = Comment::approved()->findOrFail($id);
        $userId = $request->user()->id;

        $like = $comment->likes()->where('user_id', $userId)->first();

        if ($like) {
            $like->delete();
            $isLiked = false;
        } else {
            $comment->likes()->create(['user_id' => $userId]);
            $isLiked = true;
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'likes_count' => $comment->likes()->count(),
                'is_liked'    => $isLiked,
            ]
        ]);
    }
}
