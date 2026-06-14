'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseReceiptText } from '@/lib/receiptParser'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { useAuth } from '@/components/AuthProvider'
import { auth } from '@/lib/firebase'
import { ReceiptItem } from '@/types'
import ItemEditor from '@/components/ItemEditor'
import LimitReachedModal from '@/components/LimitReachedModal'
import { ArrowRightIcon, CheckIcon, EditIcon, ReceiptIcon, SparkIcon } from '@/components/Icons'

type Status = 'scanning' | 'done' | 'editing' | 'error' | 'limit'

export default function ScanPage() {
  const router = useRouter()
  const { updateSession } = useReceiptSession()
  const { refreshProfile } = useAuth()
  const [status, setStatus] = useState<Status>('scanning')
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [revealed, setRevealed] = useState(0)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(0)
  const [preview, setPreview] = useState('')
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    const imgData = sessionStorage.getItem('pendingImageData')
    const imgType = sessionStorage.getItem('pendingImageType')
    const imgPreview = sessionStorage.getItem('pendingImagePreview')

    if (!imgData) { router.replace('/'); return }
    if (imgPreview) setPreview(imgPreview)

    const doOCR = async () => {
      try {
        const current = auth.currentUser
        if (!current) { router.replace('/login'); return }
        const token = await current.getIdToken()

        const fetchRes = await fetch(imgData)
        const blob = await fetchRes.blob()
        const form = new FormData()
        form.append('image', new File([blob], 'receipt.jpg', { type: imgType || 'image/jpeg' }))

        const res = await fetch('/api/ocr', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
        const data = await res.json()

        if (res.status === 403 && data.error === 'limit') {
          setLimit(data.scanLimit); setStatus('limit'); return
        }
        if (!res.ok) throw new Error(data.error || 'OCR failed')

        // Prefer Claude's structured items; fall back to the regex parser if absent.
        const parsed = (Array.isArray(data.items) && data.items.length > 0)
          ? data.items
          : parseReceiptText(data.rawText || '')
        const receiptItems: ReceiptItem[] = parsed.map((p: { id: string; name: string; price: number; quantity: number }) => ({ ...p, assignedTo: [] }))
        setItems(receiptItems)
        updateSession({ items: receiptItems, rawText: data.rawText })
        refreshProfile()
        setStatus('done')
      } catch (e: any) {
        setError(e.message); setStatus('error')
      }
    }
    doOCR()
  }, [])

  // progressive reveal of extracted rows
  useEffect(() => {
    if (status !== 'done') { setRevealed(0); return }
    let n = 0
    const t = setInterval(() => {
      n += 1; setRevealed(n)
      if (n >= items.length) clearInterval(t)
    }, 90)
    return () => clearInterval(t)
  }, [status, items.length])

  if (status === 'limit') return <LimitReachedModal scanLimit={limit} />

  if (status === 'error') {
    return (
      <div className="page page--narrow" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 className="display" style={{ fontSize: 24, marginBottom: 8 }}>Could not read receipt</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>{error}</p>
        <button onClick={() => router.push('/')} className="btn btn--primary">Try another image</button>
      </div>
    )
  }

  // editing: full ItemEditor
  if (status === 'editing') {
    return (
      <div className="page page--narrow">
        <div className="section-label">
          <h1 className="display" style={{ fontSize: 28 }}>Edit Items</h1>
          <span className="scan-pill">{items.length} items</span>
        </div>
        <ItemEditor items={items} onChange={setItems} />
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={() => setStatus('done')} className="btn btn--ghost">Back</button>
          <button onClick={() => { updateSession({ items }); router.push('/split') }} disabled={items.length === 0} className="btn btn--primary btn--block">
            Review &amp; assign <ArrowRightIcon />
          </button>
        </div>
      </div>
    )
  }

  const scanning = status === 'scanning'
  const allRevealed = revealed >= items.length

  return (
    <div className="page">
      <div className="section-label">
        <h1 className="display" style={{ fontSize: 30 }}>Scan a receipt</h1>
      </div>

      <div className="scan-grid">
        {/* left: image with scan animation */}
        <div>
          <div className="dropzone dropzone--scan" style={{ cursor: 'default' }}>
            {preview && <img className="dropzone__preview" src={preview} alt="Receipt" />}
            <div className="reticle"><span /><span /><span /><span /></div>
            {scanning && (
              <>
                <div className="scanline" />
                <div className="scan-overlay">
                  <div className="scan-overlay__pill"><span className="spin"><SparkIcon /></span> Reading receipt…</div>
                </div>
              </>
            )}
          </div>
          {status === 'done' && (
            <div className="scan-actions">
              <button className="btn btn--sm btn--ghost" onClick={() => setStatus('editing')}><EditIcon /> Edit items</button>
              <button className="btn btn--sm btn--ghost" onClick={() => router.push('/')}>Rescan</button>
            </div>
          )}
        </div>

        {/* right: extracted preview */}
        <div className="preview-panel glass glass--strong">
          <div className="preview-head">
            <div>
              <p className="eyebrow">Extracted</p>
              <div className="display" style={{ fontSize: 20, marginTop: 4 }}>{scanning ? 'Reading…' : 'Receipt items'}</div>
            </div>
            {status === 'done' && <span className="tag-settled"><CheckIcon style={{ width: 13, height: 13 }} /> {items.length} items</span>}
          </div>

          {scanning && (
            <div>{[...Array(6)].map((_, i) => <div className="preview-skel" key={i} style={{ width: `${90 - i * 9}%` }} />)}</div>
          )}

          {status === 'done' && (
            <>
              <div>
                {items.slice(0, revealed).map(it => (
                  <div className="preview-row" key={it.id}>
                    <span>{it.quantity > 1 ? `${it.quantity}× ` : ''}{it.name}</span>
                    <span className="tnum" style={{ fontWeight: 700 }}>RM {(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {items.length === 0 && <div className="preview-empty"><ReceiptIcon /><div style={{ fontSize: 14 }}>No items found — try editing manually.</div></div>}
              {allRevealed && (
                <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} onClick={() => { updateSession({ items }); router.push('/split') }}>
                  Review &amp; assign <ArrowRightIcon />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
