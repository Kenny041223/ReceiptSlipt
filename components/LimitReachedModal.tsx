'use client'

import { useRouter } from 'next/navigation'

interface Props {
  scanLimit: number
}

export default function LimitReachedModal({ scanLimit }: Props) {
  const router = useRouter()
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'the administrator'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Scan limit reached</h2>
        <p className="text-sm text-gray-500 mb-1">
          You&apos;ve used all {scanLimit} of your receipt scans.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          To get more scans, please contact{' '}
          <a href={`mailto:${contact}`} className="text-indigo-600 font-medium hover:underline">
            {contact}
          </a>
          .
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}
