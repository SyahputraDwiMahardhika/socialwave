<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: add_fields_to_users_table
 *
 * Adds SocialWave-specific columns to the users table:
 *  - role           : 'user' (default) or 'admin'
 *  - bio            : optional profile description
 *  - profile_picture: path to uploaded profile image
 *
 * NOTE: The base users table is created by
 * 0001_01_01_000000_create_users_table.php (Laravel default).
 * This migration only ADDS the extra columns.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['user', 'admin'])->default('user')->after('password');
            $table->text('bio')->nullable()->after('role');
            $table->string('profile_picture')->nullable()->after('bio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'bio', 'profile_picture']);
        });
    }
};
