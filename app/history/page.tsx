'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore'
import { avatarGradient, initials } from '@/lib/avatar'

interface ScanRecord {
  id: string
  createdAt: Timestamp | null
  people: { id: string; name: string }[]
  results: { personId: string; personName: string; total: number }[]
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }

    getDocs(query(collection(db, 'users', user.uid, 'scans'), orderBy('createdAt', 'desc')))
      .then(snap => {
        setScans(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScanRecord)))
      })
      .catch(err => console.error('Could not load history:', err))
      .finally(() => setFetching(false))
  }, [user, loading])

  if (loading || fetching) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page page--narrow">
      <h1 className="display" style={{ fontSize: 30, marginBottom: 24 }}>Split History</h1>

      {scans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🧾</p>
          <p style={{ fontSize: 14 }}>No saved splits yet</p>
          <a href="/" className="coral" style={{ fontSize: 14, fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Split your first receipt</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {scans.map(scan => {
            const total = scan.results?.reduce((s, r) => s + (r.total || 0), 0) ?? 0
            const date = scan.createdAt?.toDate?.()
            return (
              <a key={scan.id} href={`/history/${scan.id}`} className="glass tap-card" style={{ padding: 18, display: 'block', textDecoration: 'none', color: 'var(--text)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {date ? date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  <b className="coral tnum" style={{ fontFamily: 'var(--font-display)' }}>RM {total.toFixed(2)}</b>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }} className="item__assignees">
                    {scan.people?.map(p => (
                      <span key={p.id} className="av av--sm" style={{ background: avatarGradient(p.name) }} title={p.name}>
                        {initials(p.name)}
                      </span>
                    ))}
                  </div>
                  <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>View summary →</span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
