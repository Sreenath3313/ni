import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export const useAuthSession = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth()
      } catch (err) {
        console.error('Error checking authentication:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [checkAuth])

  return { isLoading }
}
