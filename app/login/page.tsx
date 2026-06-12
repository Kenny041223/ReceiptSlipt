'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { ReceiptIcon, CheckIcon, ArrowRightIcon, ArrowLeftIcon } from '@/components/Icons'

type Mode = 'signin' | 'signup' | 'forgot'

const COPY: Record<Mode, { h: string; s: string; btn: string }> = {
  signin: { h: 'Welcome back', s: 'Sign in to settle up with your crew.', btn: 'Sign in' },
  signup: { h: 'Create your account', s: 'Split your first bill in under a minute.', btn: 'Create account' },
  forgot: { h: 'Reset your password', s: "Enter your email and we'll send a secure reset link.", btn: 'Send reset link' },
}

const GoogleG = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" aria-hidden width="20" height="20" {...p}>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.2C39.9 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
  </svg>
)

const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
    {off
      ? <><path d="M2 12s3.5-7 10-7c2 0 3.7.6 5.2 1.5M22 12s-3.5 7-10 7c-2 0-3.7-.6-5.2-1.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></>
      : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [showPass, setShowPass] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const c = COPY[mode]
  const cleanError = (msg: string) => msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/, '').trim()

  const switchMode = (m: Mode) => { setSent(false); setShowPass(false); setError(''); setMode(m) }

  const handleGoogle = async () => {
    setError('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      router.push('/')
    } catch (e: any) { setError(cleanError(e.message)) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email)
        setSent(true)
        return
      }
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (fullName.trim()) await updateProfile(cred.user, { displayName: fullName.trim() })
      }
      router.push('/')
    } catch (e: any) {
      setError(cleanError(e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="auth-brand">
          <span className="brand__mark"><ReceiptIcon /></span>
          <span className="auth-brand__name">Receipt Splitter</span>
        </div>

        <div className="auth-head">
          <h1 className="display auth-head__h">{c.h}</h1>
          <p className="auth-head__s muted">{c.s}</p>
        </div>

        <button type="button" className="auth-google" onClick={handleGoogle}>
          <GoogleG /> Continue with Google
        </button>

        <div className="auth-divider"><span>or {mode === 'signup' ? 'sign up' : 'continue'} with email</span></div>

        <div className="auth-fields">
          {mode === 'signup' && (
            <label className="auth-field">
              <span className="auth-label">Full name</span>
              <input className="auth-input" type="text" autoComplete="name" placeholder="Alex Rivera" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </label>
          )}

          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input className="auth-input" type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>

          {mode !== 'forgot' && (
            <label className="auth-field">
              <span className="auth-label">Password</span>
              <span className="auth-pass">
                <input
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  minLength={6}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="auth-eye" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                  <Eye off={showPass} />
                </button>
              </span>
            </label>
          )}
        </div>

        {mode === 'signin' && (
          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> <span>Remember me</span>
            </label>
            <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>Forgot password?</button>
          </div>
        )}

        {sent && mode === 'forgot' && (
          <div className="auth-sent"><CheckIcon style={{ width: 16, height: 16 }} /> Reset link sent — check your inbox.</div>
        )}

        {error && <p className="auth-err">{error}</p>}

        <button type="submit" disabled={loading} className="btn btn--primary btn--block auth-submit">
          {loading ? 'Please wait…' : c.btn} {mode !== 'forgot' && <ArrowRightIcon />}
        </button>

        {mode === 'forgot' ? (
          <p className="auth-foot">
            <button type="button" className="auth-link" onClick={() => switchMode('signin')}><ArrowLeftIcon style={{ width: 14, height: 14 }} /> Back to sign in</button>
          </p>
        ) : (
          <p className="auth-foot">
            {mode === 'signin' ? 'New to Receipt Splitter? ' : 'Already have an account? '}
            <button type="button" className="auth-link auth-link--strong" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        )}
      </form>

      <p className="auth-legal">
        By continuing you agree to Receipt Splitter&apos;s <a href="#" onClick={e => e.preventDefault()}>Terms</a> &amp; <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>.
      </p>
    </div>
  )
}
