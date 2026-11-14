import type { ApplicationStatus } from '../../types'
import Badge from '../ui/Badge'
import type { BadgeTone } from '../ui/Badge'

const LABELS: Record<ApplicationStatus, string> = {
  pending: 'You applied',
  accepted: 'You were chosen',
  rejected: 'Not selected',
  withdrawn: 'You withdrew',
}

const TONES: Record<ApplicationStatus, BadgeTone> = {
  pending: 'info',
  accepted: 'success',
  rejected: 'neutral',
  withdrawn: 'neutral',
}

export default function MyApplicationBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>
}