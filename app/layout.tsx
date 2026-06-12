import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import Dock from '@/components/Dock'
import MeshBackground from '@/components/MeshBackground'

export const metadata: Metadata = {
  title: 'Receipt Splitter',
  description: 'Split restaurant bills with friends instantly',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MeshBackground />
        <AuthProvider>
          <Header />
          <main>
            <AuthGate>{children}</AuthGate>
          </main>
          <Dock />
        </AuthProvider>
      </body>
    </html>
  )
}
