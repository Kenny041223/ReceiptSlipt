import { NextResponse } from 'next/server'

// TEMPORARY diagnostic endpoint — reports env/config health without leaking secrets.
// Delete this file once the deployment issue is resolved.
export async function GET() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || ''
  const adminEmails = process.env.ADMIN_EMAILS || ''

  let serviceKeyParsedOk = false
  let serviceKeyProjectId = ''
  let keyParseError = ''
  try {
    if (key) {
      const sa = JSON.parse(Buffer.from(key, 'base64').toString('utf-8'))
      serviceKeyParsedOk = true
      serviceKeyProjectId = sa.project_id || ''
    }
  } catch (e: any) {
    keyParseError = e.message
  }

  let adminInit = false
  let firestoreOk = false
  let firestoreError = ''
  try {
    const { adminDb } = await import('@/lib/firebaseAdmin')
    adminInit = true
    await adminDb().collection('users').limit(1).get()
    firestoreOk = true
  } catch (e: any) {
    firestoreError = e.message
  }

  return NextResponse.json({
    hasServiceKey: !!key,
    serviceKeyLength: key.length,
    serviceKeyParsedOk,
    serviceKeyProjectId,
    keyParseError,
    adminEmailsSet: !!adminEmails,
    adminEmailsValue: adminEmails,
    googleVisionKeySet: !!process.env.GOOGLE_VISION_API_KEY,
    adminInit,
    firestoreOk,
    firestoreError,
  })
}
