'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { useAuth } from '@/components/AuthProvider'
import { SplitResult } from '@/types'
import SplitSummary from '@/components/SplitSummary'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function SummaryPage() {
  const router = useRouter()
  const { session, resetSession } = useReceiptSession()
  const { user } = useAuth()
  const [results, setResults] = useState<SplitResult[]>([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) return
    if (session.items.length === 0) { router.replace('/'); return }

    const calc: SplitResult[] = session.people.map(p => ({
      personId: p.id,
      personName: p.name,
      items: [],
      total: 0,
    }))

    for (const item of session.items) {
      if (item.assignedTo.length === 0) continue
      const share = (item.price * item.quantity) / item.assignedTo.length
      for (const personId of item.assignedTo) {
        const r = calc.find(c => c.personId === personId)
        if (r) {
          r.items.push({ itemName: item.name, share })
          r.total += share
        }
      }
    }

    setResults(calc)
  }, [session])

  const total = results.reduce((s, r) => s + r.total, 0)

  const saveToHistory = async () => {
    if (!user || !session) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'users', user.uid, 'scans'), {
        items: session.items,
        people: session.people,
        results,
        createdAt: serverTimestamp(),
      })
      setSaved(true)
    } catch (e) {
      console.error('Failed to save:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
        <p className="text-sm font-semibold text-gray-500">
          Total: <span className="text-gray-900">RM {total.toFixed(2)}</span>
        </p>
      </div>

      <SplitSummary results={results} />

      <div className="mt-8 space-y-3">
        {user && !saved && (
          <button
            onClick={saveToHistory}
            disabled={saving}
            className="w-full py-3 border-2 border-indigo-200 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save to History'}
          </button>
        )}
        {saved && (
          <p className="text-center text-sm text-green-600 font-medium py-2">Saved to your history ✓</p>
        )}
        {!user && (
          <p className="text-center text-sm text-gray-400">
            <a href="/login" className="text-indigo-500 hover:underline">Sign in</a> to save your split history
          </p>
        )}
        <button
          onClick={() => { resetSession(); router.push('/') }}
          className="w-full py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Split Another Receipt
        </button>
      </div>
    </div>
  )
}
