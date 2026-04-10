/**
 * PostFormModal.jsx
 *
 * Reusable modal for creating or editing a post.
 * Supports text content (max 250 chars), image upload, file upload.
 * Shows a character counter that warns when approaching the limit.
 * Shows image preview before upload.
 */

import React, { useState, useEffect, useRef } from 'react'
import { Modal, Alert } from 'react-bootstrap'
import api from '../services/api'

const MAX_CHARS = 250

/**
 * PostFormModal
 *
 * @param {{
 *   show: boolean,
 *   onHide: function,
 *   existingPost: object|null,
 *   onSuccess: function
 * }} props
 */
export default function PostFormModal({ show, onHide, existingPost = null, onSuccess }) {
  const [content, setContent]         = useState('')
  const [imageFile, setImageFile]     = useState(null)
  const [attachFile, setAttachFile]   = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  const imageRef = useRef()
  const fileRef  = useRef()

  const isEditing = !!existingPost

  /**
   * Populate form fields when editing an existing post.
   */
  useEffect(() => {
    if (existingPost) {
      setContent(existingPost.content ?? '')
      setImagePreview(existingPost.image_url ?? null)
    } else {
      setContent('')
      setImagePreview(null)
    }
    setError('')
    setSuccess('')
    setImageFile(null)
    setAttachFile(null)
  }, [existingPost, show])

  /**
   * handleImageChange
   * Reads the selected image file and generates a local preview URL.
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  /**
   * handleSubmit
   * Sends a POST (create) or POST (update via _method override) request.
   * Uses FormData to support file uploads.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('Post content cannot be empty.')
      return
    }
    if (content.length > MAX_CHARS) {
      setError(`Content must be ${MAX_CHARS} characters or less.`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Build FormData for multipart form upload
      const formData = new FormData()
      formData.append('content', content)
      if (imageFile)  formData.append('image', imageFile)
      if (attachFile) formData.append('file', attachFile)

      let response
      if (isEditing) {
        // Laravel doesn't natively support PUT with multipart, so we use POST
        response = await api.post(`/posts/${existingPost.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        response = await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setSuccess(response.data.message)
      onSuccess(response.data.data)

      // Reset form after short delay
      setTimeout(() => {
        setContent('')
        setImageFile(null)
        setAttachFile(null)
        setImagePreview(null)
        setSuccess('')
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.message
        || Object.values(err.response?.data?.errors ?? {})[0]?.[0]
        || 'Failed to submit post. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  /** Compute character counter style class */
  const charsLeft  = MAX_CHARS - content.length
  const counterClass = charsLeft <= 0 ? 'at-limit' : charsLeft <= 30 ? 'near-limit' : ''

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`bi ${isEditing ? 'bi-pencil-square' : 'bi-plus-square'} me-2`} style={{ color: 'var(--sw-accent)' }}></i>
          {isEditing ? 'Edit Post' : 'New Post'}
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error   && <Alert variant="danger"  className="py-2">{error}</Alert>}
          {success && <Alert variant="success" className="py-2">{success}</Alert>}

          {/* Content textarea */}
          <div className="mb-3">
            <label className="sw-label">What's on your mind?</label>
            <textarea
              className="sw-form-control form-control"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something... use #hashtags to categorize your post"
              maxLength={MAX_CHARS}
              style={{ resize: 'none' }}
            />
            <div className={`char-counter mt-1 ${counterClass}`}>
              {charsLeft} characters remaining
            </div>
          </div>

          {/* Image upload */}
          <div className="mb-3">
            <label className="sw-label">Image (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
              className="sw-form-control form-control"
              ref={imageRef}
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="file-preview mt-2">
                <img src={imagePreview} alt="Preview" />
                <span>Image selected</span>
                <button
                  type="button"
                  className="btn-sw-ghost ms-auto py-0 px-2"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    if (imageRef.current) imageRef.current.value = ''
                  }}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
          </div>

          {/* File upload */}
          <div className="mb-1">
            <label className="sw-label">File Attachment (optional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.zip"
              className="sw-form-control form-control"
              ref={fileRef}
              onChange={(e) => setAttachFile(e.target.files[0] || null)}
            />
            {attachFile && (
              <div className="file-preview mt-2">
                <i className="bi bi-paperclip" style={{ color: 'var(--sw-accent)' }}></i>
                <span>{attachFile.name}</span>
                <button
                  type="button"
                  className="btn-sw-ghost ms-auto py-0 px-2"
                  onClick={() => {
                    setAttachFile(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn-sw-ghost" onClick={onHide} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-sw-primary"
            disabled={loading || !content.trim() || content.length > MAX_CHARS}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</>
            ) : (
              <><i className={`bi ${isEditing ? 'bi-check-lg' : 'bi-send'} me-1`}></i>
              {isEditing ? 'Save Changes' : 'Post'}</>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
