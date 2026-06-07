import type { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'teal',
  delay = 0,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: 'teal' | 'amber' | 'blue' | 'red' | 'emerald'
  delay?: number
}) {
  const accents = {
    teal: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 shadow-cyan-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 shadow-amber-500/20',
    blue: 'from-violet-500/20 to-violet-500/5 text-violet-400 shadow-violet-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-400 shadow-red-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 shadow-emerald-500/20',
  }

  return (
    <div
      className="glass-card group p-5 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-100 transition-transform duration-300 group-hover:scale-105">
            {value}
          </p>
        </div>
        <div
          className={`rounded-xl bg-gradient-to-br p-2.5 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${accents[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
