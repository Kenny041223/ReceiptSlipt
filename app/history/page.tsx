'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore'

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
      .finally(() => setFetching(false))
  }, [user, loading])

  if (loading || fetching) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-gray-400 text-sm">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Split History</h1>

      {scans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-sm">No saved splits yet</p>
          <a href="/" className="text-indigo-500 text-sm hover:underline mt-2 inline-block">
            Split your first receipt
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map(scan => {
            const total = scan.results?.reduce((s, r) => s + (r.total || 0), 0) ?? 0
            const date = scan.createdAt?.toDate?.()
            return (
              <div key={scan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-400">
                    {date ? date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  <span className="font-bold text-indigo-600 text-sm">RM {total.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scan.people?.map(p => (
                    <span key={p.id} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
