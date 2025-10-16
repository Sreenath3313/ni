import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const palette = {
    primary: '#9E7FFF',
    secondary: '#38bdf8',
    accent: '#f472b6',
    background: '#171717',
    surface: '#262626',
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    border: '#2F2F2F',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(username, password)
      console.log('Login successful! Navigating to dashboard.')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login Error:', err)
      setError(err.response?.data?.message || 'Invalid username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: palette.error, color: palette.text }}
        >
          {error}
        </div>
      )}
      <div>
        <label htmlFor="username" className="block text-sm font-medium" style={{ color: palette.textSecondary }}>
          Username
        </label>
        <div className="mt-1">
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
            style={{
              backgroundColor: palette.background,
              borderColor: palette.border,
              color: palette.text,
              '--tw-ring-color': palette.primary,
              '--tw-ring-offset-color': palette.surface,
            } as React.CSSProperties}
            placeholder="admin"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium" style={{ color: palette.textSecondary }}>
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
            style={{
              backgroundColor: palette.background,
              borderColor: palette.border,
              color: palette.text,
              '--tw-ring-color': palette.primary,
              '--tw-ring-offset-color': palette.surface,
            } as React.CSSProperties}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <a href="#" className="font-medium hover:underline" style={{ color: palette.primary }}>
            Forgot your password?
          </a>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: loading ? palette.textSecondary : palette.primary,
            cursor: loading ? 'not-allowed' : 'pointer',
            '--tw-ring-color': palette.primary,
            '--tw-ring-offset-color': palette.surface,
          } as React.CSSProperties}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className="text-center text-sm" style={{ color: palette.textSecondary }}>
        Don't have an account?{' '}
        <Link to="/auth/signup" className="font-medium hover:underline" style={{ color: palette.primary }}>
          Sign up
        </Link>
      </div>
    </form>
  )
}

export default LoginPage
