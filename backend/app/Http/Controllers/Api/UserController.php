<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * UserController
 *
 * Handles user profile management:
 *  - View profile
 *  - Update bio
 *  - Upload profile picture
 */
class UserController extends Controller
{
    /**
     * Get the authenticated user's profile.
     *
     * Returns user details including the full profile picture URL.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        // Build response with computed profile picture URL
        $data = array_merge($user->toArray(), [
            'profile_picture_url' => $user->profile_picture_url,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * Update the authenticated user's profile.
     *
     * Allows updating the name, bio, and profile picture.
     * If a new profile picture is uploaded, the old file is deleted
     * from storage to prevent orphaned files.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        // Validate request fields
        $validated = $request->validate([
            'name'            => 'sometimes|required|string|max:255',
            'bio'             => 'nullable|string|max:500',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user = $request->user();

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            // Delete the old profile picture from storage if it exists
            if ($user->profile_picture) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            // Store the new image in storage/app/public/profile_pictures
            $path = $request->file('profile_picture')->store('profile_pictures', 'public');
            $validated['profile_picture'] = $path;
        }

        // Update the user model with validated fields
        $user->update($validated);

        // Reload fresh from DB and attach URL
        $user->refresh();
        $data = array_merge($user->toArray(), [
            'profile_picture_url' => $user->profile_picture_url,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data'    => $data,
        ]);
    }

    /**
     * Get public profile of any user by ID.
     *
     * Used to view another user's posts and information.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        // Find user or return 404
        $user = \App\Models\User::findOrFail($id);

        $data = array_merge($user->only(['id', 'name', 'bio', 'role', 'created_at']), [
            'profile_picture_url' => $user->profile_picture_url,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}
