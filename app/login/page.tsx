'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ReceiptIcon } from '@/components/Icons'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cleanError = (msg: string) =>
    msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/, '').trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      router.push('/')
    } catch (e: any) {
      setError(cleanError(e.message))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      router.push('/')
    } catch (e: any) {
      setError(cleanError(e.message))
    }
  }

  return (
    <div className="page" style={{ maxWidth: 400, paddingTop: 56 }}>
      <div className="glass" style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span className="brand__mark" style={{ width: 44, height: 44, borderRadius: 14, margin: '0 auto 14px' }}>
            <ReceiptIcon style={{ width: 24, height: 24 }} />
          </span>
          <h1 className="display" style={{ fontSize: 24 }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        </div>

        <button onClick={handleGoogle} className="btn btn--ghost btn--block" style={{ marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 20px' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--faint)' }} />
          <span className="muted" style={{ fontSize: 12 }}>or email</span>
          <span style={{ flex: 1, height: 1, background: 'var(--faint)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <input type="email" placeholder="Email" value={email} required onChange={e => setEmail(e.target.value)} className="field" />
          <input type="password" placeholder="Password (min 6 characters)" value={password} required minLength={6} onChange={e => setPassword(e.target.value)} className="field" />
          {error && <p className="coral" style={{ fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn--primary btn--block">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', fontSize: 14, marginTop: 22 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="coral"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
