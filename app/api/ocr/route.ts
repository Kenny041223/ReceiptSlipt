import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GOOGLE_VISION_API_KEY!
const ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`

export async function POST(req: NextRequest) {
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

    return NextResponse.json({ rawText })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
