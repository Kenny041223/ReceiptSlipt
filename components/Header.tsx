'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { ReceiptIcon } from './Icons'
import { avatarGradient, initials } from '@/lib/avatar'

export default function Header() {
  const { user, profile } = useAuth()
  const pathname = usePathname()

  // The login screen is a full-bleed auth experience — no top bar.
  if (pathname === '/login') return null

  const displayName = user?.displayName || user?.email || 'You'

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand__mark"><ReceiptIcon /></span>
        Receipt Splitter
      </Link>

      <nav className="topbar__nav">
        {user ? (
          <>
            {profile && !profile.isAdmin && profile.remaining !== null && (
              <span className={`scan-pill ${profile.remaining <= 0 ? 'is-out' : ''}`} title="Receipt scans remaining">
                {profile.remaining} scans left
              </span>
            )}
            {profile?.isAdmin && (
              <Link href="/admin" className={`topbar__link ${pathname === '/admin' ? 'is-active' : ''}`}>
                Admin
              </Link>
            )}
            <Link href="/history" className={`topbar__link ${pathname === '/history' ? 'is-active' : ''}`}>
              History
            </Link>
            <button onClick={() => signOut(auth)} className="topbar__link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Sign out
            </button>
            <span
              className="av av--sm"
              style={{ background: avatarGradient(displayName) }}
              title={displayName}
            >
              {initials(displayName)}
            </span>
          </>
        ) : (
          <Link href="/login" className="topbar__link">Sign in</Link>
        )}
      </nav>
    </header>
  )
}
