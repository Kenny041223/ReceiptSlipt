'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { db } from '@/lib/firebase'
import { doc, getDoc, Timestamp } from 'firebase/firestore'
import SplitSummary from '@/components/SplitSummary'
import { SplitResult } from '@/types'
import { ArrowLeftIcon } from '@/components/Icons'

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [results, setResults] = useState<SplitResult[]>([])
  const [date, setDate] = useState<Date | null>(null)
  const [fetching, setFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paid, setPaid] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    getDoc(doc(db, 'users', user.uid, 'scans', id))
      .then(snap => {
        if (!snap.exists()) { setNotFound(true); return }
        const data = snap.data()
        setResults((data.results || []) as SplitResult[])
        const ts = data.createdAt as Timestamp | undefined
        if (ts?.toDate) setDate(ts.toDate())
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false))
  }, [user, loading, id])

  const grand = results.reduce((s, r) => s + (r.total || 0), 0)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1900) }
  const togglePaid = (pid: string) => setPaid(p => ({ ...p, [pid]: !p[pid] }))
  const copyLink = () => {
    const lines = results.map(r => `${r.personName}: RM ${r.total.toFixed(2)}`).join('\n')
    navigator.clipboard?.writeText(`Receipt split — Total RM ${grand.toFixed(2)}\n${lines}`).then(() => flash('Split summary copied to clipboard'))
  }

  if (loading || fetching) {
    return <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><div className="spinner" /></div>
  }

  if (notFound) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
        <h1 className="display" style={{ fontSize: 22, marginBottom: 8 }}>Split not found</h1>
        <button className="btn btn--primary" onClick={() => router.push('/history')} style={{ marginTop: 12 }}>Back to history</button>
      </div>
    )
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => router.push('/history')} style={{ marginBottom: 24 }}>
        <ArrowLeftIcon /> History
      </button>

      <div className="sum-banner glass glass--strong">
        <div className="sum-banner__label">Total Bill</div>
        <div className="sum-banner__amt coral tnum">RM {grand.toFixed(2)}</div>
        <div className="sum-banner__sub">
          {date ? date.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' : ''}
          split across {results.length} {results.length === 1 ? 'person' : 'people'}
        </div>
      </div>

      <SplitSummary results={results} paid={paid} onTogglePaid={togglePaid} onCopy={copyLink} />

      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  )
}
