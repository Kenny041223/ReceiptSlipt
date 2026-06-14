import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyRequest, getOrCreateUser, isAdminEmail, currentMonthKey } from '@/lib/apiAuth'
import { adminDb } from '@/lib/firebaseAdmin'
import { parseReceiptWithClaude } from '@/lib/receiptAI'
import { ParsedItem } from '@/lib/receiptParser'

const API_KEY = process.env.GOOGLE_VISION_API_KEY!
const ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`

export async function POST(req: NextRequest) {
  // 1. Authenticate the user
  let uid: string
  let email: string | null
  try {
    ({ uid, email } = await verifyRequest(req))
  } catch {
    return NextResponse.json({ error: 'You must be signed in to scan.' }, { status: 401 })
  }

  // 2. Check the user's scan allowance (admins are unlimited)
  const admin = isAdminEmail(email)
  const userData = await getOrCreateUser(uid, email)
  if (!admin && userData.scanCount >= userData.scanLimit) {
    return NextResponse.json(
      { error: 'limit', scanLimit: userData.scanLimit, scanCount: userData.scanCount },
      { status: 403 }
    )
  }

  // 3. Run OCR
  try {
    const form = await req.formData()
    const image = form.get('image') as File | null
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Google Vision error: ${err}` }, { status: 502 })
    }

    const data = await res.json()
    const rawText = data.responses?.[0]?.fullTextAnnotation?.text ?? ''

    if (!rawText) {
      return NextResponse.json({ error: 'No text found in image' }, { status: 422 })
    }

    // 3b. Parse the OCR text into structured line items with Claude.
    //     On any failure, fall back to null so the client uses the regex parser.
    let items: ParsedItem[] | null = null
    try {
      items = await parseReceiptWithClaude(rawText)
    } catch (e) {
      console.error('Claude receipt parse failed, falling back to regex:', e)
    }

    // 4. Count the scan (only successful scans, and not for admins)
    let newCount = userData.scanCount
    if (!admin) {
      await adminDb().collection('users').doc(uid).update({ scanCount: FieldValue.increment(1) })
      newCount = userData.scanCount + 1
    }

    // 5. Log total usage for this month (every successful scan, incl. admins) —
    //    this is what counts toward Google Cloud Vision's 1000/month free tier.
    const month = currentMonthKey()
    await adminDb().collection('usage').doc(month).set(
      { month, count: FieldValue.increment(1) },
      { merge: true }
    )

    return NextResponse.json({
      rawText,
      items,
      scanCount: newCount,
      scanLimit: userData.scanLimit,
      remaining: admin ? null : Math.max(0, userData.scanLimit - newCount),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
