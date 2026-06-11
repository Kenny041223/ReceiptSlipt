import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest, isAdminEmail } from '@/lib/apiAuth'
import { adminDb } from '@/lib/firebaseAdmin'

async function requireAdmin(req: NextRequest) {
  const { email } = await verifyRequest(req)
  if (!isAdminEmail(email)) throw new Error('forbidden')
}

// List all users with their usage
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const snap = await adminDb().collection('users').orderBy('createdAt', 'desc').get()
  const users = snap.docs.map(d => {
    const u = d.data()
    return {
      uid: d.id,
      email: u.email ?? '(unknown)',
      scanCount: u.scanCount ?? 0,
      scanLimit: u.scanLimit ?? 0,
    }
  })
  return NextResponse.json({ users })
}

// Update a user's scan limit (and optionally reset their count)
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await req.json()
  const { uid, scanLimit, resetCount } = body as { uid?: string; scanLimit?: number; resetCount?: boolean }

  if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 })

  const updates: Record<string, number> = {}
  if (typeof scanLimit === 'number' && scanLimit >= 0) updates.scanLimit = Math.floor(scanLimit)
  if (resetCount) updates.scanCount = 0

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  await adminDb().collection('users').doc(uid).update(updates)
  return NextResponse.json({ ok: true })
}
