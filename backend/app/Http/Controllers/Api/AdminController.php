<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * AdminController
 *
 * Admin-only post-publication moderation endpoints.
 * All routes in this controller are protected by AdminMiddleware.
 *
 * MODERATION PHILOSOPHY (v2):
 *  - Admin does NOT approve content (all content is auto-approved on creation)
 *  - Admin ONLY reviews flagged content (is_flagged = true)
 *  - Admin can: Reject content (set status = "rejected") or Delete it
 *  - Rejected content is hidden from the public feed
 *
 * Endpoints:
 *  - Dashboard statistics
 *  - Flagged posts/comments list
 *  - Reject / Delete posts and comments
 *  - User list
 */
class AdminController extends Controller
{
    // =========================================================================
    // DASHBOARD STATISTICS
    // =========================================================================

    /**
     * Get platform-wide statistics for the admin dashboard.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard(): JsonResponse
    {
        $stats = [
            'users' => [
                'total'  => User::count(),
                'admins' => User::where('role', 'admin')->count(),
            ],
            'posts' => [
                'total'    => Post::count(),
                'approved' => Post::where('status', 'approved')->count(),
                'rejected' => Post::where('status', 'rejected')->count(),
                'flagged'  => Post::where('is_flagged', true)->count(),
            ],
            'comments' => [
                'total'    => Comment::count(),
                'approved' => Comment::where('status', 'approved')->count(),
                'rejected' => Comment::where('status', 'rejected')->count(),
                'flagged'  => Comment::where('is_flagged', true)->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }

    // =========================================================================
    // POST MODERATION
    // =========================================================================

    /**
     * List posts for admin review.
     *
     * Default behaviour: returns ONLY flagged posts (admin review queue).
     * Accepts optional query params:
     *  ?flagged=true   — only flagged posts (default)
     *  ?flagged=false  — all posts regardless of flag
     *  ?status=rejected — filter by status
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function posts(Request $request): JsonResponse
    {
        $query = Post::with('user:id,name,email,profile_picture')
            ->withCount('comments')
            ->latest();

        // Default: show flagged posts only (admin review queue)
        // Pass ?flagged=false to see all posts
        if ($request->input('flagged', 'true') !== 'false') {
            $query->where('is_flagged', true);
        }

        // Optional status filter (e.g. ?status=rejected)
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $posts = $query->paginate(20);

        $posts->getCollection()->transform(function ($post) {
            $post->image_url = $post->image_url;
            $post->file_url  = $post->file_url;
            if ($post->user) {
                $post->user->profile_picture_url = $post->user->profile_picture_url;
            }
            return $post;
        });

        return response()->json([
            'success' => true,
            'data'    => $posts,
        ]);
    }

    /**
     * Reject a post.
     *
     * Sets the post status to "rejected", removing it from the public feed.
     * is_flagged remains true for audit trail.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectPost(int $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $post->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => "Post #{$id} has been rejected and removed from the feed.",
            'data'    => $post,
        ]);
    }

    /**
     * Delete a post as admin.
     *
     * Admin can delete any post regardless of ownership.
     * Cleans up attached files from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletePost(int $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        if ($post->image) Storage::disk('public')->delete($post->image);
        if ($post->file)  Storage::disk('public')->delete($post->file);

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => "Post #{$id} deleted by admin.",
        ]);
    }

    // =========================================================================
    // COMMENT MODERATION
    // =========================================================================

    /**
     * List comments for admin review.
     *
     * Default behaviour: returns ONLY flagged comments (admin review queue).
     * Accepts optional query params:
     *  ?flagged=true   — only flagged comments (default)
     *  ?flagged=false  — all comments
     *  ?status=rejected — filter by status
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function comments(Request $request): JsonResponse
    {
        $query = Comment::with([
            'user:id,name,email,profile_picture',
            'post:id,content,user_id',
        ])->latest();

        // Default: show flagged comments only
        if ($request->input('flagged', 'true') !== 'false') {
            $query->where('is_flagged', true);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $comments = $query->paginate(20);

        $comments->getCollection()->transform(function ($comment) {
            $comment->image_url = $comment->image_url;
            $comment->file_url  = $comment->file_url;
            if ($comment->user) {
                $comment->user->profile_picture_url = $comment->user->profile_picture_url;
            }
            return $comment;
        });

        return response()->json([
            'success' => true,
            'data'    => $comments,
        ]);
    }

    /**
     * Reject a comment.
     *
     * Sets the comment status to "rejected", hiding it from the feed.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectComment(int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);
        $comment->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => "Comment #{$id} has been rejected.",
            'data'    => $comment,
        ]);
    }

    /**
     * Delete a comment as admin.
     *
     * Admin can delete any comment regardless of ownership.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteComment(int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        if ($comment->image) Storage::disk('public')->delete($comment->image);
        if ($comment->file)  Storage::disk('public')->delete($comment->file);

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => "Comment #{$id} deleted by admin.",
        ]);
    }

    // =========================================================================
    // USER MANAGEMENT
    // =========================================================================

    /**
     * List all registered users.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function users(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'role', 'bio', 'profile_picture', 'created_at')
            ->withCount(['posts', 'comments'])
            ->latest()
            ->paginate(20);

        $users->getCollection()->transform(function ($user) {
            $user->profile_picture_url = $user->profile_picture_url;
            return $user;
        });

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }
}
