export function PriorityBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100)

  let barClass = 'bg-gradient-to-r from-emerald-400 to-cyan-400'
  let textClass = 'text-emerald-400'

  if (score >= 8) {
    barClass = 'bg-gradient-to-r from-red-500 to-orange-500'
    textClass = 'text-red-400'
  } else if (score >= 6) {
    barClass = 'bg-gradient-to-r from-amber-500 to-yellow-400'
    textClass = 'text-amber-400'
  } else if (score >= 4) {
    barClass = 'bg-gradient-to-r from-yellow-400 to-lime-400'
    textClass = 'text-yellow-400'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="priority-bar-track">
        <div className={`priority-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`min-w-[2.5rem] text-right text-sm font-semibold ${textClass}`}>
        {score}
      </span>
    </div>
  )
}
