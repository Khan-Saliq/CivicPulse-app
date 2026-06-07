import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

export function TrustScore({ score, compact }: { score: number; compact?: boolean }) {
  const Icon = score >= 75 ? ShieldCheck : score >= 50 ? Shield : ShieldAlert
  const color =
    score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const glow =
    score >= 75
      ? 'shadow-emerald-500/20'
      : score >= 50
        ? 'shadow-amber-500/20'
        : 'shadow-red-500/20'

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-medium ${color}`}>
        <Icon className="h-4 w-4" />
        {score}%
      </span>
    )
  }

  return (
    <div className="glass-card flex items-center gap-3 p-4 animate-scale-in">
      <div className={`rounded-xl bg-white/5 p-2.5 shadow-lg ${color} ${glow}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">Trust Score</p>
        <p className={`text-lg font-bold ${color}`}>{score}%</p>
      </div>
    </div>
  )
}
