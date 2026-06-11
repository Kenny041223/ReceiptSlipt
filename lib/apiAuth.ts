import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from './firebaseAdmin'

export const DEFAULT_SCAN_LIMIT = 20

export interface UserDoc {
  email: string | null
  scanCount: number
  scanLimit: number
  createdAt: number
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

/** Verifies the Firebase ID token from the Authorization header. Throws if invalid. */
export async function verifyRequest(req: NextRequest): Promise<{ uid: string; email: string | null }> {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new Error('Not authenticated')

  const decoded = await adminAuth().verifyIdToken(token)
  return { uid: decoded.uid, email: decoded.email ?? null }
}

/** Reads the user's Firestore doc, creating it with defaults on first use. */
export async function getOrCreateUser(uid: string, email: string | null): Promise<UserDoc> {
  const ref = adminDb().collection('users').doc(uid)
  const snap = await ref.get()

  if (!snap.exists) {
    const data: UserDoc = {
      email,
      scanCount: 0,
      scanLimit: DEFAULT_SCAN_LIMIT,
      createdAt: Date.now(),
    }
    await ref.set(data)
    return data
  }

  const data = snap.data() as UserDoc
  // Keep the stored email current (useful for the admin dashboard)
  if (email && data.email !== email) {
    await ref.update({ email })
    data.email = email
  }
  return data
}
