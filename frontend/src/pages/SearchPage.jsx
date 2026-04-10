import React, { useState, useEffect } from 'react'
import { Container, Form } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import UserCard from '../components/UserCard'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(query)

  // Debounced search trigger
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() !== '') {
        setSearchParams({ q: searchTerm })
      } else {
        setSearchParams({})
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, setSearchParams])

  useEffect(() => {
    const fetchSearch = async () => {
      if (!query) {
        setUsers([])
        return
      }
      setLoading(true)
      try {
        const res = await api.get(`/users?search=${encodeURIComponent(query)}`)
        setUsers(res.data.data.data || [])
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchSearch()
  }, [query])

  return (
    <Container className="py-4 mt-5" style={{ maxWidth: 640 }}>
      <div className="post-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: '1rem' }}>Search Users</h4>
        
        <Form.Control
          type="text"
          className="sw-form-control"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-sw"></div>
        </div>
      ) : query && users.length === 0 ? (
        <div className="text-center py-4 text-muted">No users found for "{query}".</div>
      ) : (
        users.map(u => <UserCard key={u.id} user={u} />)
      )}
    </Container>
  )
}
