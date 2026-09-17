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

interface MonthUsage { month: string; count: number }

export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usage, setUsage] = useState<MonthUsage[]>([])
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

  const loadUsage = async () => {
    try {
      const res = await fetch('/api/admin/usage', { headers: { Authorization: `Bearer ${await token()}` } })
      if (res.ok) {
        const data = await res.json()
        setUsage(data.months || [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (loading) return
    if (profile?.isAdmin) { loadUsers(); loadUsage() }
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

  const clientMonth = (() => { const n = new Date(); return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}` })()
  const currentCount = usage.find(u => u.month === clientMonth)?.count ?? 0
  const maxScale = Math.max(...usage.map(u => u.count), 1)
  const monthLabel = (m: string) => { const [y, mo] = m.split('-'); return new Date(+y, +mo - 1, 1).toLocaleDateString('en-MY', { month: 'short' }) }
  const SCALE_H = 110

  return (
    <div className="page page--narrow">
      <div className="section-label">
        <h1 className="display" style={{ fontSize: 30 }}>Admin — User Usage</h1>
        <span className="scan-pill">{users.length} users</span>
      </div>

      {/* Monthly scan usage for the configured Hugging Face model. */}
      <div className="glass" style={{ padding: 22, marginBottom: 22 }}>
        <div className="section-label" style={{ marginBottom: 18 }}>
          <h2 className="display" style={{ fontSize: 18 }}>Scan usage / month</h2>
          <span className="scan-pill">{currentCount} this month</span>
        </div>

        {usage.length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>No scans recorded yet this period.</p>
        ) : (
          <>
            <div style={{ position: 'relative', height: SCALE_H + 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: '100%' }}>
                {usage.map(u => {
                  const h = Math.max(4, (u.count / maxScale) * SCALE_H)
                  return (
                    <div key={u.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span className="tnum" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{u.count}</span>
                      <div style={{ width: '100%', maxWidth: 34, height: h, borderRadius: 8, background: 'var(--primary)' }} />
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {usage.map(u => (
                <span key={u.month} className="muted" style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{monthLabel(u.month)}</span>
              ))}
            </div>
          </>
        )}

        <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          This tracks successful scans sent to Hugging Face. User scan quotas reset on the 1st of each month.
        </p>
      </div>

      <div className="section-label">
        <h2 className="display" style={{ fontSize: 18 }}>Users this month</h2>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {users.map(u => {
          const atLimit = u.scanCount >= u.scanLimit
          return (
            <div key={u.uid} className="glass" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 200px' }}>
                  <span className="av av--sm" style={{ background: avatarGradient(u.email), flex: 'none' }}>{initials(u.email)}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{u.email}</span>
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
