/**
 * App.jsx
 *
 * Root component. Sets up:
 *  - AuthProvider for global auth state
 *  - React Router with all page routes
 *  - Protected route guards
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import HomePage        from './pages/HomePage'
import ProfilePage     from './pages/ProfilePage'
import AdminDashboard  from './pages/AdminDashboard'
import UserProfilePage from './pages/UserProfilePage'
import SearchPage      from './pages/SearchPage'

// Layout
import Navbar from './components/Navbar'

/**
 * ProtectedRoute
 *
 * Redirects to /login if user is not authenticated.
 * Shows a loading spinner while auth state is being resolved.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border spinner-sw" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

/**
 * AdminRoute
 *
 * Extends ProtectedRoute: also checks that user has 'admin' role.
 * Redirects to home if authenticated but not admin.
 */
function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border spinner-sw" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  return children
}

/**
 * GuestRoute
 *
 * Redirects to home if user is already logged in.
 * Used for Login and Register pages.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border spinner-sw" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  return !user ? children : <Navigate to="/" replace />
}

/**
 * AppRoutes
 *
 * Defines the route tree. Navbar is shown on all protected pages.
 */
function AppRoutes() {
  const { user } = useAuth()

  return (
    <>
      {/* Show navbar only when logged in */}
      {user && <Navbar />}

      <Routes>
        {/* Guest-only routes */}
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/user/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

        {/* Admin-only route */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Catch-all: redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

/**
 * App
 *
 * Wraps everything in BrowserRouter and AuthProvider.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
