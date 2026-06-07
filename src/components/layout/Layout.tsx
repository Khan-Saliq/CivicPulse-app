import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="bg-mesh" aria-hidden />
      <div
        className="bg-orb animate-glow-pulse"
        style={{
          top: '10%',
          right: '15%',
          width: 300,
          height: 300,
          background: 'rgba(34, 211, 238, 0.06)',
        }}
      />
      <div
        className="bg-orb animate-glow-pulse"
        style={{
          bottom: '20%',
          left: '5%',
          width: 250,
          height: 250,
          background: 'rgba(167, 139, 250, 0.06)',
          animationDelay: '2s',
        }}
      />
      <Navbar />
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
