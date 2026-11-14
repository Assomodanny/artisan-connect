import type { ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { formatNaira } from '../../lib/formatters'
import type { ApplicationDetail } from '../../services/applicationService'
import type { ApplicationStatus } from '../../types'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import type { BadgeTone } from '../ui/Badge'
import Card from '../ui/Card'
import RatingStars from '../ui/RatingStars'

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  pending: 'info',
  accepted: 'success',
  rejected: 'neutral',
  withdrawn: 'neutral',
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Awaiting your decision',
  accepted: 'Accepted',
  rejected: 'Not selected',
  withdrawn: 'Withdrawn',
}

function budgetNote(price: number, budget: number): string {
  const difference = budget - price
  if (difference === 0) return 'Matches your budget'
  return difference > 0
    ? `${formatNaira(difference)} under budget`
    : `${formatNaira(-difference)} over budget`
}

interface ApplicationCardProps {
  detail: ApplicationDetail
  jobBudget: number
  isLowestPrice: boolean
  actions?: ReactNode // buttons shown at the bottom, when the customer can decide
}

export default function ApplicationCard({
  detail,
  jobBudget,
  isLowestPrice,
  actions,
}: ApplicationCardProps) {
  const { application, artisan } = detail
  const name = artisan?.user.name ?? 'Unknown artisan'

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={name} />
          <div>
            <h3 className="font-semibold text-slate-900">{name}</h3>
            {artisan && (
              <RatingStars rating={artisan.profile.ratingAverage} count={artisan.profile.ratingCount} />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isLowestPrice && <Badge tone="success">Lowest price</Badge>}
          <Badge tone={STATUS_TONE[application.status]}>{STATUS_LABEL[application.status]}</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-1">
        <p className="text-2xl font-bold text-slate-900">{formatNaira(application.price)}</p>
        <p className="text-sm text-slate-600">{budgetNote(application.price, jobBudget)}</p>
        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {application.estimatedDays} {application.estimatedDays === 1 ? 'day' : 'days'}
        </p>
      </div>

      <p className="mt-3 text-slate-700">{application.proposal}</p>

      {artisan && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {artisan.profile.skills.map((skill) => (
            <Badge key={skill} tone="brand">
              {skill}
            </Badge>
          ))}
          <span>{artisan.profile.experienceYears} years of experience</span>
        </div>
      )}

      {actions && <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-4">{actions}</div>}
    </Card>
  )
}