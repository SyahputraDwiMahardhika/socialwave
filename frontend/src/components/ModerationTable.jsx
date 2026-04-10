/**
 * ModerationTable.jsx
 *
 * Reusable table component for the admin moderation panel.
 * Works for both posts and comments.
 *
 * Moderation model (v2 — post-publication):
 *  - No "Approve" button (content auto-publishes)
 *  - Actions: Reject (hides from feed) | Delete (permanent)
 *  - Flagged badge shown prominently on flagged content
 *  - Rejected badge shown on already-rejected content
 */

import React from 'react'
import { Table } from 'react-bootstrap'

/**
 * ModerationTable
 *
 * @param {{
 *   items: object[],
 *   type: 'post'|'comment',
 *   onReject: function,
 *   onDelete: function,
 *   loading: boolean
 * }} props
 */
export default function ModerationTable({ items, type, onReject, onDelete, loading }) {

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-sw" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-check-circle" style={{ color: 'var(--sw-approved)' }}></i>
        <p>No {type}s to review. All clear!</p>
      </div>
    )
  }

  return (
    <div className="mod-table">
      <Table responsive hover className="mb-0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Author</th>
            <th>Content</th>
            {type === 'comment' && <th>Post ID</th>}
            <th>Status</th>
            <th>Flag</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr
              key={item.id}
              style={{
                // Highlight rows that are flagged + still approved (need action)
                background: item.is_flagged && item.status === 'approved'
                  ? 'rgba(230,126,34,0.05)'
                  : undefined,
              }}
            >
              {/* ID */}
              <td style={{ color: 'var(--sw-text-muted)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                #{item.id}
              </td>

              {/* Author */}
              <td>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sw-text-muted)' }}>{item.user?.email}</div>
              </td>

              {/* Content preview */}
              <td>
                <div style={{ maxWidth: 240, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.content}
                </div>
                {item.image_url && (
                  <a href={item.image_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--sw-accent)' }}>
                    <i className="bi bi-image me-1"></i>Image
                  </a>
                )}
              </td>

              {/* Post ID for comments */}
              {type === 'comment' && (
                <td style={{ color: 'var(--sw-text-muted)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  #{item.post_id}
                </td>
              )}

              {/* Status badge */}
              <td>
                <span className={`sw-badge badge-${item.status}`}>
                  {item.status}
                </span>
              </td>

              {/* Flagged badge */}
              <td>
                {item.is_flagged ? (
                  <span
                    className="sw-badge badge-flagged"
                    title="This content was auto-flagged for containing negative keywords"
                    style={{ cursor: 'help' }}
                  >
                    <i className="bi bi-flag-fill me-1"></i>Flagged
                  </span>
                ) : (
                  <span style={{ color: 'var(--sw-text-muted)', fontSize: '0.8rem' }}>—</span>
                )}
              </td>

              {/* Date */}
              <td style={{ fontSize: '0.78rem', color: 'var(--sw-text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(item.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </td>

              {/* Action buttons */}
              <td>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>

                  {/* Reject button — only if not already rejected */}
                  {item.status !== 'rejected' && (
                    <button
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(243,156,18,0.15)',
                        color: '#c0870a',
                        border: '1px solid rgba(243,156,18,0.35)',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => onReject(item.id)}
                      title="Reject — hide this content from the public feed"
                    >
                      <i className="bi bi-slash-circle me-1"></i>Reject
                    </button>
                  )}

                  {/* Already rejected indicator */}
                  {item.status === 'rejected' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--sw-rejected, #e74c3c)', fontStyle: 'italic', alignSelf: 'center' }}>
                      Already rejected
                    </span>
                  )}

                  {/* Delete button — always available */}
                  <button
                    className="btn btn-sm"
                    style={{
                      background: 'rgba(231,76,60,0.15)',
                      color: 'var(--sw-rejected, #e74c3c)',
                      border: '1px solid rgba(231,76,60,0.3)',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                    }}
                    onClick={() => onDelete(item.id)}
                    title="Delete permanently"
                  >
                    <i className="bi bi-trash3"></i>
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
