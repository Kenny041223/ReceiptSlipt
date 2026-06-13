'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { compressImage } from '@/lib/compressImage'
import { CameraIcon, GalleryIcon, ReceiptIcon } from '@/components/Icons'

export default function ScannerHomePage() {
  const router = useRouter()
  const { resetSession } = useReceiptSession()
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    resetSession()
    setError('')
    try {
      // Shrink big phone photos so they fit sessionStorage + the OCR upload limit
      const dataUrl = await compressImage(file)
      sessionStorage.setItem('pendingImageData', dataUrl)
      sessionStorage.setItem('pendingImageType', 'image/jpeg')
      sessionStorage.setItem('pendingImagePreview', dataUrl)
      router.push('/scan')
    } catch {
      setError('Could not process that image — please try another photo.')
    }
  }, [resetSession, router])

  return (
    <div className="page">
      {/* screen top row: back to dashboard · title */}
      <div className="scan-grid">
        {/* upload actions */}
        <div>
          <div className="seg">
            <button className="seg__btn" onClick={() => cameraRef.current?.click()}>
              <CameraIcon /> Camera
            </button>
            <span className="seg__divider" />
            <button className="seg__btn" onClick={() => fileRef.current?.click()}>
              <GalleryIcon /> Gallery
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

          {error && <p className="auth-err" style={{ marginTop: 12 }}>{error}</p>}
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
