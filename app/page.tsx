'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { ArrowLeftIcon, CameraIcon, ReceiptIcon } from '@/components/Icons'

export default function ScannerHomePage() {
  const router = useRouter()
  const { resetSession } = useReceiptSession()
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    resetSession()
    const reader = new FileReader()
    reader.onload = () => {
      sessionStorage.setItem('pendingImageData', reader.result as string)
      sessionStorage.setItem('pendingImageType', file.type)
      sessionStorage.setItem('pendingImagePreview', URL.createObjectURL(file))
      router.push('/scan')
    }
    reader.readAsDataURL(file)
  }, [resetSession, router])

  return (
    <div className="page">
      {/* screen top row: back to dashboard · title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 30 }}>
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ArrowLeftIcon /> Dashboard
        </button>
        <div className="brand">
          Scan a receipt
        </div>
        <div style={{ width: 100 }} />
      </div>

      <div className="scan-grid">
        {/* dropzone */}
        <div>
          <div
            className={`dropzone dropzone--scan ${dragging ? 'is-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          >
            <div className="dropzone__inner">
              <div className="dropzone__circle"><CameraIcon /></div>
              <div className="dropzone__title">Drag a receipt or click to snap</div>
              <div className="dropzone__sub">Drop any photo here — we&apos;ll pull out every line item automatically.</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          </div>
        </div>

        {/* extracted preview — awaiting state */}
        <div className="preview-panel glass glass--strong">
          <div className="preview-head">
            <div>
              <p className="eyebrow">Extracted</p>
              <div className="display" style={{ fontSize: 20, marginTop: 4 }}>Awaiting scan</div>
            </div>
          </div>
          <div className="preview-empty">
            <ReceiptIcon />
            <div style={{ fontSize: 14 }}>Items will appear here once a receipt is scanned.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
