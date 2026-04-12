/**
 * PostCard.jsx
 *
 * Renders a single post in the feed.
 * Features:
 *  - Author avatar, name, timestamp
 *  - Content with clickable hashtags
 *  - Image and file attachment display
 *  - Edit / Delete buttons for post owner
 *  - Expandable comment section
 *  - "Flagged" warning badge visible to post owner (content still live)
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CommentSection from './CommentSection'
import PostFormModal from './PostFormModal'
import api from '../services/api'
import { Avatar } from './Navbar'

function formatRelativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function renderContent(content, onHashtagClick) {
  if (!content) return null
  const parts = content.split(/(#\w+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="hashtag" onClick={() => onHashtagClick(part)} title={`Filter by ${part}`}>
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function PostCard({ post, onDeleted, onUpdated, onHashtagClick, showStatus = false }) {
  const { user }                        = useAuth()
  const navigate                        = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting]         = useState(false)

  const [isLiked, setIsLiked] = useState(post.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)

  const isOwner = Number(user?.id) === Number(post.user_id)
  const commentCount = post.comments?.length ?? 0

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/posts/${post.id}`)
      onDeleted(post.id)
    } catch {
      alert('Failed to delete post.')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleLike = async () => {
    if (!user) return

    // Optimistic update
    setIsLiked(prev => !prev)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)

    try {
      const res = await api.post(`/posts/${post.id}/like`)
      setIsLiked(res.data.data.is_liked)
      setLikesCount(res.data.data.likes_count)
    } catch {
      // Revert on error
      setIsLiked(post.is_liked ?? false)
      setLikesCount(post.likes_count ?? 0)
    }
  }

  return (
    <>
      <div className="post-card">

        {/* ── Flagged warning banner (visible to post owner only) ── */}
        {isOwner && post.is_flagged && post.status === 'approved' && (
          <div style={{
            background: 'rgba(230,126,34,0.1)',
            border: '1px solid rgba(230,126,34,0.3)',
            borderRadius: 6,
            padding: '0.4rem 0.75rem',
            marginBottom: '0.6rem',
            fontSize: '0.8rem',
            color: '#c0870a',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <i className="bi bi-flag-fill"></i>
            Your post has been flagged for review. It is still visible but may be removed by a moderator.
          </div>
        )}

        {/* Author info */}
        <div className="post-author" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
          <div 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}
            onClick={() => navigate(`/user/${post.user.id}`)}
          >
            <Avatar user={post.user} size={40} />
            <div>
              <div className="author-name" style={{ cursor: 'pointer' }}>
                {post.user?.name ?? 'Unknown'}
              </div>
              <div className="post-time" style={{ cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                {formatRelativeTime(post.created_at)}

                {/* Status badge (shown on "My Posts" page via showStatus prop) */}
                {showStatus && (
                  <span className={`sw-badge ms-2 badge-${post.status}`}>
                    {post.status}
                  </span>
                )}

                {/* Flagged badge in timestamp row (public feed) */}
                {post.is_flagged && !showStatus && (
                  <span
                    className="sw-badge ms-2 badge-flagged"
                    title="This post has been flagged for review"
                    style={{ fontSize: '0.65rem' }}
                  >
                    <i className="bi bi-flag-fill me-1"></i>Flagged
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="dropdown">
              <button
                className="btn-sw-ghost py-1 px-2"
                data-bs-toggle="dropdown"
                style={{ fontSize: '1.1rem', lineHeight: 1 }}
              >
                <i className="bi bi-three-dots"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button className="dropdown-item" onClick={() => setShowEditModal(true)}>
                    <i className="bi bi-pencil me-2"></i> Edit
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    style={{ color: 'var(--sw-danger)' }}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <i className="bi bi-trash me-2"></i>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Post content */}
        <div className="post-content">
          {renderContent(post.content, onHashtagClick)}
        </div>

        {/* Image attachment */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post attachment"
            className="post-image"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found' }}
          />
        )}

        {/* File attachment */}
        {post.file_url && (
          <div className="file-preview">
            <i className="bi bi-paperclip" style={{ color: 'var(--sw-accent)' }}></i>
            <a href={post.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--sw-accent)' }}>
              Download attachment
            </a>
          </div>
        )}

        {/* Post actions */}
        <div className="post-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={`btn-sw-ghost ${isLiked ? 'liked' : ''}`}
            onClick={handleToggleLike}
            style={{ color: isLiked ? 'var(--sw-danger)' : 'inherit' }}
          >
            <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
            {likesCount}
          </button>

          <button className="btn-sw-ghost" onClick={() => setShowComments(!showComments)}>
            <i className={`bi ${showComments ? 'bi-chat-fill' : 'bi-chat'} me-1`}></i>
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </button>
        </div>

        {/* Expandable comment section */}
        {showComments && (
          <CommentSection
            postId={post.id}
            initialComments={post.comments ?? []}
            onHashtagClick={onHashtagClick}
          />
        )}
      </div>

      {/* Edit post modal */}
      {showEditModal && (
        <PostFormModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          existingPost={post}
          onSuccess={(updatedPost) => {
            onUpdated(updatedPost)
            setShowEditModal(false)
          }}
        />
      )}
    </>
  )
}
