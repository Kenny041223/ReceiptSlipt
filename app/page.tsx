'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { useAuth } from '@/components/AuthProvider'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore'
import { avatarGradient, avatarColor, initials } from '@/lib/avatar'
import { CameraIcon, ReceiptIcon } from '@/components/Icons'

interface SplitDoc {
  id: string
  createdAt: Timestamp | null
  people: { id: string; name: string }[]
  results: { personName: string; total: number }[]
}

export default function HomePage() {
  const router = useRouter()
  const { resetSession } = useReceiptSession()
  const { user, profile } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [splits, setSplits] = useState<SplitDoc[]>([])
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

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'users', user.uid, 'scans'), orderBy('createdAt', 'desc'), limit(20)))
      .then(snap => setSplits(snap.docs.map(d => ({ id: d.id, ...d.data() } as SplitDoc))))
      .catch(() => {})
  }, [user])

  // aggregate real per-person spend across saved splits
  const spend = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of splits) for (const r of s.results || []) {
      if (!r.personName) continue
      map[r.personName] = (map[r.personName] || 0) + (r.total || 0)
    }
    const rows = Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6)
    const grand = rows.reduce((s, r) => s + r.total, 0)
    return { rows, grand }
  }, [splits])

  const recent = splits.slice(0, 3)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = (user?.displayName || user?.email || 'there').split(/[ @]/)[0]
  const today = new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })

  // donut geometry
  const C = 2 * Math.PI * 46
  let offset = 0

  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>{today}</p>
          <h1 className="display" style={{ fontSize: 44 }}>{greet}, {name}.</h1>
        </div>
        <button className="btn btn--primary" onClick={() => fileRef.current?.click()}>
          <CameraIcon /> New split
        </button>
      </div>

      <div className="stat-row" style={{ marginBottom: 28 }}>
        <div className="stat glass">
          <p className="stat__label">Total split</p>
          <div className="stat__val coral tnum" style={{ fontSize: 24 }}>RM {spend.grand.toFixed(2)}</div>
        </div>
        <div className="stat glass">
          <p className="stat__label">Scans left</p>
          <div className="stat__val">{profile?.isAdmin ? '∞' : (profile?.remaining ?? '—')}</div>
        </div>
        <div className="stat glass">
          <p className="stat__label">Splits saved</p>
          <div className="stat__val">{splits.length}{splits.length >= 20 ? '+' : ''}</div>
        </div>
      </div>

      {/* budget / spending tracker */}
      {spend.rows.length > 0 && (
        <>
          <div className="section-label">
            <h2 className="display" style={{ fontSize: 22 }}>Spending by person</h2>
            <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>across your saved splits</span>
          </div>
          <div className="budget-card glass" style={{ marginBottom: 32 }}>
            <div className="donut-wrap">
              <svg viewBox="0 0 120 120" className="donut">
                <circle className="donut__track" cx="60" cy="60" r="46" fill="none" />
                {spend.rows.map(row => {
                  const len = spend.grand ? (row.total / spend.grand) * C : 0
                  const seg = (
                    <circle key={row.name} cx="60" cy="60" r="46" fill="none"
                      stroke={avatarColor(row.name)} strokeWidth="15"
                      strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
                  )
                  offset += len
                  return seg
                })}
              </svg>
              <div className="donut__center">
                <div className="n tnum">RM {spend.grand.toFixed(0)}</div>
                <div className="l">total spent</div>
              </div>
            </div>
            <div className="budget-legend">
              {spend.rows.map(row => {
                const pct = spend.grand ? (row.total / spend.grand) * 100 : 0
                return (
                  <div className="bl-row" key={row.name}>
                    <span className="bl-dot" style={{ background: avatarColor(row.name) }} />
                    <span className="bl-name">{row.name}</span>
                    <span className="bl-bar"><span style={{ width: pct + '%', background: avatarColor(row.name) }} /></span>
                    <span className="bl-amt"><b>RM {row.total.toFixed(2)}</b></span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* scan quota tracker */}
      {profile && !profile.isAdmin && profile.remaining !== null && (
        <>
          <div className="section-label">
            <h2 className="display" style={{ fontSize: 22 }}>Scan tracker</h2>
            <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{profile.scanLimit} scans per account</span>
          </div>
          <div className="glass" style={{ padding: '16px 22px', marginBottom: 32 }}>
            <div className="bl-row" style={{ borderBottom: 0 }}>
              <span className="bl-dot" style={{ background: 'var(--primary)' }} />
              <span className="bl-name">Receipt scans</span>
              <span className="bl-bar" style={{ width: 'auto', flex: 1 }}>
                <span style={{
                  width: `${Math.min(100, (profile.scanCount / Math.max(1, profile.scanLimit)) * 100)}%`,
                  background: profile.remaining <= 3 ? 'var(--primary)' : 'var(--accent)',
                }} />
              </span>
              <span className="bl-amt">
                <b className={profile.remaining <= 3 ? 'coral' : ''}>{profile.remaining}</b>
                <span className="muted" style={{ fontSize: 12 }}> left</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* dropzone */}
      <div
        className={`dropzone ${dragging ? 'is-over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <div className="dropzone__inner">
          <div className="dropzone__circle"><CameraIcon /></div>
          <div className="dropzone__title">Drag a receipt or click to snap</div>
          <div className="dropzone__sub">Drop any photo here — we&apos;ll pull out every line item automatically.</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      </div>

      {/* recent splits */}
      {recent.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="section-label">
            <h2 className="display" style={{ fontSize: 22 }}>Recent splits</h2>
            <a href="/history" className="topbar__link">View all</a>
          </div>
          <div className="split-list">
            {recent.map(s => {
              const amount = s.results?.reduce((sum, r) => sum + (r.total || 0), 0) ?? 0
              const date = s.createdAt?.toDate?.()
              return (
                <a key={s.id} href="/history" className="split-card glass">
                  <div className="split-card__icon"><ReceiptIcon /></div>
                  <div className="split-card__main">
                    <div className="split-card__name">{s.people?.length ?? 0} people</div>
                    <div className="split-card__meta">{date ? date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '—'}</div>
                  </div>
                  <div className="av-stack">
                    {s.people?.slice(0, 4).map(p => (
                      <span key={p.id} className="av av--sm" style={{ background: avatarGradient(p.name) }}>{initials(p.name)}</span>
                    ))}
                  </div>
                  <div className="split-card__amt"><b className="tnum coral">RM {amount.toFixed(2)}</b></div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
