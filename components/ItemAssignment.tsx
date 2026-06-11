'use client'

import { Person, ReceiptItem } from '@/types'

interface Props {
  items: ReceiptItem[]
  people: Person[]
  onChange: (items: ReceiptItem[]) => void
}

export default function ItemAssignment({ items, people, onChange }: Props) {
  const toggle = (itemId: string, personId: string) => {
    onChange(items.map(item => {
      if (item.id !== itemId) return item
      const assigned = item.assignedTo.includes(personId)
      return {
        ...item,
        assignedTo: assigned
          ? item.assignedTo.filter(id => id !== personId)
          : [...item.assignedTo, personId],
      }
    }))
  }

  const assignAll = (itemId: string) => {
    onChange(items.map(item =>
      item.id === itemId ? { ...item, assignedTo: people.map(p => p.id) } : item
    ))
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const lineTotal = item.price * item.quantity
        const perPerson = item.assignedTo.length > 0
          ? lineTotal / item.assignedTo.length
          : null

        return (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.quantity} × RM {item.price.toFixed(2)}</p>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-semibold text-gray-900 text-sm">RM {lineTotal.toFixed(2)}</p>
                {perPerson !== null && (
                  <p className="text-xs text-gray-400 mt-0.5">RM {perPerson.toFixed(2)} each</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {people.map(person => {
                const active = item.assignedTo.includes(person.id)
                return (
                  <button
                    key={person.id}
                    onClick={() => toggle(item.id, person.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {person.name}
                  </button>
                )
              })}
              {people.length > 1 && (
                <button
                  onClick={() => assignAll(item.id)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  All
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
