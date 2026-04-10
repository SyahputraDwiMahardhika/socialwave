/**
 * api.js
 *
 * Configures and exports an Axios instance for all API calls.
 * - Base URL points to the Laravel backend
 * - Automatically attaches the Bearer token from localStorage
 * - Handles 401 Unauthorized by clearing auth and redirecting to login
 */

import axios from 'axios'

// Create the Axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

/**
 * Request Interceptor
 *
 * Runs before every outgoing request.
 * Reads the auth token from localStorage and attaches it
 * as an Authorization header.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sw_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response Interceptor
 *
 * Runs after every response is received.
 * If a 401 Unauthorized response is received, clear
 * local auth data and redirect the user to the login page.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state
      localStorage.removeItem('sw_token')
      localStorage.removeItem('sw_user')
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
