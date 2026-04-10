<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Comment Model
 *
 * Represents a user comment on a post.
 * Supports text, image, and file attachments (same as Post).
 *
 * Moderation:
 *  - status     : "approved" (default, visible) | "rejected" (hidden by admin)
 *  - is_flagged : true if auto-detected bad words; triggers admin review queue
 *
 * NOTE: "pending" status has been removed. Comments publish immediately.
 */
class Comment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'post_id',
        'user_id',
        'content',
        'image',
        'file',
        'status',
        'is_flagged',
        'parent_id',
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
     * Get the full URL for the comment image.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }

    /**
     * Get the full URL for the comment file.
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
     * Get the post this comment belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Get the author of the comment.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Scope: only approved comments (visible in feed).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: only flagged comments (admin review queue).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFlagged($query)
    {
        return $query->where('is_flagged', true);
    }

    /**
     * Extract all hashtags from the comment content.
     *
     * @return array
     */
    public function extractHashtags(): array
    {
        preg_match_all('/#(\w+)/', $this->content ?? '', $matches);
        return $matches[1] ?? [];
    }
}
