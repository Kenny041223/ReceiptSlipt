'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { useFriends } from '@/hooks/useFriends'
import { Person, ReceiptItem } from '@/types'
import { avatarGradient, initials } from '@/lib/avatar'
import { ArrowRightIcon, PlusIcon } from '@/components/Icons'

const TIP_PRESETS = [0, 5, 10, 15]

export default function SplitPage() {
  const router = useRouter()
  const { session, updateSession } = useReceiptSession()
  const { friends } = useFriends()
  const [people, setPeople] = useState<Person[]>([])
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [active, setActive] = useState<string>('')
  const [taxRate, setTaxRate] = useState(0)
  const [tipPct, setTipPct] = useState(0)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!session) return
    if (session.items.length === 0) { router.replace('/'); return }
    setItems(session.items)
    setTaxRate(session.taxRate || 0)
    setTipPct(session.tipPct || 0)
    if (session.people.length > 0) {
      setPeople(session.people)
      setActive(session.people[0].id)
    }
  }, [session])

  // Fresh split with no people yet → start with the saved friends roster
  useEffect(() => {
    if (!session || session.people.length > 0) return
    if (friends.length === 0) return
    setPeople(prev => {
      if (prev.length > 0) return prev
      const seeded = friends.map(f => ({ id: f.id, name: f.name }))
      setActive(seeded[0].id)
      return seeded
    })
  }, [friends, session])

  // saved friends not currently in the split → one-tap quick add
  const quickAdd = friends.filter(f => !people.some(p => p.name.toLowerCase() === f.name.toLowerCase()))

  // shares: unassigned items are shared by everyone
  const { per, subtotal } = useMemo(() => {
    const per: Record<string, number> = {}
    people.forEach(p => { per[p.id] = 0 })
    let subtotal = 0
    for (const it of items) {
      const line = it.price * it.quantity
      subtotal += line
      const assignees = it.assignedTo.filter(id => people.some(p => p.id === id))
      const targets = assignees.length ? assignees : people.map(p => p.id)
      if (targets.length === 0) continue
      const share = line / targets.length
      targets.forEach(id => { per[id] = (per[id] || 0) + share })
    }
    return { per, subtotal }
  }, [items, people])

  const tax = subtotal * (taxRate / 100)
  const tip = subtotal * (tipPct / 100)
  const grand = subtotal + tax + tip

  const addPerson = () => {
    const name = newName.trim()
    if (!name || people.some(p => p.name.toLowerCase() === name.toLowerCase())) return
    const p = { id: Date.now().toString(), name }
    setPeople([...people, p])
    setActive(p.id)
    setNewName('')
  }

  const removePerson = (id: string) => {
    setPeople(people.filter(p => p.id !== id))
    setItems(items.map(it => ({ ...it, assignedTo: it.assignedTo.filter(a => a !== id) })))
    if (active === id) setActive(people[0]?.id ?? '')
  }

  const toggleItem = (itemId: string) => {
    if (!active) return
    setItems(items.map(it => {
      if (it.id !== itemId) return it
      const has = it.assignedTo.includes(active)
      return { ...it, assignedTo: has ? it.assignedTo.filter(a => a !== active) : [...it.assignedTo, active] }
    }))
  }

  const handleContinue = () => {
    updateSession({ people, items, taxRate, tipPct })
    router.push('/summary')
  }

  const activePerson = people.find(p => p.id === active)

  return (
    <div className="page">
      <div className="section-label">
        <h1 className="display" style={{ fontSize: 30 }}>Split the Bill</h1>
      </div>

      <div className="parser-grid">
        {/* line items */}
        <div>
          <div className="section-label">
            <h2 className="display" style={{ fontSize: 20 }}>Line items</h2>
            <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {activePerson ? <>Tap an item to add it to <b className="coral">{activePerson.name}</b></> : 'Add someone first →'}
            </span>
          </div>

          <div className="item-list">
            {items.map(it => {
              const assignees = it.assignedTo.filter(id => people.some(p => p.id === id))
              const mine = active ? it.assignedTo.includes(active) : false
              return (
                <div
                  key={it.id}
                  className={`item glass ${assignees.length ? 'has-assignee' : ''} ${active && !mine ? 'is-assignable' : ''} ${active ? 'is-clickable' : ''}`}
                  onClick={() => toggleItem(it.id)}
                >
                  {active && <span className="item__hint">{mine ? 'Remove' : `+ ${activePerson?.name}`}</span>}
                  <div className="item__qty">{it.quantity}×</div>
                  <div className="item__main">
                    <div className="item__name">{it.name}</div>
                    <div className="item__sub">
                      {assignees.length ? `Split ${assignees.length} way${assignees.length > 1 ? 's' : ''}` : 'Shared by everyone'}
                    </div>
                  </div>
                  <div className="item__price tnum">RM {(it.price * it.quantity).toFixed(2)}</div>
                  <div className="item__assignees">
                    {assignees.map(id => {
                      const p = people.find(x => x.id === id)!
                      return <span key={id} className="av av--xs" style={{ background: avatarGradient(p.name) }}>{initials(p.name)}</span>
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* roster + totals */}
        <div className="roster glass glass--strong">
          <div className="roster__title">
            <h3 className="display" style={{ fontSize: 18 }}>Who&apos;s in</h3>
            <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{people.length} people</span>
          </div>

          <div className="roster__avatars">
            {people.map(p => (
              <div key={p.id} className={`roster__person ${active === p.id ? 'is-active' : ''}`} onClick={() => setActive(p.id)}>
                <button className="roster__remove" title={`Remove ${p.name}`} onClick={e => { e.stopPropagation(); removePerson(p.id) }}>×</button>
                <span className="av av--lg" style={{ background: avatarGradient(p.name) }}>{initials(p.name)}</span>
                <span className="roster__name">{p.name}</span>
              </div>
            ))}
          </div>

          <div className="addrow">
            <input
              className="field"
              placeholder="Add a name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPerson()}
            />
            <button className="roster__add" onClick={addPerson} aria-label="Add person"><PlusIcon /></button>
          </div>

          {quickAdd.length > 0 && (
            <div>
              <p className="eyebrow" style={{ fontSize: 11, marginBottom: 8 }}>Saved friends</p>
              <div className="chips">
                {quickAdd.map(f => (
                  <button
                    key={f.id}
                    className="chip"
                    onClick={() => { setPeople([...people, { id: f.id, name: f.name }]); setActive(f.id) }}
                  >
                    + {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {people.length > 0 && (
            <div>
              {people.map(p => (
                <div className="roster__total" key={p.id}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="av av--xs" style={{ background: avatarGradient(p.name) }}>{initials(p.name)}</span> {p.name}
                  </span>
                  <b className="tnum">RM {(per[p.id] || 0).toFixed(2)}</b>
                </div>
              ))}
            </div>
          )}

          {/* tip */}
          <div className="slider-wrap">
            <div className="slider-head"><span>Tip</span><span className="coral tnum">{tipPct}% · RM {tip.toFixed(2)}</span></div>
            <input className="tip" type="range" min={0} max={30} step={1} value={tipPct} onChange={e => setTipPct(+e.target.value)} />
            <div className="tip-presets">
              {TIP_PRESETS.map(v => (
                <button key={v} className={`tip-chip ${tipPct === v ? 'is-on' : ''}`} onClick={() => setTipPct(v)}>{v}%</button>
              ))}
            </div>
          </div>

          {/* tax */}
          <div className="taxrow">
            <span>Tax / service</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min={0} max={50} step={0.5} value={taxRate} onChange={e => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))} className="field tax-input" />
              <span className="muted">%</span>
            </span>
          </div>

          <div className="bill-tot">
            <div className="bill-tot__row"><span className="muted">Subtotal</span><span className="tnum">RM {subtotal.toFixed(2)}</span></div>
            <div className="bill-tot__row"><span className="muted">Tax</span><span className="tnum">RM {tax.toFixed(2)}</span></div>
            <div className="bill-tot__row"><span className="muted">Tip</span><span className="tnum">RM {tip.toFixed(2)}</span></div>
            <div className="bill-tot__row grand"><span>Total</span><span className="tnum">RM {grand.toFixed(2)}</span></div>
          </div>

          <button onClick={handleContinue} disabled={people.length === 0} className="btn btn--primary btn--block">
            Settle up <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
