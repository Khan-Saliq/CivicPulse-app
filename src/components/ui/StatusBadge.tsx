import { useConfig } from '../../context/ConfigContext'
import type { IssueStatus } from '../../types'
import { Badge } from './Badge'

const statusVariant: Record<IssueStatus, 'amber' | 'blue' | 'green'> = {
  reported: 'amber',
  in_progress: 'blue',
  resolved: 'green',
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  const { config } = useConfig()
  const label = config?.statuses.find((s) => s.id === status)?.label ?? status
  return <Badge variant={statusVariant[status]}>{label}</Badge>
}
