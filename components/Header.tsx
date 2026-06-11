'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from './AuthProvider'

export default function Header() {
  const { user, profile } = useAuth()
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg">
          🧾 Receipt Splitter
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              {profile && !profile.isAdmin && profile.remaining !== null && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    profile.remaining > 0
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-red-50 text-red-500'
                  }`}
                  title="Receipt scans remaining"
                >
                  {profile.remaining} scans left
                </span>
              )}
              {profile?.isAdmin && (
                <Link
                  href="/admin"
                  className={`hover:text-gray-900 transition-colors ${pathname === '/admin' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/history"
                className={`hover:text-gray-900 transition-colors ${pathname === '/history' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
              >
                History
              </Link>
              <button
                onClick={() => signOut(auth)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
