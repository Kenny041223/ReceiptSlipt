'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export interface UserProfile {
  email: string | null
  scanCount: number
  scanLimit: number
  isAdmin: boolean
  remaining: number | null
}

interface AuthCtx {
  user: User | null
  loading: boolean
  profile: UserProfile | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const refreshProfile = useCallback(async () => {
    const current = auth.currentUser
    if (!current) {
      setProfile(null)
      return
    }
    try {
      const token = await current.getIdToken()
      const res = await fetch('/api/user', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setProfile(await res.json())
    } catch {
      // ignore — header just won't show usage
    }
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u)
      setLoading(false)
      if (u) {
        await refreshProfile()
      } else {
        setProfile(null)
      }
    })
  }, [refreshProfile])

  return (
    <AuthContext.Provider value={{ user, loading, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
