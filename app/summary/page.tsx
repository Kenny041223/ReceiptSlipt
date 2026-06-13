'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { useAuth } from '@/components/AuthProvider'
import { SplitResult } from '@/types'
import SplitSummary from '@/components/SplitSummary'
import { BookmarkIcon } from '@/components/Icons'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function SummaryPage() {
  const router = useRouter()
  const { session, resetSession } = useReceiptSession()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paid, setPaid] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    if (session.items.length === 0) router.replace('/')
  }, [session])

  const { results, grand } = useMemo(() => {
    if (!session) return { results: [] as SplitResult[], grand: 0 }
    const people = session.people
    const base: Record<string, { items: SplitResult['items']; subtotal: number }> = {}
    people.forEach(p => { base[p.id] = { items: [], subtotal: 0 } })

    let subtotal = 0
    for (const item of session.items) {
      const line = item.price * item.quantity
      subtotal += line
      const assignees = item.assignedTo.filter(id => people.some(p => p.id === id))
      const targets = assignees.length ? assignees : people.map(p => p.id)
      if (targets.length === 0) continue
      const share = line / targets.length
      const shared = targets.length > 1
      targets.forEach(id => {
        base[id].items.push({ itemName: item.name, share, shared })
        base[id].subtotal += share
      })
    }

    const taxTotal = subtotal * ((session.taxRate || 0) / 100)
    const tipTotal = subtotal * ((session.tipPct || 0) / 100)

    const results: SplitResult[] = people.map(p => {
      const sub = base[p.id].subtotal
      const ratio = subtotal ? sub / subtotal : 0
      const tax = taxTotal * ratio
      const tip = tipTotal * ratio
      return {
        personId: p.id,
        personName: p.name,
        items: base[p.id].items,
        subtotal: sub,
        tax,
        tip,
        total: sub + tax + tip,
      }
    })

    return { results, grand: subtotal + taxTotal + tipTotal }
  }, [session])

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1900) }
  const togglePaid = (id: string) => setPaid(prev => ({ ...prev, [id]: !prev[id] }))

  const copyLink = () => {
    const lines = results.map(r => `${r.personName}: RM ${r.total.toFixed(2)}`).join('\n')
    const text = `Receipt split — Total RM ${grand.toFixed(2)}\n${lines}`
    navigator.clipboard?.writeText(text).then(() => flash('Split summary copied to clipboard'))
  }

  const saveToHistory = async () => {
    if (!user || !session) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'users', user.uid, 'scans'), {
        items: session.items,
        people: session.people,
        taxRate: session.taxRate || 0,
        tipPct: session.tipPct || 0,
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
    <div className="page">
      <div className="sum-banner glass glass--strong">
        <div className="sum-banner__label">Total Bill</div>
        <div className="sum-banner__amt coral tnum">RM {grand.toFixed(2)}</div>
        <div className="sum-banner__sub">Split across {results.length} {results.length === 1 ? 'person' : 'people'}</div>
      </div>

      <SplitSummary results={results} paid={paid} onTogglePaid={togglePaid} onCopy={copyLink} />

      <div style={{ marginTop: 28, display: 'grid', gap: 12, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
        {user && !saved && (
          <button onClick={saveToHistory} disabled={saving} className="btn btn--ghost btn--block">
            <BookmarkIcon /> {saving ? 'Saving…' : 'Save to History'}
          </button>
        )}
        {saved && <p className="green" style={{ textAlign: 'center', fontWeight: 700, fontSize: 14 }}>Saved to your history ✓</p>}
        <button onClick={() => { resetSession(); router.push('/') }} className="btn btn--primary btn--block">
          Split Another Receipt
        </button>
      </div>

      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  )
}
