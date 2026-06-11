import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest, getOrCreateUser, isAdminEmail } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  try {
    const { uid, email } = await verifyRequest(req)
    const data = await getOrCreateUser(uid, email)
    const admin = isAdminEmail(email)

    return NextResponse.json({
      email,
      scanCount: data.scanCount,
      scanLimit: data.scanLimit,
      isAdmin: admin,
      remaining: admin ? null : Math.max(0, data.scanLimit - data.scanCount),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}
