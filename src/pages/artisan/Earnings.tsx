import { useMemo } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { formatDate, formatNaira } from '../../lib/formatters'
import { getEarningsForArtisan } from '../../services/earningsService'
import type { PaymentStatus } from '../../types'
import Badge from '../../components/ui/Badge'
import type { BadgeTone } from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import SimulatedBanner from '../../components/ui/SimulatedBanner'

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Not paid yet',
  held: 'Held (simulated)',
  released: 'Released (simulated)',
  refunded: 'Refunded (simulated)',
}

const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  pending: 'neutral',
  held: 'info',
  released: 'success',
  refunded: 'neutral',
}

const DATE_LABEL: Record<PaymentStatus, string> = {
  pending: 'Updated',
  held: 'Held since',
  released: 'Released on',
  refunded: 'Refunded on',
}

export default function Earnings() {
  const { user } = useAuth()
  const data = useMemo(
    () => (user ? getEarningsForArtisan(user.id) : null),
    [user],
  )

  if (!data) return null
  const { entries, summary } = data

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Earnings</h1>
        <Link to="/artisan/reviews" className={buttonClasses('secondary', 'md')}>
          My reviews
        </Link>
      </div>

      <div className="mt-4">
        <SimulatedBanner>
          Every amount here is simulated. No real money moves, and no platform fee is taken out in
          this demonstration.
        </SimulatedBanner>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <dt className="text-sm text-slate-600">Earned (simulated)</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-900">{formatNaira(summary.released)}</dd>
          <p className="mt-1 text-xs text-slate-600">
            From {summary.releasedCount} {summary.releasedCount === 1 ? 'job' : 'jobs'}
          </p>
        </Card>
        <Card className="p-5">
          <dt className="text-sm text-slate-600">Held (simulated)</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-900">{formatNaira(summary.held)}</dd>
          <p className="mt-1 text-xs text-slate-600">Waiting for the customer to confirm</p>
        </Card>
        <Card className="p-5">
          <dt className="text-sm text-slate-600">Refunded (simulated)</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-900">{formatNaira(summary.refunded)}</dd>
          <p className="mt-1 text-xs text-slate-600">Returned to customers</p>
        </Card>
      </dl>

      <section aria-labelledby="history-heading" className="mt-10">
        <h2 id="history-heading" className="text-xl font-bold text-slate-900">
          Payment history ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <Card className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No payments yet</h3>
            <p className="mt-1 text-slate-600">
              When a customer records a simulated payment for a job you were chosen for, it appears
              here.
            </p>
            <Link to="/artisan/jobs" className={buttonClasses('primary', 'md', 'mt-4')}>
              Browse jobs
            </Link>
          </Card>
        ) : (
          <ul className="mt-4 space-y-3">
            {entries.map(({ payment, job, customerFirstName, date }) => (
              <li key={payment.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {job ? (
                        <Link
                          to={`/artisan/jobs/${job.id}`}
                          className="hover:text-brand-800 hover:underline focus-visible:outline-2 focus-visible:outline-brand-700"
                        >
                          {job.title}
                        </Link>
                      ) : (
                        'Job no longer available'
                      )}
                    </h3>
                    <Badge tone={PAYMENT_TONE[payment.status]}>{PAYMENT_LABEL[payment.status]}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                    <p className="text-xl font-bold text-slate-900">{formatNaira(payment.amount)}</p>
                    <p className="text-sm text-slate-600">
                      Customer: {customerFirstName}
                      {date ? ` · ${DATE_LABEL[payment.status]} ${formatDate(date)}` : ''}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}