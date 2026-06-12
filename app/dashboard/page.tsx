'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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

const C = 2 * Math.PI * 46

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [splits, setSplits] = useState<SplitDoc[]>([])

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

  // spend donut geometry
  let offset = 0

  // scan pie numbers
  const isAdmin = !!profile?.isAdmin
  const scanLimit = profile?.scanLimit ?? 0
  const scanUsed = profile?.scanCount ?? 0
  const scanLeft = profile?.remaining ?? 0
  const usedLen = !isAdmin && scanLimit > 0 ? Math.min(1, scanUsed / scanLimit) * C : 0
  const pctUsed = scanLimit > 0 ? Math.min(100, (scanUsed / scanLimit) * 100) : 0
  const low = !isAdmin && scanLeft <= 3

  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>{today}</p>
          <h1 className="display" style={{ fontSize: 44 }}>{greet}, {name}.</h1>
        </div>
        <button className="btn btn--primary" onClick={() => router.push('/')}>
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
          <div className="stat__val">{isAdmin ? '∞' : (profile?.remaining ?? '—')}</div>
        </div>
        <div className="stat glass">
          <p className="stat__label">Splits saved</p>
          <div className="stat__val">{splits.length}{splits.length >= 20 ? '+' : ''}</div>
        </div>
      </div>

      {/* spending-by-person pie — always visible */}
      <div className="section-label">
        <h2 className="display" style={{ fontSize: 22 }}>Split tracker</h2>
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
          {spend.rows.length === 0 ? (
            <div className="preview-empty" style={{ padding: '28px 10px' }}>
              <ReceiptIcon />
              <div style={{ fontSize: 14 }}>No saved splits yet — each person&apos;s share will appear here once you save a split.</div>
            </div>
          ) : (
            spend.rows.map(row => {
              const pct = spend.grand ? (row.total / spend.grand) * 100 : 0
              return (
                <div className="bl-row" key={row.name}>
                  <span className="bl-dot" style={{ background: avatarColor(row.name) }} />
                  <span className="bl-name">{row.name}</span>
                  <span className="bl-bar"><span style={{ width: pct + '%', background: avatarColor(row.name) }} /></span>
                  <span className="bl-amt"><b>RM {row.total.toFixed(2)}</b></span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* scan-quota pie */}
      {profile && (
        <>
          <div className="section-label">
            <h2 className="display" style={{ fontSize: 22 }}>Scan tracker</h2>
            <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {isAdmin ? 'admin · unlimited scans' : `${scanLimit} scans per account`}
            </span>
          </div>
          <div className="budget-card glass" style={{ marginBottom: 32 }}>
            <div className="donut-wrap">
              <svg viewBox="0 0 120 120" className="donut">
                {/* remaining = mint base ring */}
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--accent)" strokeWidth="15" />
                {/* used = coral arc on top */}
                {!isAdmin && usedLen > 0 && (
                  <circle cx="60" cy="60" r="46" fill="none" stroke="var(--primary)" strokeWidth="15"
                    strokeDasharray={`${usedLen} ${C - usedLen}`} />
                )}
              </svg>
              <div className="donut__center">
                <div className={`n tnum ${low ? 'coral' : ''}`}>{isAdmin ? '∞' : scanLeft}</div>
                <div className="l">{isAdmin ? 'unlimited' : 'scans left'}</div>
              </div>
            </div>
            <div className="budget-legend">
              {isAdmin ? (
                <div className="bl-row">
                  <span className="bl-dot" style={{ background: 'var(--accent)' }} />
                  <span className="bl-name">Admin account</span>
                  <span className="bl-amt"><b>Unlimited</b></span>
                </div>
              ) : (
                <>
                  <div className="bl-row">
                    <span className="bl-dot" style={{ background: 'var(--primary)' }} />
                    <span className="bl-name">Used</span>
                    <span className="bl-bar"><span style={{ width: pctUsed + '%', background: 'var(--primary)' }} /></span>
                    <span className="bl-amt"><b>{scanUsed}</b> <span className="muted" style={{ fontSize: 12 }}>scans</span></span>
                  </div>
                  <div className="bl-row">
                    <span className="bl-dot" style={{ background: 'var(--accent)' }} />
                    <span className="bl-name">Remaining</span>
                    <span className="bl-bar"><span style={{ width: (100 - pctUsed) + '%', background: 'var(--accent)' }} /></span>
                    <span className="bl-amt"><b className={low ? 'coral' : ''}>{scanLeft}</b> <span className="muted" style={{ fontSize: 12 }}>left</span></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* recent splits */}
      {recent.length > 0 && (
        <div>
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
