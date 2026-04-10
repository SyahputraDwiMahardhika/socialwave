/**
 * LoginPage.jsx
 *
 * User login page.
 * Submits credentials to POST /api/auth/login.
 * On success, stores token + user in AuthContext and redirects to feed.
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function LoginPage() {
  const { login }     = useAuth()
  const navigate      = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  /**
   * handleChange — updates the form field state on every keystroke.
   */
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  /**
   * handleSubmit — POSTs credentials to the API.
   * On success: calls login() then navigates to the feed.
   * On failure: displays the error message from the API.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/login', form)
      const { token, user } = res.data.data
      login(token, user)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">◈ SocialWave</div>
        <div className="auth-subtitle">Sign in to your account</div>

        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="sw-label">Email</label>
            <input
              type="email"
              name="email"
              className="sw-form-control form-control"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="sw-label">Password</label>
            <input
              type="password"
              name="password"
              className="sw-form-control form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-sw-primary w-100"
            style={{ padding: '0.65rem' }}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in…</>
              : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
            }
          </button>
        </form>

        <hr className="divider my-3" />

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--sw-text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--sw-accent)', fontWeight: 600 }}>
            Create one
          </Link>
        </p>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'var(--sw-surface2)',
          borderRadius: 'var(--sw-radius-sm)',
          border: '1px solid var(--sw-border)',
          fontSize: '0.78rem',
          color: 'var(--sw-text-muted)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--sw-text)' }}>
            <i className="bi bi-info-circle me-1" style={{ color: 'var(--sw-accent)' }}></i>
            Demo Accounts
          </div>
          <div>Admin: <code style={{ color: 'var(--sw-accent)' }}>admin@socialwave.com</code> / admin123</div>
          <div>User: <code style={{ color: 'var(--sw-accent)' }}>budi@example.com</code> / 12345678</div>
        </div>
      </div>
    </div>
  )
}
