'use client'

import { ReceiptItem } from '@/types'

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
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
          <input
            className="flex-1 text-sm font-medium text-gray-800 outline-none min-w-0"
            value={item.name}
            onChange={e => update(item.id, 'name', e.target.value)}
            placeholder="Item name"
          />
          <div className="flex items-center gap-1 text-sm text-gray-400 shrink-0">
            <span>×</span>
            <input
              type="number"
              className="w-8 text-center outline-none text-gray-600"
              value={item.quantity}
              min={1}
              onChange={e => update(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="flex items-center text-sm font-semibold text-gray-900 shrink-0">
            <span className="text-gray-400 mr-1 text-xs">RM</span>
            <input
              type="number"
              className="w-16 text-right outline-none"
              value={item.price}
              step="0.01"
              min={0}
              onChange={e => update(item.id, 'price', parseFloat(e.target.value) || 0)}
            />
          </div>
          <button
            onClick={() => remove(item.id)}
            className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0 transition-colors"
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-400 text-sm rounded-xl hover:border-indigo-300 hover:text-indigo-400 transition-colors"
      >
        + Add item manually
      </button>
    </div>
  )
}
