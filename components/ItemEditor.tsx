'use client'

import { ReceiptItem } from '@/types'
import { PlusIcon } from './Icons'

interface Props {
  items: ReceiptItem[]
  onChange: (items: ReceiptItem[]) => void
}

export default function ItemEditor({ items, onChange }: Props) {
  const update = (id: string, field: keyof ReceiptItem, value: string | number) => {
    onChange(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const remove = (id: string) => onChange(items.filter(item => item.id !== id))

  const add = () => {
    onChange([...items, { id: Date.now().toString(), name: '', price: 0, quantity: 1, assignedTo: [] }])
  }

  return (
    <div className="item-list">
      {items.map(item => (
        <div key={item.id} className="item glass">
          <input
            className="ginput ginput--name"
            value={item.name}
            onChange={e => update(item.id, 'name', e.target.value)}
            placeholder="Item name"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="muted">
            <span style={{ fontSize: 13 }}>×</span>
            <input
              type="number"
              className="ginput tnum"
              style={{ width: 32, textAlign: 'center' }}
              value={item.quantity}
              min={1}
              onChange={e => update(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="item__price" style={{ display: 'flex', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12, marginRight: 4, fontFamily: 'var(--font-body)', fontWeight: 500 }}>RM</span>
            <input
              type="number"
              className="ginput tnum"
              style={{ width: 64, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}
              value={item.price}
              step="0.01"
              min={0}
              onChange={e => update(item.id, 'price', parseFloat(e.target.value) || 0)}
            />
          </div>
          <button
            onClick={() => remove(item.id)}
            aria-label="Remove item"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="dropzone"
        style={{ padding: '14px', fontSize: 14, fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <PlusIcon style={{ width: 18, height: 18 }} /> Add item manually
      </button>
    </div>
  )
}
