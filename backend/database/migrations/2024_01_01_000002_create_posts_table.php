<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: create_posts_table
 *
 * Creates the posts table with:
 *  - user_id    : FK to users
 *  - content    : text content (max 250 chars enforced at app level)
 *  - image      : optional image file path
 *  - file       : optional file attachment path
 *  - status     : moderation status (approved | rejected) — default: approved
 *  - is_flagged : auto-flagged by bad word detection — default: false
 *
 * NOTE: "pending" status has been removed.
 * All new posts are immediately published as "approved".
 * Admin moderates by rejecting flagged content post-publication.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('content', 250);
            $table->string('image')->nullable();
            $table->string('file')->nullable();
            $table->enum('status', ['approved', 'rejected'])->default('approved');
            $table->boolean('is_flagged')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
