<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * AuthController
 *
 * Handles user authentication:
 *  - Register a new account
 *  - Login and issue Sanctum API token
 *  - Logout and revoke token
 *  - Return authenticated user details
 */
class AuthController extends Controller
{
    /**
     * Register a new user.
     *
     * Creates a user with default role 'user'.
     * Returns the created user and a new API token.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        // Validate incoming registration data
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create the new user with default role 'user'
        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'user',
        ]);

        // Generate a Sanctum API token for the new user
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data'    => [
                'user'  => $user,
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login an existing user.
     *
     * Validates credentials and returns a new API token on success.
     * Returns 422 if credentials do not match.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        // Validate the login fields
        $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Attempt authentication
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials. Please check your email and password.',
            ], 422);
        }

        // Retrieve the authenticated user
        $user = User::where('email', $request->email)->firstOrFail();

        // Delete existing tokens to avoid token accumulation (optional: single-device policy)
        $user->tokens()->delete();

        // Issue a fresh token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data'    => [
                'user'  => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout the authenticated user.
     *
     * Revokes the current access token used in the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Hapus semua token milik user ini (bukan hanya current token)
        // TransientToken tidak support delete(), jadi kita hapus dari DB langsung
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
    /**
     * Get the currently authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        // Append the profile picture URL accessor
        $user = $request->user();
        $userData = $user->toArray();
        $userData['profile_picture_url'] = $user->profile_picture_url;

        return response()->json([
            'success' => true,
            'data'    => $userData,
        ]);
    }
}
