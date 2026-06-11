'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'

export default function HomePage() {
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
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Receipt Splitter</h1>
        <p className="text-gray-400">Take a photo of your receipt and split the bill instantly</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-200 hover:border-indigo-300 hover:bg-white'
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <div className="text-5xl mb-4">📷</div>
        <p className="text-base font-medium text-gray-700 mb-1">Upload or take a photo</p>
        <p className="text-sm text-gray-400">Drag & drop, click to browse, or use camera</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Receipt images are processed securely and never stored permanently.
      </p>
    </div>
  )
}
