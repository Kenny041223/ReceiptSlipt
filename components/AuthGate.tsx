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
      <div style={{ display: 'grid', placeItems: 'center', padding: '120px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  // Not signed in on a protected route → redirecting, render nothing
  if (!user && !isPublic) return null

  return <>{children}</>
}
