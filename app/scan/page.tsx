'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseReceiptText } from '@/lib/receiptParser'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { ReceiptItem } from '@/types'
import ItemEditor from '@/components/ItemEditor'

type Status = 'scanning' | 'editing' | 'error'

export default function ScanPage() {
  const router = useRouter()
  const { updateSession } = useReceiptSession()
  const [status, setStatus] = useState<Status>('scanning')
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [error, setError] = useState('')
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
        const fetchRes = await fetch(imgData)
        const blob = await fetchRes.blob()

        const form = new FormData()
        form.append('image', new File([blob], 'receipt.jpg', { type: imgType || 'image/jpeg' }))

        const res = await fetch('/api/ocr', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'OCR failed')

        const parsed = parseReceiptText(data.rawText)
        const receiptItems: ReceiptItem[] = parsed.map(p => ({ ...p, assignedTo: [] }))
        setItems(receiptItems)
        updateSession({ items: receiptItems, rawText: data.rawText })
        setStatus('editing')
      } catch (e: any) {
        setError(e.message)
        setStatus('error')
      }
    }

    doOCR()
  }, [])

  if (status === 'scanning') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-semibold text-gray-700">Reading your receipt...</h2>
        <p className="text-gray-400 mt-2 text-sm">This usually takes 2–5 seconds</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Could not read receipt</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Try another image
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Items</h1>
          <p className="text-sm text-gray-400 mt-0.5">Fix any errors before splitting</p>
        </div>
        <span className="text-sm text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full">
          {items.length} items
        </span>
      </div>

      {preview && (
        <img
          src={preview}
          alt="Receipt"
          className="w-full max-h-48 object-contain rounded-xl mb-6 bg-gray-100"
        />
      )}

      <ItemEditor items={items} onChange={setItems} />

      <button
        onClick={() => {
          updateSession({ items })
          router.push('/split')
        }}
        disabled={items.length === 0}
        className="w-full mt-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  )
}
