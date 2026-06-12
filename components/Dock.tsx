'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { CameraIcon, ReceiptIcon, StatsIcon } from './Icons'

const FLOW = ['/', '/scan', '/split', '/summary']

export default function Dock() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  // Hide the dock on the login screen / when signed out
  if (!user || pathname === '/login') return null

  const homeActive = FLOW.includes(pathname)
  const historyActive = pathname.startsWith('/history')

  return (
    <div className="dock-wrap">
      <div className="dock">
        <button
          className={`dock__btn ${homeActive ? 'is-active' : ''}`}
          onClick={() => router.push('/')}
          aria-label="Home"
        >
          <ReceiptIcon />
        </button>
        <button className="dock__cam" onClick={() => router.push('/')} aria-label="New scan">
          <CameraIcon />
        </button>
        <button
          className={`dock__btn ${historyActive ? 'is-active' : ''}`}
          onClick={() => router.push('/history')}
          aria-label="History"
        >
          <StatsIcon />
        </button>
      </div>
    </div>
  )
}
