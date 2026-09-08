import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyRequest, getOrCreateUser, isAdminEmail, currentMonthKey } from '@/lib/apiAuth'
import { adminDb } from '@/lib/firebaseAdmin'

const HF_TOKEN = process.env.HF_TOKEN
// A vision-language model is used rather than a line-only OCR model so it can
// preserve the full receipt layout before receiptParser turns it into items.
const HF_MODEL = process.env.HUGGINGFACE_OCR_MODEL || 'Qwen/Qwen2.5-VL-3B-Instruct'
const HF_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions'

function getMessageText(content: unknown): string {
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map(part => typeof part === 'object' && part && 'text' in part ? String(part.text ?? '') : '')
      .join('\n')
      .trim()
  }
  return ''
}

function getHuggingFaceError(data: unknown): string {
  if (typeof data === 'object' && data) {
    const error = 'error' in data ? data.error : undefined
    if (typeof error === 'string') return error
    if (typeof error === 'object' && error && 'message' in error) return String(error.message)
    if ('message' in data) return String(data.message)
  }
  return 'The Hugging Face model could not process this image.'
}

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

    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: 'Receipt scanning is not configured. Add HF_TOKEN to the server environment.' },
        { status: 500 }
      )
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const res = await fetch(HF_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcribe every visible receipt line exactly. Preserve line breaks. Return only the receipt text: no markdown, labels, explanation, or commentary.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${image.type || 'image/jpeg'};base64,${base64}` },
            },
          ],
        }],
        temperature: 0,
        max_tokens: 4096,
      }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json({ error: `Hugging Face error: ${getHuggingFaceError(data)}` }, { status: 502 })
    }

    const rawText = getMessageText(data?.choices?.[0]?.message?.content)

    if (!rawText) {
      return NextResponse.json({ error: 'No text found in image' }, { status: 422 })
    }

    // 4. Count the scan (only successful scans, and not for admins)
    let newCount = userData.scanCount
    if (!admin) {
      await adminDb().collection('users').doc(uid).update({ scanCount: FieldValue.increment(1) })
      newCount = userData.scanCount + 1
    }

    // 5. Log total usage for this month (every successful scan, including admins).
    const month = currentMonthKey()
    await adminDb().collection('usage').doc(month).set(
      { month, count: FieldValue.increment(1) },
      { merge: true }
    )

    return NextResponse.json({
      rawText,
      scanCount: newCount,
      scanLimit: userData.scanLimit,
      remaining: admin ? null : Math.max(0, userData.scanLimit - newCount),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
