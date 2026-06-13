'use client'

import { SplitResult } from '@/types'
import { avatarGradient, initials } from '@/lib/avatar'
import { CheckIcon } from './Icons'

interface Props {
  results: SplitResult[]
  paid: Record<string, boolean>
  onTogglePaid: (id: string) => void
}

export default function SplitSummary({ results, paid, onTogglePaid }: Props) {
  return (
    <div className="person-grid">
      {results.map(person => {
        const isPaid = !!paid[person.personId]
        return (
          <div key={person.personId} className={`person-card glass ${isPaid ? 'is-paid' : ''}`}>
            {isPaid && <div className="paid-stamp"><CheckIcon style={{ width: 14, height: 14 }} /> PAID</div>}

            <div className="person-card__head">
              <span className="av av--lg" style={{ background: avatarGradient(person.personName) }}>{initials(person.personName)}</span>
              <div>
                <div className="person-card__name">{person.personName}</div>
                <div className="person-card__role">{person.items.length} item{person.items.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="person-card__items">
              {person.items.map((item, i) => (
                <div key={i} className="person-card__item">
                  <span className="muted">{item.itemName}{item.shared ? ' (shared)' : ''}</span>
                  <span className="tnum">RM {item.share.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {(person.tax > 0 || person.tip > 0) && (
              <div className="person-card__break">
                <div><span>Tax</span><span className="tnum">RM {person.tax.toFixed(2)}</span></div>
                <div><span>Tip</span><span className="tnum">RM {person.tip.toFixed(2)}</span></div>
              </div>
            )}

            <div className="person-card__total">
              <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Total</span>
              <b className={isPaid ? 'green' : 'coral'}>RM {person.total.toFixed(2)}</b>
            </div>

            {isPaid ? (
              <button className="btn btn--ghost btn--sm btn--block" onClick={() => onTogglePaid(person.personId)}>Undo</button>
            ) : (
              <button className="btn btn--accent btn--sm btn--block" onClick={() => onTogglePaid(person.personId)}><CheckIcon /> Mark paid</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
