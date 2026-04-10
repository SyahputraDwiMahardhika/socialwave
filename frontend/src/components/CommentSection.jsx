/**
 * CommentSection.jsx
 *
 * Renders the full comment thread for a post, plus the comment form.
 * Loads comments from the API on first render.
 * Supports create, edit, and delete for the authenticated user's comments.
 * Now supports nested replies and likes.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Navbar'
import api from '../services/api'

const MAX_CHARS = 250

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function renderCommentText(text, onHashtagClick) {
  if (!text) return null
  return text.split(/(#\w+)/g).map((part, i) =>
    part.startsWith('#')
      ? <span key={i} className="hashtag" onClick={() => onHashtagClick(part)}>{part}</span>
      : <span key={i}>{part}</span>
  )
}

function CommentItem({ comment, user, postId, onHashtagClick, handleSaveEdit, handleDeleteComment, handleReplySubmit }) {
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isLiked, setIsLiked] = useState(comment.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(comment.likes_count ?? 0)

  const handleToggleLike = async () => {
    if (!user) return
    setIsLiked(prev => !prev)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    try {
      const res = await api.post(`/comments/${comment.id}/like`)
      setIsLiked(res.data.data.is_liked)
      setLikesCount(res.data.data.likes_count)
    } catch {
      setIsLiked(comment.is_liked ?? false)
      setLikesCount(comment.likes_count ?? 0)
    }
  }

  const submitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim() || replyContent.length > MAX_CHARS) return
    await handleReplySubmit(comment.id, replyContent)
    setReplyContent('')
    setShowReplyForm(false)
  }

  return (
    <div className="comment-item" style={{ borderLeft: comment.parent_id ? '3px solid var(--sw-border)' : 'none', paddingLeft: comment.parent_id ? '0.75rem' : '0' }}>
      <Avatar user={comment.user} size={32} />
      <div className="comment-body" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="comment-author">{comment.user?.name}</span>
          <span className="comment-time">{relativeTime(comment.created_at)}</span>
        </div>

        {editingId === comment.id ? (
          <div style={{ marginTop: '0.25rem' }}>
            <textarea
              className="sw-form-control form-control"
              rows={2}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              maxLength={MAX_CHARS}
              style={{ resize: 'none', fontSize: '0.85rem' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
              <button className="btn-sw-primary py-1" style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem' }} onClick={() => { handleSaveEdit(comment.id, editContent); setEditingId(null); }}>Save</button>
              <button className="btn-sw-ghost py-1"    style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem' }} onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="comment-text">
              {renderCommentText(comment.content, onHashtagClick)}
            </div>
            {comment.image_url && (
              <img src={comment.image_url} alt="comment" style={{ maxWidth: 120, borderRadius: 6, marginTop: 4, border: '1px solid var(--sw-border)' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found' }} />
            )}
            {comment.file_url && (
              <div style={{ marginTop: 4 }}>
                <a href={comment.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--sw-accent)' }}>
                  <i className="bi bi-paperclip me-1"></i>Attachment
                </a>
              </div>
            )}

            {/* Actions: Like, Reply, Edit, Delete */}
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem', alignItems: 'center' }}>
              <button className={`btn-sw-ghost py-0 px-1 ${isLiked ? 'liked' : ''}`} style={{ fontSize: '0.75rem', color: isLiked ? 'var(--sw-danger)' : 'inherit' }} onClick={handleToggleLike}>
                <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>{likesCount} Like
              </button>
              
              {!comment.parent_id && (
                <button className="btn-sw-ghost py-0 px-1" style={{ fontSize: '0.75rem' }} onClick={() => setShowReplyForm(!showReplyForm)}>
                  <i className="bi bi-reply me-1"></i>Reply
                </button>
              )}

              {Number(user?.id) === Number(comment.user_id) && (
                <>
                  <button className="btn-sw-ghost py-0 px-1" style={{ fontSize: '0.75rem' }} onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}>
                    <i className="bi bi-pencil me-1"></i>Edit
                  </button>
                  <button className="btn-sw-danger py-0 px-1" style={{ fontSize: '0.75rem' }} onClick={() => handleDeleteComment(comment.id)}>
                    <i className="bi bi-trash me-1"></i>Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Reply Form */}
        {showReplyForm && (
            <form onSubmit={submitReply} style={{ marginTop: '0.5rem' }}>
              <textarea
                className="sw-form-control form-control"
                rows={1}
                placeholder="Write a reply..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                maxLength={MAX_CHARS}
                style={{ resize: 'none', fontSize: '0.8rem' }}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-sw-primary py-0" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }} disabled={!replyContent.trim()}>Reply</button>
                 <button type="button" className="btn-sw-ghost py-0" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }} onClick={() => setShowReplyForm(false)}>Cancel</button>
              </div>
            </form>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="nested-replies" style={{ marginTop: '0.5rem' }}>
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                user={user} 
                postId={postId} 
                onHashtagClick={onHashtagClick} 
                handleSaveEdit={handleSaveEdit} 
                handleDeleteComment={handleDeleteComment} 
                handleReplySubmit={handleReplySubmit} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ postId, initialComments = [], onHashtagClick }) {
  const { user }                = useAuth()
  const [comments, setComments] = useState(initialComments)
  const [loading, setLoading]   = useState(false)
  const [content, setContent]   = useState('')
  const [imageFile, setImageFile]   = useState(null)
  const [attachFile, setAttachFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const imageRef = useRef()
  const fileRef  = useRef()

  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments()
    }
  }, [postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/posts/${postId}/comments`)
      setComments(res.data.data.data ?? [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!content.trim() || content.length > MAX_CHARS) return
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('content', content)
      if (imageFile)  formData.append('image', imageFile)
      if (attachFile) formData.append('file', attachFile)

      const res = await api.post(`/posts/${postId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data.data.status === 'approved') {
        setComments(prev => [res.data.data, ...prev])
      } else {
        setError(`Comment submitted: ${res.data.message}`)
      }
      setContent('')
      setImageFile(null)
      setAttachFile(null)
      setImagePreview(null)
      if (imageRef.current) imageRef.current.value = ''
      if (fileRef.current)  fileRef.current.value  = ''
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentId, replyContent) => {
    try {
      const formData = new FormData()
      formData.append('content', replyContent)
      formData.append('parent_id', parentId)

      const res = await api.post(`/posts/${postId}/comments`, formData)
      
      if (res.data.data.status === 'approved') {
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), res.data.data]
            }
          }
          return c
        }))
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post reply.')
    }
  }

  const handleSaveEdit = async (commentId, editContent) => {
    if (!editContent.trim()) return
    try {
      const formData = new FormData()
      formData.append('content', editContent)

      const res = await api.post(`/posts/${postId}/comments/${commentId}`, formData)
      
      // Update either top-level or reply
      setComments(prev => prev.map(c => {
        if (c.id === commentId) return { ...c, ...res.data.data }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => r.id === commentId ? { ...r, ...res.data.data } : r)
          }
        }
        return c
      }))
    } catch {
      alert('Failed to update comment.')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await api.delete(`/posts/${postId}/comments/${commentId}`)
      
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => {
         if (c.replies) {
           return { ...c, replies: c.replies.filter(r => r.id !== commentId) }
         }
         return c
      }))
    } catch {
      alert('Failed to delete comment.')
    }
  }

  const charsLeft    = MAX_CHARS - content.length
  const counterClass = charsLeft <= 0 ? 'at-limit' : charsLeft <= 30 ? 'near-limit' : ''

  return (
    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--sw-border)' }}>
      {error && (
        <div className="alert alert-info py-2 mb-2" style={{ fontSize: '0.8rem' }}>
          {error}
          <button className="btn-close btn-sm float-end" style={{ filter: 'invert(1)' }} onClick={() => setError('')}></button>
        </div>
      )}

      {/* Comment input form */}
      <form onSubmit={handleSubmitComment} className="mb-3">
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
          <Avatar user={user} size={32} />
          <div style={{ flex: 1 }}>
            <textarea
              className="sw-form-control form-control"
              rows={2}
              placeholder="Write a comment… #hashtags welcome"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={MAX_CHARS}
              style={{ resize: 'none', fontSize: '0.875rem' }}
            />
            <div className={`char-counter ${counterClass}`}>{charsLeft}</div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <label className="btn-sw-ghost py-1 px-2" style={{ cursor: 'pointer', fontSize: '0.78rem' }}>
                <i className="bi bi-image me-1"></i>Photo
                <input type="file" accept="image/*" hidden ref={imageRef} onChange={e => {
                  const f = e.target.files[0]; if (!f) return
                  setImageFile(f); setImagePreview(URL.createObjectURL(f))
                }} />
              </label>
              <label className="btn-sw-ghost py-1 px-2" style={{ cursor: 'pointer', fontSize: '0.78rem' }}>
                <i className="bi bi-paperclip me-1"></i>File
                <input type="file" accept=".pdf,.doc,.docx,.txt,.zip" hidden ref={fileRef} onChange={e => setAttachFile(e.target.files[0] || null)} />
              </label>
              <button
                type="submit"
                className="btn-sw-primary ms-auto"
                disabled={submitting || !content.trim() || content.length > MAX_CHARS}
                style={{ padding: '0.3rem 1rem', fontSize: '0.82rem' }}
              >
                {submitting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-send me-1"></i>Reply</>}
              </button>
            </div>

            {imagePreview && (
              <div className="file-preview mt-1">
                <img src={imagePreview} alt="preview" />
                <span style={{ fontSize: '0.75rem' }}>Image ready</span>
                <button type="button" className="btn-sw-ghost ms-auto py-0 px-1" onClick={() => { setImageFile(null); setImagePreview(null); if (imageRef.current) imageRef.current.value = '' }}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
            {attachFile && (
              <div className="file-preview mt-1">
                <i className="bi bi-paperclip" style={{ color: 'var(--sw-accent)' }}></i>
                <span style={{ fontSize: '0.75rem' }}>{attachFile.name}</span>
                <button type="button" className="btn-sw-ghost ms-auto py-0 px-1" onClick={() => { setAttachFile(null); if (fileRef.current) fileRef.current.value = '' }}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Comment list */}
      {loading ? (
        <div className="text-center py-2">
          <span className="spinner-border spinner-border-sm spinner-sw"></span>
        </div>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--sw-text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
          No comments yet. Be the first!
        </p>
      ) : (
        comments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            user={user} 
            postId={postId} 
            onHashtagClick={onHashtagClick} 
            handleSaveEdit={handleSaveEdit} 
            handleDeleteComment={handleDeleteComment} 
            handleReplySubmit={handleReplySubmit} 
          />
        ))
      )}
    </div>
  )
}
