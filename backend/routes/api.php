<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — SocialWave
|--------------------------------------------------------------------------
|
| Moderation model (v2 — post-publication):
|  - All new posts/comments are immediately "approved" and visible
|  - ContentModerationService flags bad-word content (is_flagged = true)
|  - Admin reviews flagged content only and can Reject or Delete
|  - "pending" status has been removed entirely
|
*/

// ============================================================
// PUBLIC AUTHENTICATION ROUTES (no auth required)
// ============================================================

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ============================================================
// PROTECTED ROUTES (require valid Sanctum token)
// ============================================================

Route::middleware('auth:sanctum')->group(function () {

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------
    Route::get('/auth/me',       [AuthController::class, 'me']);
    Route::post('/auth/logout',  [AuthController::class, 'logout']);

    // --------------------------------------------------------
    // USER & PROFILE
    // --------------------------------------------------------
    Route::get('/user/profile',  [UserController::class, 'profile']);
    Route::post('/user/profile', [UserController::class, 'updateProfile']);
    Route::get('/users',         [UserController::class, 'index']); // Search users
    Route::get('/users/{id}',    [UserController::class, 'show']);

    // --------------------------------------------------------
    // FOLLOW SYSTEM
    // --------------------------------------------------------
    Route::post('/follow/{id}',   [\App\Http\Controllers\Api\FollowController::class, 'follow']);
    Route::delete('/unfollow/{id}', [\App\Http\Controllers\Api\FollowController::class, 'unfollow']);

    // --------------------------------------------------------
    // NOTIFICATIONS
    // --------------------------------------------------------
    Route::get('/notifications',             [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);

    // --------------------------------------------------------
    // POSTS
    // --------------------------------------------------------

    // Public feed (approved posts only)
    Route::get('/posts',         [PostController::class, 'index']);

    // Create post (published immediately, flagged if bad words detected)
    Route::post('/posts',        [PostController::class, 'store']);

    // Single approved post
    Route::get('/posts/{id}',    [PostController::class, 'show']);

    // Update own post (re-runs moderation, stays approved)
    Route::post('/posts/{id}',   [PostController::class, 'update']);

    // Delete own post
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);

    // Like / Unlike post
    Route::post('/posts/{id}/like', [PostController::class, 'toggleLike']);

    // Own posts (all statuses)
    Route::get('/my-posts',      [PostController::class, 'myPosts']);

    // --------------------------------------------------------
    // COMMENTS (nested under posts)
    // --------------------------------------------------------

    Route::get('/posts/{postId}/comments',           [CommentController::class, 'index']);
    Route::post('/posts/{postId}/comments',          [CommentController::class, 'store']);
    Route::post('/posts/{postId}/comments/{id}',     [CommentController::class, 'update']);
    Route::delete('/posts/{postId}/comments/{id}',   [CommentController::class, 'destroy']);

    // Like / Unlike comment
    Route::post('/comments/{id}/like',               [CommentController::class, 'toggleLike']);

    // --------------------------------------------------------
    // ADMIN PANEL (admin role only — post-publication moderation)
    // --------------------------------------------------------

    Route::middleware('admin')->prefix('admin')->group(function () {

        // Dashboard statistics (flagged counts, approved/rejected breakdown)
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // ── POST MODERATION ──
        // List flagged posts (default) or all posts (?flagged=false)
        Route::get('/posts',                [AdminController::class, 'posts']);

        // Reject a post (sets status = "rejected", hides from feed)
        Route::patch('/posts/{id}/reject',  [AdminController::class, 'rejectPost']);

        // Delete a post (admin)
        Route::delete('/posts/{id}',        [AdminController::class, 'deletePost']);

        // ── COMMENT MODERATION ──
        // List flagged comments (default) or all comments (?flagged=false)
        Route::get('/comments',                 [AdminController::class, 'comments']);

        // Reject a comment
        Route::patch('/comments/{id}/reject',   [AdminController::class, 'rejectComment']);

        // Delete a comment (admin)
        Route::delete('/comments/{id}',         [AdminController::class, 'deleteComment']);

        // ── USER MANAGEMENT ──
        Route::get('/users', [AdminController::class, 'users']);
    });
});
