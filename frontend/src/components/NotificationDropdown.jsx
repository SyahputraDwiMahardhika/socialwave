import React, { useState, useEffect } from 'react'
import { Dropdown, Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Avatar } from './Navbar'

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      const notifs = res.data.data || []
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.is_read).length)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Optional: poll every 30s
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (id, is_read) => {
    if (is_read) return
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  const renderDescription = (notif) => {
    const { type, data } = notif
    if (type === 'like_post') return <span><b>{data.sender_name}</b> liked your post.</span>
    if (type === 'comment_post') return <span><b>{data.sender_name}</b> commented on your post.</span>
    if (type === 'follow_user') return <span><b>{data.sender_name}</b> started following you.</span>
    return <span>You have a new notification.</span>
  }

  const renderLink = (notif) => {
    const { type, data } = notif
    if (type === 'follow_user') return `/user/${data.sender_id}`
    // If we had a single post view, it would be /post/:id
    return '/'
  }

  return (
    <Dropdown align="end" className="me-3 d-flex align-items-center">
      <Dropdown.Toggle as="div" style={{ cursor: 'pointer', position: 'relative' }}>
        <i className="bi bi-bell fs-5" style={{ color: 'var(--sw-text)' }}></i>
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            pill 
            style={{ position: 'absolute', top: -4, right: -8, fontSize: '0.6rem' }}
          >
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
        <div className="px-3 py-2 fw-bold border-bottom" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Notifications
        </div>
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No notifications yet.
          </div>
        ) : (
          notifications.map(notif => (
            <Dropdown.Item 
              key={notif.id} 
              as={Link} 
              to={renderLink(notif)}
              onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
              style={{
                backgroundColor: notif.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--sw-border)',
                whiteSpace: 'normal',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              <div className="flex-grow-1">
                <div style={{ fontSize: '0.85rem', color: 'var(--sw-text)' }}>
                  {renderDescription(notif)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--sw-text-muted)' }}>
                  {relativeTime(notif.created_at)}
                </div>
              </div>
              {!notif.is_read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--sw-primary)', marginTop: 4 }}></div>
              )}
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}
