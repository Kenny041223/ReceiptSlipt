import { SplitResult } from '@/types'

interface Props {
  results: SplitResult[]
}

export default function SplitSummary({ results }: Props) {
  return (
    <div className="space-y-4">
      {results.map(person => (
        <div key={person.personId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
            <span className="font-semibold text-gray-900">{person.personName}</span>
            <span className="text-lg font-bold text-indigo-600">RM {person.total.toFixed(2)}</span>
          </div>
          <div className="px-5 py-3 space-y-1.5">
            {person.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.itemName}</span>
                <span className="text-gray-600 font-medium">RM {item.share.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
