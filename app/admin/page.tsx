'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { auth } from '@/lib/firebase'

interface AdminUser {
  uid: string
  email: string
  scanCount: number
  scanLimit: number
}

export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [fetching, setFetching] = useState(true)
  const [savingUid, setSavingUid] = useState('')
  const [drafts, setDrafts] = useState<Record<string, number>>({})

  const token = async () => (await auth.currentUser?.getIdToken()) || ''

  const loadUsers = async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setDrafts(Object.fromEntries(data.users.map((u: AdminUser) => [u.uid, u.scanLimit])))
      }
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (profile?.isAdmin) loadUsers()
    else setFetching(false)
  }, [loading, profile])

  const saveLimit = async (uid: string, resetCount = false) => {
    setSavingUid(uid)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await token()}`,
        },
        body: JSON.stringify({ uid, scanLimit: drafts[uid], resetCount }),
      })
      if (res.ok) await loadUsers()
    } finally {
      setSavingUid('')
    }
  }

  if (loading || fetching) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400 text-sm">Loading...</div>
  }

  if (!user || !profile?.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Not authorized</h1>
        <p className="text-gray-500 text-sm">This page is for administrators only.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin — User Usage</h1>
        <span className="text-sm text-gray-400">{users.length} users</span>
      </div>

      <div className="space-y-3">
        {users.map(u => {
          const used = u.scanCount
          const atLimit = used >= u.scanLimit
          return (
            <div key={u.uid} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-800 truncate mr-2">{u.email}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${atLimit ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                  {used} / {u.scanLimit} used
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Limit</label>
                <input
                  type="number"
                  min={0}
                  value={drafts[u.uid] ?? u.scanLimit}
                  onChange={e => setDrafts({ ...drafts, [u.uid]: parseInt(e.target.value) || 0 })}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => saveLimit(u.uid)}
                  disabled={savingUid === u.uid}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {savingUid === u.uid ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => saveLimit(u.uid, true)}
                  disabled={savingUid === u.uid}
                  className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  title="Reset this user's scan count to 0"
                >
                  Reset count
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
