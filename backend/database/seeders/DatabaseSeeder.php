<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DatabaseSeeder
 *
 * Seeds the database with:
 *  - 1 Admin user
 *  - 2 Regular demo users
 *  - Sample approved posts and comments for each user
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // --------------------------------------------------------
        // Create Admin User
        // --------------------------------------------------------
        $admin = User::create([
            'name'     => 'Admin SocialWave',
            'email'    => 'admin@socialwave.com',
            'password' => Hash::make('admin123'),
            'role'     => 'admin',
            'bio'      => 'Platform administrator. Keeping SocialWave safe and clean.',
        ]);

        // --------------------------------------------------------
        // Create Regular Demo Users
        // --------------------------------------------------------
        $user1 = User::create([
            'name'     => 'Budi Santoso',
            'email'    => 'budi@example.com',
            'password' => Hash::make('12345678'),
            'role'     => 'user',
            'bio'      => 'Software developer from Jakarta. Love #coding and #tech.',
        ]);

        $user2 = User::create([
            'name'     => 'Sari Dewi',
            'email'    => 'sari@example.com',
            'password' => Hash::make('12345678'),
            'role'     => 'user',
            'bio'      => 'Designer and coffee enthusiast. #design #coffee',
        ]);

        // --------------------------------------------------------
        // Create Sample Posts (approved so they appear in feed)
        // --------------------------------------------------------
        $post1 = Post::create([
            'user_id'    => $user1->id,
            'content'    => 'Hello SocialWave! Excited to join this platform. #hello #coding #laravel',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        $post2 = Post::create([
            'user_id'    => $user1->id,
            'content'    => 'Just finished building a REST API with Laravel Sanctum. It was amazing! #coding #laravel #api',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        $post3 = Post::create([
            'user_id'    => $user2->id,
            'content'    => 'Working on a new UI design today. Loving the color palette I chose! #design #ui #ux',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        $post4 = Post::create([
            'user_id'    => $user2->id,
            'content'    => 'Coffee + code = perfect morning. What\'s your favorite coding beverage? #coffee #coding',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        

        // --------------------------------------------------------
        // Create Sample Comments
        // --------------------------------------------------------
        Comment::create([
            'post_id'    => $post1->id,
            'user_id'    => $user2->id,
            'content'    => 'Welcome to SocialWave! Great to have you here. #welcome',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        Comment::create([
            'post_id'    => $post2->id,
            'user_id'    => $user2->id,
            'content'    => 'Laravel Sanctum is amazing for API auth! I use it too. #laravel #coding',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        Comment::create([
            'post_id'    => $post3->id,
            'user_id'    => $user1->id,
            'content'    => 'Can\'t wait to see the final design! Share it when done. #design',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        Comment::create([
            'post_id'    => $post4->id,
            'user_id'    => $user1->id,
            'content'    => 'Black coffee, no sugar. The only way to code! #coffee',
            'status'     => 'approved',
            'is_flagged' => false,
        ]);

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('   Admin: admin@socialwave.com / admin123');
        $this->command->info('   User1: budi@example.com / 12345678');
        $this->command->info('   User2: sari@example.com / 12345678');
    }
}
