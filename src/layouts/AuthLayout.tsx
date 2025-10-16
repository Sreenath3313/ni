import React from 'react'
import { Outlet } from 'react-router-dom'
import { Package2 } from 'lucide-react' // Using Package2 for a generic telecom/inventory logo

const AuthLayout: React.FC = () => {
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
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: palette.background }}
    >
      <div
        className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-2xl"
        style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}
      >
        <div className="flex flex-col items-center">
          <Package2 size={48} style={{ color: palette.primary }} className="mb-4" />
          <h2
            className="text-3xl font-bold text-center"
            style={{ color: palette.text }}
          >
            Welcome to TIMS
          </h2>
          <p className="mt-2 text-center" style={{ color: palette.textSecondary }}>
            Telecom Inventory Management System
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
