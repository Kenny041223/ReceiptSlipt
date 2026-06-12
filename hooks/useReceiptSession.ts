'use client'

import { useState, useEffect } from 'react'
import { ReceiptSession } from '@/types'

const KEY = 'receipt_session'

function load(): ReceiptSession | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}

function persist(s: ReceiptSession) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

function fresh(): ReceiptSession {
  return { id: Date.now().toString(), items: [], people: [], taxRate: 0, tipPct: 0, createdAt: Date.now() }
}

export function useReceiptSession() {
  const [session, setSession] = useState<ReceiptSession | null>(null)

  useEffect(() => {
    setSession(load() ?? fresh())
  }, [])

  const updateSession = (updates: Partial<ReceiptSession>) => {
    setSession(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      persist(next)
      return next
    })
  }

  const resetSession = () => {
    const s = fresh()
    persist(s)
    setSession(s)
  }

  return { session, updateSession, resetSession }
}
