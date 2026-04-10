import React from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from './Navbar'

export default function UserCard({ user }) {
  return (
    <div className="post-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
      <Link to={`/user/${user.id}`}>
        <Avatar user={user} size={50} />
      </Link>
      <div style={{ flex: 1 }}>
        <Link to={`/user/${user.id}`} style={{ textDecoration: 'none', color: 'var(--sw-text)' }}>
          <h5 style={{ margin: 0, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>{user.name}</h5>
        </Link>
        <div style={{ fontSize: '0.8rem', color: 'var(--sw-text-muted)', marginTop: '0.2rem' }}>
          {user.followers_count ?? 0} Followers &bull; {user.following_count ?? 0} Following
        </div>
        {user.bio && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--sw-text)' }}>
            {user.bio.length > 80 ? user.bio.substring(0, 80) + '...' : user.bio}
          </p>
        )}
      </div>
      <div>
        <Link to={`/user/${user.id}`} className="btn-sw-ghost py-1 px-3" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>
          View Profile
        </Link>
      </div>
    </div>
  )
}
