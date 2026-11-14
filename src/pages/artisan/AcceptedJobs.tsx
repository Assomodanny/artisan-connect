import { useMemo } from 'react'
import { Link } from 'react-router'
import { MapPin, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatNaira } from '../../lib/formatters'
import { getJobsForSelectedArtisan, groupActiveJobs } from '../../services/workService'
import type { ActiveJob, JobGroup } from '../../services/workService'
import type { JobStatus, PaymentStatus } from '../../types'
import StatusBadge from '../../components/jobs/StatusBadge'
import Badge from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'

const NEXT_STEP: Record<JobStatus, string> = {
  open: 'Waiting for the customer to choose an artisan.',
  applications_received: 'Waiting for the customer to choose an artisan.',
  artisan_selected: 'Waiting for the customer to record the simulated payment.',
  awaiting_payment: 'Waiting for the customer to record the simulated payment.',
  payment_held: 'Payment is held (simulated). Start the job.',
  in_progress: 'Update your progress, then mark the job as completed.',
  awaiting_confirmation: 'Waiting for the customer to check and confirm the work.',
  completed: 'Finished. The simulated payment was released to you.',
  cancelled: 'This job was cancelled.',
  refund_requested: 'The customer asked for a refund. Accept it or contest it.',
  refunded: 'The refund was approved (simulated).',
  disputed: 'In dispute. The Demo Reviewer will decide.',
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Not paid yet',
  held: 'Held (simulated)',
  released: 'Released (simulated)',
  refunded: 'Refunded (simulated)',
}

const SECTIONS: Array<{ group: JobGroup; id: string; title: string }> = [
  { group: 'action', id: 'action-heading', title: 'Needs your action' },
  { group: 'waiting', id: 'waiting-heading', title: 'Waiting on others' },
  { group: 'done', id: 'done-heading', title: 'Finished' },
]

function JobRow({ item }: { item: ActiveJob }) {
  const { job, customerFirstName, payment } = item
  const showProgress = ['in_progress', 'awaiting_confirmation', 'completed'].includes(job.status)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">
          <Link
            to={`/artisan/jobs/${job.id}`}
            className="hover:text-brand-800 hover:underline focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            {job.title}
          </Link>
        </h3>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-2">
        <Badge tone="brand">{job.category}</Badge>
      </div>

      <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          {job.location} (customer: {customerFirstName})
        </li>
        <li className="flex items-center gap-2">
          <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
          {formatNaira(job.agreedPrice ?? payment?.amount ?? 0)} ·{' '}
          {payment ? PAYMENT_LABEL[payment.status] : 'No payment recorded yet'}
        </li>
      </ul>

      {showProgress && (
        <div className="mt-4">
          <ProgressBar value={job.progress} />
        </div>
      )}

      <p className="mt-3 text-sm font-medium text-slate-700">{NEXT_STEP[job.status]}</p>
    </Card>
  )
}

export default function AcceptedJobs() {
  const { user } = useAuth()
  const items = useMemo(() => (user ? getJobsForSelectedArtisan(user.id) : []), [user])
  const groups = useMemo(() => groupActiveJobs(items), [items])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Active jobs</h1>
      <p className="mt-1 text-slate-600">Jobs you were chosen for, and where each one stands.</p>

      {items.length === 0 ? (
        <Card className="mt-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">You haven't been chosen for a job yet</h2>
          <p className="mt-1 text-slate-600">
            When a customer accepts your quotation, the job appears here.
          </p>
          <Link to="/artisan/jobs" className={buttonClasses('primary', 'md', 'mt-4')}>
            Browse jobs
          </Link>
        </Card>
      ) : (
        SECTIONS.map(({ group, id, title }) =>
          groups[group].length === 0 ? null : (
            <section key={group} aria-labelledby={id} className="mt-8">
              <h2 id={id} className="text-xl font-bold text-slate-900">
                {title} ({groups[group].length})
              </h2>
              <ul className="mt-4 space-y-4">
                {groups[group].map((item) => (
                  <li key={item.job.id}>
                    <JobRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ),
        )
      )}
    </div>
  )
}