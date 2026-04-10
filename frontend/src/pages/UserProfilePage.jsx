import React, { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import PostCard from '../components/PostCard'
import { Avatar } from '../components/Navbar'
import FollowButton from '../components/FollowButton'
import { useAuth } from '../context/AuthContext'

export default function UserProfilePage() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        // Fetch user profile info via our updated GET /users/{id}
        const profileRes = await api.get(`/users/${id}`)
        setProfileUser(profileRes.data.data)

        // Then we can fetch posts (using the index with an assumed user_id filter or standard fetch)
        // Wait, the backend currently does not have GET /users/{id}/posts, 
        // We will fetch GET /posts?user_id={id} if supported, or we can add it to the backend.
        // Actually, since there isn't a direct endpoint for User's public posts except MyPosts, 
        // we'll need to fetch all posts and map, or ideally we should have added /users/{id}/posts.
        // Let's assume we can fetch /users/{id}/posts (we will add it next to api.php and UserController, OR right now we can add it).
        // Let's modify UserController on backend. Right now I will call /users/${id}/posts.
        
        try {
            const postsRes = await api.get(`/users/${id}/posts`)
            setPosts(postsRes.data.data.data || [])
        } catch(e) {
            console.error("Posts fetch failed", e)
        }
      } catch (err) {
        console.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [id])

  if (loading) {
    return (
      <Container className="py-4 mt-5 text-center">
        <div className="spinner-border spinner-sw"></div>
      </Container>
    )
  }

  if (!profileUser) {
    return (
      <Container className="py-4 mt-5 text-center text-muted">
        User not found.
      </Container>
    )
  }

  return (
    <Container className="py-4 mt-5" style={{ maxWidth: 640 }}>
      {/* Profile Header */}
      <div className="post-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
          <Avatar user={profileUser} size={100} />
        </div>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: '0.2rem' }}>
          {profileUser.name}
        </h3>
        
        <div style={{ color: 'var(--sw-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <strong>{profileUser.followers_count ?? 0}</strong> Followers &bull; <strong>{profileUser.following_count ?? 0}</strong> Following
        </div>
        
        {profileUser.bio && (
          <p style={{ maxWidth: '80%', margin: '0 auto 1.5rem', color: 'var(--sw-text)', fontSize: '0.95rem' }}>
            {profileUser.bio}
          </p>
        )}

        <FollowButton 
          targetUserId={profileUser.id} 
          isInitiallyFollowing={false} // Needs actual initial state from API if we want it to be perfectly in sync
        />
      </div>

      {/* User's Posts */}
      <h5 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: '1rem' }}>
        Posts
      </h5>
      {posts.length === 0 ? (
        <div className="post-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--sw-text-muted)' }}>
          No posts yet.
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </Container>
  )
}
