import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import type { ActionResult } from '../../lib/commit'
import { formatDate, formatNaira } from '../../lib/formatters'
import { getApplicationsForArtisan } from '../../services/quotationService'
import MyApplicationBadge from '../../components/jobs/MyApplicationBadge'
import StatusBadge from '../../components/jobs/StatusBadge'
import WithdrawQuotation from '../../components/jobs/WithdrawQuotation'
import Badge from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'

interface Message {
  tone: 'success' | 'error'
  text: string
}

export default function MyApplications() {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState<Message | null>(null)

  const items = useMemo(
    () => (user ? getApplicationsForArtisan(user.id) : []),
    [user, version],
  )

  const pendingCount = items.filter((item) => item.application.status === 'pending').length
  const acceptedCount = items.filter((item) => item.application.status === 'accepted').length

  function handleResult(result: ActionResult) {
    setMessage(
      result.ok
        ? { tone: 'success', text: 'Quotation withdrawn. The customer has been notified.' }
        : { tone: 'error', text: result.error },
    )
    setVersion((current) => current + 1)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">My applications</h1>
        <Link to="/artisan/jobs" className={buttonClasses('primary', 'md')}>
          Browse jobs
        </Link>
      </div>

      {items.length > 0 && (
        <p className="mt-2 text-slate-600">
          {items.length} {items.length === 1 ? 'application' : 'applications'}: {pendingCount} awaiting a
          decision, {acceptedCount} accepted.
        </p>
      )}

      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'mt-6 flex items-center gap-2 rounded-lg p-3 text-sm',
            message.tone === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-800',
          )}
        >
          {message.tone === 'success' && (
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          {message.text}
        </p>
      )}

      {items.length === 0 ? (
        <Card className="mt-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">You haven't applied for any jobs yet</h2>
          <p className="mt-1 text-slate-600">Find a job that fits your skills and send your first quotation.</p>
          <Link to="/artisan/jobs" className={buttonClasses('primary', 'md', 'mt-4')}>
            Browse jobs
          </Link>
        </Card>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map(({ application, job }) => (
            <li key={application.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
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
                  </h2>
                  <MyApplicationBadge status={application.status} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {job && <Badge tone="brand">{job.category}</Badge>}
                  {job && <StatusBadge status={job.status} />}
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-1">
                  <p className="text-2xl font-bold text-slate-900">{formatNaira(application.price)}</p>
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {application.estimatedDays} {application.estimatedDays === 1 ? 'day' : 'days'}
                  </p>
                </div>

                <p className="mt-3 line-clamp-2 text-slate-700">{application.proposal}</p>
                <p className="mt-2 text-xs text-slate-600">Sent {formatDate(application.createdAt)}</p>

                {application.status === 'pending' && job && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <WithdrawQuotation
                      application={application}
                      jobTitle={job.title}
                      onResult={handleResult}
                    />
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}