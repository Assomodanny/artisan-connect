import type { RefundRequestStatus } from '../../types'
import Badge from '../ui/Badge'
import type { BadgeTone } from '../ui/Badge'

const LABELS: Record<RefundRequestStatus, string> = {
  pending: 'Awaiting review',
  approved: 'Refund approved (simulated)',
  rejected: 'Not upheld',
  disputed: 'In dispute',
  withdrawn: 'Withdrawn',
}

const TONES: Record<RefundRequestStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'neutral',
  disputed: 'danger',
  withdrawn: 'neutral',
}

export default function RefundStatusBadge({ status }: { status: RefundRequestStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>
}