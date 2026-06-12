'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { auth } from '@/lib/firebase'
import { avatarGradient, initials } from '@/lib/avatar'

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
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${await token()}` } })
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ uid, scanLimit: drafts[uid], resetCount }),
      })
      if (res.ok) await loadUsers()
    } finally {
      setSavingUid('')
    }
  }

  if (loading || fetching) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user || !profile?.isAdmin) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h1 className="display" style={{ fontSize: 22, marginBottom: 8 }}>Not authorized</h1>
        <p className="muted" style={{ fontSize: 14 }}>This page is for administrators only.</p>
      </div>
    )
  }

  return (
    <div className="page page--narrow">
      <div className="section-label">
        <h1 className="display" style={{ fontSize: 30 }}>Admin — User Usage</h1>
        <span className="scan-pill">{users.length} users</span>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {users.map(u => {
          const atLimit = u.scanCount >= u.scanLimit
          return (
            <div key={u.uid} className="glass" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span className="av av--sm" style={{ background: avatarGradient(u.email) }}>{initials(u.email)}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                </div>
                <span className={`scan-pill ${atLimit ? 'is-out' : ''}`} style={{ flexShrink: 0 }}>
                  {u.scanCount} / {u.scanLimit} used
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <label className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Limit</label>
                <input
                  type="number"
                  min={0}
                  value={drafts[u.uid] ?? u.scanLimit}
                  onChange={e => setDrafts({ ...drafts, [u.uid]: parseInt(e.target.value) || 0 })}
                  className="field"
                  style={{ width: 90, height: 38, borderRadius: 12, padding: '0 12px' }}
                />
                <button onClick={() => saveLimit(u.uid)} disabled={savingUid === u.uid} className="btn btn--primary btn--sm">
                  {savingUid === u.uid ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => saveLimit(u.uid, true)} disabled={savingUid === u.uid} className="btn btn--ghost btn--sm" title="Reset this user's scan count to 0">
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
