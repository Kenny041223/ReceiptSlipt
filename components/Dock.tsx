'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { BreakReceipt, HomeIcon, UsersIcon } from './Icons'

export default function Dock() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  // Hide the dock on the login screen / when signed out
  if (!user || pathname === '/login') return null

  return (
    <div className="dock-wrap">
      <div className="dock">
        <button
          className={`dock__btn ${pathname.startsWith('/friends') ? 'is-active' : ''}`}
          onClick={() => router.push('/friends')}
          aria-label="Friends"
        >
          <UsersIcon />
        </button>
        <button className="dock__cam" onClick={() => router.push('/')} aria-label="New scan">
          <BreakReceipt />
        </button>
        <button
          className={`dock__btn ${pathname === '/dashboard' ? 'is-active' : ''}`}
          onClick={() => router.push('/dashboard')}
          aria-label="Dashboard"
        >
          <HomeIcon />
        </button>
      </div>
    </div>
  )
}
