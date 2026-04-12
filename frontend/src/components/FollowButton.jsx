import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function FollowButton({ targetUserId, isInitiallyFollowing, onToggle }) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing || false)
  const [loading, setLoading] = useState(false)

  // Don't show follow button for self
  if (!user || user.id === targetUserId) return null

  const handleFollowToggle = async () => {
    setLoading(true)
    try {
      if (isFollowing) {
        await api.delete(`/unfollow/${targetUserId}`)
        setIsFollowing(false)
        if (onToggle) onToggle(false)
      } else {
        await api.post(`/follow/${targetUserId}`)
        setIsFollowing(true)
        if (onToggle) onToggle(true)
      }
    } catch (err) {
      console.error('Failed to toggle follow state')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      className={isFollowing ? 'btn-sw-ghost py-1 px-3' : 'btn-sw-primary py-1 px-3'} 
      onClick={handleFollowToggle}
      disabled={loading}
      style={{ fontSize: '0.85rem' }}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm"></span>
      ) : isFollowing ? (
        <><i className="bi bi-person-dash me-1"></i> Unfollow</>
      ) : (
        <><i className="bi bi-person-plus me-1"></i> Follow</>
      )}
    </button>
  )
}
