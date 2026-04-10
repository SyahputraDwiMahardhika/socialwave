/**
 * AdminDashboard.jsx
 *
 * Admin-only post-publication moderation panel.
 *
 * MODERATION PHILOSOPHY (v2):
 *  - Admin does NOT approve content (all content auto-publishes)
 *  - Admin ONLY reviews flagged content (is_flagged = true)
 *  - Admin can: Reject (hide from feed) or Delete
 *  - "pending" status removed — no approval queue
 *
 * Features:
 *  - Statistics cards (flagged posts, flagged comments, rejected, total)
 *  - Flagged Posts table with Reject / Delete actions
 *  - Flagged Comments table with Reject / Delete actions
 *  - Filter: Flagged (default) | Rejected | All
 *  - User list view
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Tab, Tabs, Alert } from 'react-bootstrap'
import ModerationTable from '../components/ModerationTable'
import api from '../services/api'

export default function AdminDashboard() {
  // Statistics state
  const [stats, setStats]               = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Posts moderation state
  const [posts, setPosts]               = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  // Filter: 'flagged' (default) | 'rejected' | 'all'
  const [postFilter, setPostFilter]     = useState('flagged')

  // Comments moderation state
  const [comments, setComments]               = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentFilter, setCommentFilter]     = useState('flagged')

  // Users state
  const [users, setUsers]               = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Action feedback
  const [actionMsg, setActionMsg]     = useState('')
  const [actionError, setActionError] = useState('')

  const showSuccess = (msg) => {
    setActionMsg(msg)
    setActionError('')
    setTimeout(() => setActionMsg(''), 3000)
  }

  const showError = (msg) => {
    setActionError(msg)
    setActionMsg('')
    setTimeout(() => setActionError(''), 4000)
  }

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await api.get('/admin/dashboard')
      setStats(res.data.data)
    } catch {
      // silent fail
    } finally {
      setStatsLoading(false)
    }
  }, [])

  /**
   * fetchPosts — loads posts for moderation.
   *
   * filter values:
   *  'flagged'  → ?flagged=true  (default admin review queue)
   *  'rejected' → ?flagged=false&status=rejected
   *  'all'      → ?flagged=false
   */
  const fetchPosts = useCallback(async (filter = 'flagged') => {
    setPostsLoading(true)
    try {
      const params = {}
      if (filter === 'flagged') {
        params.flagged = 'true'
      } else if (filter === 'rejected') {
        params.flagged = 'false'
        params.status  = 'rejected'
      } else {
        params.flagged = 'false'
      }
      const res = await api.get('/admin/posts', { params })
      setPosts(res.data.data.data ?? [])
    } catch {
      // silent fail
    } finally {
      setPostsLoading(false)
    }
  }, [])

  const fetchComments = useCallback(async (filter = 'flagged') => {
    setCommentsLoading(true)
    try {
      const params = {}
      if (filter === 'flagged') {
        params.flagged = 'true'
      } else if (filter === 'rejected') {
        params.flagged = 'false'
        params.status  = 'rejected'
      } else {
        params.flagged = 'false'
      }
      const res = await api.get('/admin/comments', { params })
      setComments(res.data.data.data ?? [])
    } catch {
      // silent fail
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.data.data ?? [])
    } catch {
      // silent fail
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchPosts('flagged')
    fetchComments('flagged')
  }, [])

  useEffect(() => { fetchPosts(postFilter) },    [postFilter])
  useEffect(() => { fetchComments(commentFilter) }, [commentFilter])

  // ============================================================
  // POST MODERATION ACTIONS
  // ============================================================

  const handleRejectPost = async (id) => {
    try {
      await api.patch(`/admin/posts/${id}/reject`)
      showSuccess(`Post #${id} rejected and removed from feed.`)
      fetchPosts(postFilter)
      fetchStats()
    } catch {
      showError('Failed to reject post.')
    }
  }

  const handleDeletePost = async (id) => {
    if (!window.confirm(`Permanently delete post #${id}? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/posts/${id}`)
      showSuccess(`Post #${id} deleted.`)
      setPosts(prev => prev.filter(p => p.id !== id))
      fetchStats()
    } catch {
      showError('Failed to delete post.')
    }
  }

  // ============================================================
  // COMMENT MODERATION ACTIONS
  // ============================================================

  const handleRejectComment = async (id) => {
    try {
      await api.patch(`/admin/comments/${id}/reject`)
      showSuccess(`Comment #${id} rejected.`)
      fetchComments(commentFilter)
      fetchStats()
    } catch {
      showError('Failed to reject comment.')
    }
  }

  const handleDeleteComment = async (id) => {
    if (!window.confirm(`Permanently delete comment #${id}?`)) return
    try {
      await api.delete(`/admin/comments/${id}`)
      showSuccess(`Comment #${id} deleted.`)
      setComments(prev => prev.filter(c => c.id !== id))
      fetchStats()
    } catch {
      showError('Failed to delete comment.')
    }
  }

  // ============================================================
  // FILTER PILLS
  // ============================================================

  const filterOptions = [
    { value: 'flagged',  label: '🚩 Flagged',  title: 'Show auto-flagged content awaiting review' },
    { value: 'rejected', label: '✕ Rejected',  title: 'Show content you have already rejected' },
    { value: 'all',      label: '☰ All',       title: 'Show all posts regardless of status' },
  ]

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="sw-main">
      <Container fluid="lg">

        {/* Page header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            <i className="bi bi-shield-exclamation me-2" style={{ color: 'var(--sw-accent)' }}></i>
            Content Moderation
          </h1>
          <p style={{ color: 'var(--sw-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            All content is auto-published. Review flagged items and reject or delete where necessary.
          </p>
        </div>

        {/* Action feedback */}
        {actionMsg   && <Alert variant="success" dismissible onClose={() => setActionMsg('')}  className="py-2 mb-3">{actionMsg}</Alert>}
        {actionError && <Alert variant="danger"  dismissible onClose={() => setActionError('')} className="py-2 mb-3">{actionError}</Alert>}

        {/* ── STATISTICS CARDS ── */}
        {statsLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-sw"></div>
          </div>
        ) : stats && (
          <Row className="g-3 mb-4">

            {/* Flagged Posts */}
            <Col xs={6} md={3}>
              <div className="admin-stat-card" style={{ borderLeft: '3px solid var(--sw-flagged, #e67e22)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="admin-stat-number" style={{ color: '#e67e22' }}>{stats.posts.flagged}</div>
                    <div className="admin-stat-label">Flagged Posts</div>
                  </div>
                  <i className="bi bi-flag-fill" style={{ fontSize: '1.5rem', color: '#e67e22', opacity: 0.7 }}></i>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sw-text-muted)', marginTop: '0.5rem' }}>
                  Awaiting review
                </div>
              </div>
            </Col>

            {/* Flagged Comments */}
            <Col xs={6} md={3}>
              <div className="admin-stat-card" style={{ borderLeft: '3px solid var(--sw-flagged, #e67e22)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="admin-stat-number" style={{ color: '#e67e22' }}>{stats.comments.flagged}</div>
                    <div className="admin-stat-label">Flagged Comments</div>
                  </div>
                  <i className="bi bi-chat-left-text" style={{ fontSize: '1.5rem', color: '#e67e22', opacity: 0.7 }}></i>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sw-text-muted)', marginTop: '0.5rem' }}>
                  Awaiting review
                </div>
              </div>
            </Col>

            {/* Total Posts */}
            <Col xs={6} md={3}>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="admin-stat-number">{stats.posts.total}</div>
                    <div className="admin-stat-label">Total Posts</div>
                  </div>
                  <i className="bi bi-file-text" style={{ fontSize: '1.5rem', color: 'var(--sw-accent)', opacity: 0.6 }}></i>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="sw-badge badge-approved">{stats.posts.approved} live</span>
                  <span className="sw-badge badge-rejected">{stats.posts.rejected} rejected</span>
                </div>
              </div>
            </Col>

            {/* Total Users */}
            <Col xs={6} md={3}>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="admin-stat-number">{stats.users.total}</div>
                    <div className="admin-stat-label">Total Users</div>
                  </div>
                  <i className="bi bi-people" style={{ fontSize: '1.5rem', color: 'var(--sw-accent)', opacity: 0.6 }}></i>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sw-text-muted)', marginTop: '0.5rem' }}>
                  {stats.users.admins} admin{stats.users.admins !== 1 ? 's' : ''}
                </div>
              </div>
            </Col>
          </Row>
        )}

        {/* ── MODERATION TABS ── */}
        <Tabs
          defaultActiveKey="posts"
          className="mb-3"
          onSelect={(key) => {
            if (key === 'users') fetchUsers()
          }}
        >

          {/* ── POSTS TAB ── */}
          <Tab eventKey="posts" title={
            <span>
              <i className="bi bi-file-text me-1"></i>Posts
              {stats?.posts?.flagged > 0 && (
                <span className="badge rounded-pill ms-1" style={{ background: '#e67e22', color: '#fff', fontSize: '0.7rem' }}>
                  {stats.posts.flagged}
                </span>
              )}
            </span>
          }>
            {/* Instruction banner */}
            <div style={{
              background: 'rgba(230,126,34,0.08)',
              border: '1px solid rgba(230,126,34,0.25)',
              borderRadius: 8,
              padding: '0.6rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              color: 'var(--sw-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <i className="bi bi-info-circle" style={{ color: '#e67e22' }}></i>
              Posts are auto-published. Flagged posts contain detected bad words and are still visible — review and reject if necessary.
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {filterOptions.map(f => (
                <button
                  key={f.value}
                  title={f.title}
                  className={postFilter === f.value ? 'btn-sw-primary' : 'btn-sw-ghost'}
                  style={{ padding: '0.3rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setPostFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <ModerationTable
              items={posts}
              type="post"
              onReject={handleRejectPost}
              onDelete={handleDeletePost}
              loading={postsLoading}
            />
          </Tab>

          {/* ── COMMENTS TAB ── */}
          <Tab eventKey="comments" title={
            <span>
              <i className="bi bi-chat-left-text me-1"></i>Comments
              {stats?.comments?.flagged > 0 && (
                <span className="badge rounded-pill ms-1" style={{ background: '#e67e22', color: '#fff', fontSize: '0.7rem' }}>
                  {stats.comments.flagged}
                </span>
              )}
            </span>
          }>
            <div style={{
              background: 'rgba(230,126,34,0.08)',
              border: '1px solid rgba(230,126,34,0.25)',
              borderRadius: 8,
              padding: '0.6rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              color: 'var(--sw-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <i className="bi bi-info-circle" style={{ color: '#e67e22' }}></i>
              Comments are auto-published. Flagged comments are still visible — review and reject if necessary.
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {filterOptions.map(f => (
                <button
                  key={f.value}
                  title={f.title}
                  className={commentFilter === f.value ? 'btn-sw-primary' : 'btn-sw-ghost'}
                  style={{ padding: '0.3rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setCommentFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <ModerationTable
              items={comments}
              type="comment"
              onReject={handleRejectComment}
              onDelete={handleDeleteComment}
              loading={commentsLoading}
            />
          </Tab>

          {/* ── USERS TAB ── */}
          <Tab eventKey="users" title={<><i className="bi bi-people me-1"></i>Users</>}>
            {usersLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-sw"></div>
              </div>
            ) : (
              <div className="mod-table">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Posts</th>
                      <th>Comments</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--sw-text-muted)', fontFamily: 'monospace', fontSize: '0.875rem' }}>#{u.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {u.profile_picture_url ? (
                              <img src={u.profile_picture_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sw-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sw-accent)', fontSize: '0.8rem', fontWeight: 700 }}>
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--sw-text-muted)' }}>{u.email}</td>
                        <td>
                          <span className={`sw-badge ${u.role === 'admin' ? 'badge-pending' : 'badge-approved'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{u.posts_count}</td>
                        <td style={{ fontSize: '0.875rem' }}>{u.comments_count}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--sw-text-muted)' }}>
                          {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="empty-state py-4">
                    <i className="bi bi-people"></i>
                    <p>No users found.</p>
                  </div>
                )}
              </div>
            )}
          </Tab>

        </Tabs>
      </Container>
    </div>
  )
}
