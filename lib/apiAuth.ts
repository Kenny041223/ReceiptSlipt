import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from './firebaseAdmin'

export const DEFAULT_SCAN_LIMIT = 20

export interface UserDoc {
  email: string | null
  scanCount: number
  scanLimit: number
  periodMonth: string  // 'YYYY-MM' — the month the current scanCount belongs to
  createdAt: number
}

/** Current calendar month key, e.g. "2026-06". Used for monthly quota resets & usage logging. */
export function currentMonthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
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

/**
 * Reads the user's Firestore doc, creating it with defaults on first use.
 * Also performs a lazy monthly reset: if the stored period is an earlier month,
 * the scan count rolls back to 0 for the new month (no cron job needed).
 */
export async function getOrCreateUser(uid: string, email: string | null): Promise<UserDoc> {
  const ref = adminDb().collection('users').doc(uid)
  const snap = await ref.get()
  const month = currentMonthKey()

  if (!snap.exists) {
    const data: UserDoc = {
      email,
      scanCount: 0,
      scanLimit: DEFAULT_SCAN_LIMIT,
      periodMonth: month,
      createdAt: Date.now(),
    }
    await ref.set(data)
    return data
  }

  const data = snap.data() as UserDoc
  const updates: Record<string, unknown> = {}

  if (email && data.email !== email) { updates.email = email; data.email = email }

  // Monthly reset — new month → fresh quota
  if (data.periodMonth !== month) {
    updates.scanCount = 0
    updates.periodMonth = month
    data.scanCount = 0
    data.periodMonth = month
  }

  if (Object.keys(updates).length) await ref.update(updates)
  return data
}
