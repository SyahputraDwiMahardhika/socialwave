/**
 * Navbar.jsx
 *
 * Top navigation bar shown on all authenticated pages.
 * Shows different links based on user role (admin gets admin link).
 * Includes logout functionality.
 */

import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Navbar as BSNavbar, Nav, Container, Dropdown } from 'react-bootstrap'
import NotificationDropdown from './NotificationDropdown'

/**
 * Renders a user avatar: profile picture if available, else initials placeholder.
 *
 * @param {{ user: object, size: number }} props
 */
function Avatar({ user, size = 34 }) {
  if (user?.profile_picture_url) {
    return (
      <img
        src={user.profile_picture_url}
        alt={user.name}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--sw-border)' }}
      />
    )
  }
  return (
    <div
      className="post-card author-avatar placeholder-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {user?.name?.charAt(0).toUpperCase()}
    </div>
  )
}

/**
 * Navbar component
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const location         = useLocation()
  const navigate         = useNavigate()

  /**
   * handleLogout
   * Calls logout from AuthContext then navigates to login page.
   */
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <BSNavbar className="sw-navbar" expand="md">
      <Container>
        {/* Brand logo */}
        <BSNavbar.Brand as={Link} to="/">
          ◈ Social<span>Wave</span>
        </BSNavbar.Brand>

        <BSNavbar.Toggle aria-controls="sw-nav" style={{ borderColor: 'var(--sw-border)' }} />

        <BSNavbar.Collapse id="sw-nav">
          {/* Left nav links */}
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
            >
              <i className="bi bi-house me-1"></i> Feed
            </Nav.Link>

            {/* Show Admin link only for admin users */}
            {user?.role === 'admin' && (
              <Nav.Link
                as={Link}
                to="/admin"
                className={`admin-link ${location.pathname === '/admin' ? 'active' : ''}`}
              >
                <i className="bi bi-shield-check me-1"></i> Admin
              </Nav.Link>
            )}
            
            <Nav.Link
              as={Link}
              to="/search"
              className={location.pathname === '/search' ? 'active' : ''}
            >
              <i className="bi bi-search me-1"></i> Search
            </Nav.Link>
          </Nav>

          {/* Right: user dropdown */}
          <Nav className="align-items-center">
            <NotificationDropdown />
            
            <Dropdown align="end" className="ms-2">
              <Dropdown.Toggle
                as="div"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Avatar user={user} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--sw-text)' }}>
                  {user?.name}
                </span>
                {user?.role === 'admin' && (
                  <span className="sw-badge badge-pending" style={{ fontSize: '0.65rem' }}>
                    Admin
                  </span>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person me-2"></i> Profile
                </Dropdown.Item>
                <Dropdown.Divider style={{ borderColor: 'var(--sw-border)' }} />
                <Dropdown.Item onClick={handleLogout} style={{ color: 'var(--sw-danger) !important' }}>
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  )
}

export { Avatar }
