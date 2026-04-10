<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Post Model
 *
 * Represents a user post in the SocialWave feed.
 * Supports text content (max 250 chars), image, file attachments.
 *
 * Moderation:
 *  - status     : "approved" (default, visible) | "rejected" (hidden by admin)
 *  - is_flagged : true if auto-detected bad words; triggers admin review queue
 *
 * NOTE: "pending" status has been removed. Posts publish immediately.
 */
class Post extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'content',
        'image',
        'file',
        'status',
        'is_flagged',
    ];
    
    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'image_url',
        'file_url',
        'likes_count',
        'is_liked',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_flagged' => 'boolean',
    ];

    /**
     * Get the URL for the post image attachment.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }

    /**
     * Get the URL for the post file attachment.
     *
     * @return string|null
     */
    public function getFileUrlAttribute(): ?string
    {
        return $this->file ? asset('storage/' . $this->file) : null;
    }

    public function getLikesCountAttribute()
    {
        return $this->relationLoaded('likes')
            ? $this->likes->count()
            : $this->likes()->count();
    }

    public function getIsLikedAttribute()
    {
        return $this->relationLoaded('likes')
            ? $this->likes->contains('user_id', auth()->id())
            : $this->likes()->where('user_id', auth()->id())->exists();
    }

    /**
     * Get the author of the post.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all comments on this post.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Scope: only approved posts (visible in public feed).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: only flagged posts (admin review queue).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFlagged($query)
    {
        return $query->where('is_flagged', true);
    }

    /**
     * Extract all hashtags from content.
     *
     * @return array
     */
    public function extractHashtags(): array
    {
        preg_match_all('/#(\w+)/', $this->content ?? '', $matches);
        return $matches[1] ?? [];
    }
}
