import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { CalendarDays, CheckCircle2, MapPin, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatDate, formatDateOnly, formatNaira } from '../../lib/formatters'
import { getJobsForCustomer } from '../../services/jobService'
import StatusBadge from '../../components/jobs/StatusBadge'
import Badge from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function MyJobs() {
  const { user } = useAuth()
  const location = useLocation()
  const [jobs] = useState(() => (user ? getJobsForCustomer(user.id) : []))

  const postedState = (location.state as { posted?: unknown } | null)?.posted
  const justPosted = typeof postedState === 'string' ? postedState : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">My jobs</h1>
        <Link to="/customer/jobs/new" className={buttonClasses('primary', 'md')}>
          Post a job
        </Link>
      </div>

      {justPosted && (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          “{justPosted}” was posted. Artisans can now apply.
        </p>
      )}

      {jobs.length === 0 ? (
        <Card className="mt-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">You haven't posted any jobs yet</h2>
          <p className="mt-1 text-slate-600">Post your first job to start receiving quotations.</p>
          <Link to="/customer/jobs/new" className={buttonClasses('primary', 'md', 'mt-4')}>
            Post a job
          </Link>
        </Card>
      ) : (
        <ul className="mt-8 space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
  <Link
    to={`/customer/jobs/${job.id}`}
    className="hover:text-brand-800 hover:underline focus-visible:outline-2 focus-visible:outline-brand-700"
  >
    {job.title}
  </Link>
</h2>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-2">
                  <Badge tone="brand">{job.category}</Badge>
                </div>
                <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {job.location}
                  </li>
                  <li className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Budget {formatNaira(job.budget)}
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Wanted by {formatDateOnly(job.preferredDate)}
                  </li>
                </ul>
                <p className="mt-3 text-xs text-slate-600">Posted {formatDate(job.createdAt)}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}