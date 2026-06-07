import type { ReactNode } from 'react'

const variants: Record<string, string> = {
  default: 'bg-slate-800/80 text-slate-300 border border-white/10',
  teal: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25',
  amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  red: 'bg-red-500/15 text-red-300 border border-red-500/25',
  green: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  blue: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: keyof typeof variants
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-300 ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
