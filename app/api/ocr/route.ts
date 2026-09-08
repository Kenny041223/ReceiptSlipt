import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyRequest, getOrCreateUser, isAdminEmail, currentMonthKey } from '@/lib/apiAuth'
import { adminDb } from '@/lib/firebaseAdmin'

const HF_TOKEN = process.env.HF_TOKEN
// A vision-language model extracts structured receipt items directly. This is
// more reliable than treating product codes, totals, and payment lines as OCR text.
const HF_MODEL = process.env.HUGGINGFACE_OCR_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct'
const HF_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions'

interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
}

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

function parseJsonObject(text: string): Record<string, unknown> | null {
  const candidates = [
    text,
    text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''),
  ]
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1))

  for (const candidate of candidates) {
    try {
      const value: unknown = JSON.parse(candidate)
      if (typeof value === 'object' && value && !Array.isArray(value)) return value as Record<string, unknown>
    } catch {
      // Try the next form: some providers wrap JSON in a markdown fence.
    }
  }
  return null
}

function toPositiveNumber(value: unknown): number | null {
  const number = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value.replace(/RM|,|\s/g, ''))
      : NaN
  return Number.isFinite(number) && number > 0 && number <= 100_000 ? number : null
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function extractItems(modelText: string): { items: ReceiptItem[]; receiptTotal: number | null } | null {
  const receipt = parseJsonObject(modelText)
  if (!receipt || !Array.isArray(receipt.items)) return null

  const items = receipt.items.flatMap((item, index) => {
    if (typeof item !== 'object' || !item || Array.isArray(item)) return []
    const source = item as Record<string, unknown>
    const name = typeof source.name === 'string' ? source.name.replace(/\s+/g, ' ').trim() : ''
    const quantity = toPositiveNumber(source.quantity) ?? 1
    const lineTotal = toPositiveNumber(source.lineTotal)
    const unitPrice = toPositiveNumber(source.unitPrice)

    // Product names must contain a letter; prices and quantities are bounded to
    // prevent malformed model output from entering a user's bill.
    if (!/[a-z]/i.test(name) || name.length > 120 || quantity > 10_000) return []
    if (!lineTotal && !unitPrice) return []

    const price = roundMoney(lineTotal ? lineTotal / quantity : unitPrice!)
    return [{
      id: String(index + 1),
      name,
      price,
      quantity: Math.round(quantity * 1_000) / 1_000,
    }]
  })

  return { items, receiptTotal: toPositiveNumber(receipt.receiptTotal) }
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

  // 3. Extract structured receipt items with the vision-language model.
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
              text: `Extract only the purchasable line items from this retail receipt. Return exactly one valid JSON object and no markdown or commentary:
{"items":[{"name":"string","quantity":number,"unitPrice":number,"lineTotal":number}],"receiptTotal":number|null}

Rules:
- Include a line only when its product name and a positive printed price are legible.
- Use the printed line total for lineTotal. If quantity is greater than 1, unitPrice must equal lineTotal divided by quantity.
- Ignore product codes, barcodes, store header/address, membership offers, coupons, discounts, tax, subtotal, total, tender, cash/card/payment, change, QR codes, URLs, and all footer text.
- "Tender" and payment amounts are never items and never receiptTotal. receiptTotal is only the printed grand total; use null if it is unclear.
- Do not guess, repair, or invent unreadable names, quantities, or prices. Omit uncertain lines instead.
- Every price must be a JSON number in RM, not a string.`,
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

    const modelText = getMessageText(data?.choices?.[0]?.message?.content)

    if (!modelText) {
      return NextResponse.json({ error: 'No receipt data found in image' }, { status: 422 })
    }

    const extracted = extractItems(modelText)
    if (!extracted || extracted.items.length === 0) {
      return NextResponse.json({ error: 'No valid receipt items were found. Try a clearer photo.' }, { status: 422 })
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
      items: extracted.items,
      receiptTotal: extracted.receiptTotal,
      scanCount: newCount,
      scanLimit: userData.scanLimit,
      remaining: admin ? null : Math.max(0, userData.scanLimit - newCount),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
