'use client'

import { useState } from 'react'
import { Person } from '@/types'

interface Props {
  people: Person[]
  onChange: (people: Person[]) => void
}

export default function PeopleManager({ people, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = () => {
    const name = input.trim()
    if (!name || people.some(p => p.name.toLowerCase() === name.toLowerCase())) return
    onChange([...people, { id: Date.now().toString(), name }])
    setInput('')
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition-colors"
          placeholder="Enter a name and press Add"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button
          onClick={add}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {people.map(person => (
          <span
            key={person.id}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium"
          >
            {person.name}
            <button
              onClick={() => onChange(people.filter(p => p.id !== person.id))}
              className="text-indigo-300 hover:text-indigo-600 leading-none transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
