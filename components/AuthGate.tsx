'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

const PUBLIC_ROUTES = ['/login']

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace('/login')
    }
  }, [loading, user, isPublic, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Not signed in on a protected route → redirecting, render nothing
  if (!user && !isPublic) return null

  return <>{children}</>
}
