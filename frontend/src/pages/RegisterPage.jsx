/**
 * RegisterPage.jsx
 *
 * New user registration page.
 * Submits form to POST /api/auth/register.
 * On success, logs the user in automatically and navigates to the feed.
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function RegisterPage() {
  const { login }     = useAuth()
  const navigate      = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  /**
   * handleChange — updates form state on every keystroke.
   */
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    // Clear field-level error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  /**
   * handleSubmit — POSTs registration data to the API.
   * Handles Laravel validation errors (422) by displaying per-field messages.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const res = await api.post('/auth/register', form)
      const { token, user } = res.data.data
      login(token, user)
      navigate('/')
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        // Map Laravel validation errors to field-level messages
        const errs = {}
        Object.entries(err.response.data.errors).forEach(([field, msgs]) => {
          errs[field] = msgs[0]
        })
        setFieldErrors(errs)
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">◈ SocialWave</div>
        <div className="auth-subtitle">Create your account</div>

        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-3">
            <label className="sw-label">Full Name</label>
            <input
              type="text"
              name="name"
              className={`sw-form-control form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
            {fieldErrors.name && (
              <div className="invalid-feedback" style={{ color: 'var(--sw-danger)', fontSize: '0.78rem' }}>
                {fieldErrors.name}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="sw-label">Email</label>
            <input
              type="email"
              name="email"
              className={`sw-form-control form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && (
              <div className="invalid-feedback" style={{ color: 'var(--sw-danger)', fontSize: '0.78rem' }}>
                {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="sw-label">Password</label>
            <input
              type="password"
              name="password"
              className={`sw-form-control form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
            {fieldErrors.password && (
              <div className="invalid-feedback" style={{ color: 'var(--sw-danger)', fontSize: '0.78rem' }}>
                {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="sw-label">Confirm Password</label>
            <input
              type="password"
              name="password_confirmation"
              className="sw-form-control form-control"
              placeholder="Repeat your password"
              value={form.password_confirmation}
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
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating account…</>
              : <><i className="bi bi-person-plus me-2"></i>Create Account</>
            }
          </button>
        </form>

        <hr className="divider my-3" />

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--sw-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--sw-accent)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
