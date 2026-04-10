<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;

class FollowController extends Controller
{
    public function follow(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if ($user->id === $id) {
            return response()->json(['success' => false, 'message' => 'Cannot follow yourself.'], 400);
        }

        $targetUser = User::findOrFail($id);

        if (!$user->following()->where('following_id', $id)->exists()) {
            $user->following()->attach($id);

            // Trigger Notification
            Notification::create([
                'user_id' => $id,
                'type'    => 'follow_user',
                'data'    => [
                    'sender_id'   => $user->id,
                    'sender_name' => $user->name,
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User followed successfully.'
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Already following this user.'
        ]);
    }

    public function unfollow(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $user->following()->detach($id);

        return response()->json([
            'success' => true,
            'message' => 'User unfollowed successfully.'
        ]);
    }
}
