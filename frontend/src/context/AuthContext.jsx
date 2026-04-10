/**
 * AuthContext.jsx
 *
 * Provides global authentication state to the entire app.
 * Stores user data and token in localStorage for persistence.
 * Exposes login, logout, and updateUser helpers.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

// Create the context
const AuthContext = createContext(null)

/**
 * AuthProvider
 *
 * Wraps the app and provides auth state.
 * On mount, validates the stored token by calling /auth/me.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(localStorage.getItem('sw_token'))
  const [loading, setLoading] = useState(true)

  /**
   * On mount: if a token is stored, fetch the current user
   * to validate the token and hydrate user state.
   */
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.data))
        .catch(() => {
          // Token invalid — clear storage
          localStorage.removeItem('sw_token')
          localStorage.removeItem('sw_user')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  /**
   * login — Store token and user data after successful login/register.
   *
   * @param {string} newToken - Sanctum plain-text token
   * @param {object} userData - User object from API
   */
  const login = (newToken, userData) => {
    localStorage.setItem('sw_token', newToken)
    localStorage.setItem('sw_user', JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
  }

  /**
   * logout — Clear token and user from state and localStorage.
   */
  const logout = () => {
    api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('sw_token')
    localStorage.removeItem('sw_user')
    setToken(null)
    setUser(null)
  }

  /**
   * updateUser — Update user state after profile update.
   *
   * @param {object} updatedUser
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('sw_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth — Hook to consume AuthContext.
 * Must be used inside an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
