import React from 'react'
import { Link } from 'react-router-dom'
import { Frown } from 'lucide-react'

const NotFoundPage: React.FC = () => {
  const palette = {
    primary: '#9E7FFF',
    background: '#171717',
    surface: '#262626',
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    border: '#2F2F2F',
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 text-center"
      style={{ backgroundColor: palette.background, color: palette.text }}
    >
      <Frown size={64} style={{ color: palette.primary }} className="mb-6" />
      <h1 className="text-5xl font-extrabold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4" style={{ color: palette.textSecondary }}>
        Page Not Found
      </h2>
      <p className="text-lg mb-8 max-w-md" style={{ color: palette.textSecondary }}>
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center py-3 px-6 rounded-lg text-lg font-medium transition-all duration-300 ease-in-out"
        style={{
          backgroundColor: palette.primary,
          color: palette.text,
          boxShadow: `0 4px 15px rgba(158, 127, 255, 0.4)`,
        }}
      >
        Go to Homepage
      </Link>
    </div>
  )
}

export default NotFoundPage
