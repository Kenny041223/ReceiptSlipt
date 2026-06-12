'use client'

import { useRouter } from 'next/navigation'
import { LockIcon } from './Icons'

interface Props {
  scanLimit: number
}

export default function LimitReachedModal({ scanLimit }: Props) {
  const router = useRouter()
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'the administrator'

  return (
    <div className="modal-scrim">
      <div className="modal-card">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <LockIcon style={{ width: 30, height: 30 }} />
        </div>
        <h2 className="display" style={{ fontSize: 22, marginBottom: 8 }}>Scan limit reached</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 2 }}>
          You&apos;ve used all {scanLimit} of your receipt scans.
        </p>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          To get more, please contact{' '}
          <a href={`mailto:${contact}`} className="coral" style={{ fontWeight: 700 }}>{contact}</a>.
        </p>
        <button onClick={() => router.push('/')} className="btn btn--primary btn--block">Back to home</button>
      </div>
    </div>
  )
}
