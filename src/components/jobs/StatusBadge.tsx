import { STATUS_LABELS } from '../../lib/statusMachine'
import type { JobStatus } from '../../types'
import Badge from '../ui/Badge'
import type { BadgeTone } from '../ui/Badge'

// Record<JobStatus, ...> makes TypeScript complain if a status is ever missing here.
const STATUS_TONES: Record<JobStatus, BadgeTone> = {
  open: 'neutral',
  applications_received: 'info',
  artisan_selected: 'brand',
  awaiting_payment: 'warning',
  payment_held: 'info',
  in_progress: 'brand',
  awaiting_confirmation: 'warning',
  completed: 'success',
  cancelled: 'neutral',
  refund_requested: 'warning',
  refunded: 'neutral',
  disputed: 'danger',
}

export default function StatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
}