<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: create_comments_table
 *
 * Creates the comments table with:
 *  - post_id    : FK to posts
 *  - user_id    : FK to users
 *  - content    : text content (max 250 chars)
 *  - image      : optional image file path
 *  - file       : optional file attachment path
 *  - status     : moderation status (approved | rejected) — default: approved
 *  - is_flagged : auto-flagged by bad word detection — default: false
 *
 * NOTE: "pending" status has been removed.
 * All new comments are immediately published as "approved".
 * Admin moderates by rejecting flagged content post-publication.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
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
        Schema::dropIfExists('comments');
    }
};
