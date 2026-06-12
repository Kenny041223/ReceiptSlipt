'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { CameraIcon, ProfileIcon, StatsIcon } from './Icons'

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
          className={`dock__btn ${pathname.startsWith('/history') ? 'is-active' : ''}`}
          onClick={() => router.push('/history')}
          aria-label="Activity"
        >
          <StatsIcon />
        </button>
        <button className="dock__cam" onClick={() => router.push('/')} aria-label="New scan">
          <CameraIcon />
        </button>
        <button
          className={`dock__btn ${pathname.startsWith('/friends') ? 'is-active' : ''}`}
          onClick={() => router.push('/friends')}
          aria-label="Friends"
        >
          <ProfileIcon />
        </button>
      </div>
    </div>
  )
}
