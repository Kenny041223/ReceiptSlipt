import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest, isAdminEmail } from '@/lib/apiAuth'
import { adminDb } from '@/lib/firebaseAdmin'

// Monthly total scans processed by the configured Hugging Face model.
export async function GET(req: NextRequest) {
  try {
    const { email } = await verifyRequest(req)
    if (!isAdminEmail(email)) throw new Error('forbidden')
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const snap = await adminDb().collection('usage').get()
  const months = snap.docs
    .map(d => ({ month: d.id, count: (d.data().count as number) ?? 0 }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12) // last 12 months

  return NextResponse.json({ months })
}
