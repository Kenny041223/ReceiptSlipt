'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReceiptSession } from '@/hooks/useReceiptSession'
import { Person, ReceiptItem } from '@/types'
import PeopleManager from '@/components/PeopleManager'
import ItemAssignment from '@/components/ItemAssignment'

export default function SplitPage() {
  const router = useRouter()
  const { session, updateSession } = useReceiptSession()
  const [people, setPeople] = useState<Person[]>([])
  const [items, setItems] = useState<ReceiptItem[]>([])

  useEffect(() => {
    if (!session) return
    if (session.items.length === 0) { router.replace('/'); return }
    setPeople(session.people)
    setItems(session.items)
  }, [session])

  const allAssigned = items.length > 0 && items.every(item => item.assignedTo.length > 0)

  const handleContinue = () => {
    updateSession({ people, items })
    router.push('/summary')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Split the Bill</h1>

      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Who&apos;s splitting?
        </h2>
        <PeopleManager people={people} onChange={setPeople} />
      </section>

      {people.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Assign Items
          </h2>
          <ItemAssignment items={items} people={people} onChange={setItems} />
        </section>
      )}

      <button
        onClick={handleContinue}
        disabled={people.length === 0 || !allAssigned}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {people.length === 0
          ? 'Add people to continue'
          : !allAssigned
          ? 'Assign all items to continue'
          : 'See Summary →'}
      </button>
    </div>
  )
}
