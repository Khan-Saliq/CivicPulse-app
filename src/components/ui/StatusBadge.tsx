import { STATUS_LABELS, type IssueStatus } from '../../types'
import { Badge } from './Badge'

const statusVariant: Record<IssueStatus, 'amber' | 'blue' | 'green'> = {
  reported: 'amber',
  in_progress: 'blue',
  resolved: 'green',
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return <Badge variant={statusVariant[status]}>{STATUS_LABELS[status]}</Badge>
}
