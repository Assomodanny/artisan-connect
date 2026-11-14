import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Users, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import type { ActionResult } from '../../lib/commit'
import { formatDate, formatDateOnly, formatNaira } from '../../lib/formatters'
import { AVAILABLE_STATUSES, getJobForArtisan } from '../../services/jobBrowseService'
import {
  getArtisanProfile,
  getProfileChecks,
  isArtisanProfileComplete,
} from '../../services/profileService'
import ProfileCompletionCard from '../../components/artisans/ProfileCompletionCard'
import MyApplicationBadge from '../../components/jobs/MyApplicationBadge'
import QuotationForm from '../../components/jobs/QuotationForm'
import StatusBadge from '../../components/jobs/StatusBadge'
import WithdrawQuotation from '../../components/jobs/WithdrawQuotation'
import Badge from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ArtisanJobActions from '../../components/jobs/ArtisanJobActions'
import JobPhotos from '../../components/jobs/JobPhotos'

interface Message {
  tone: 'success' | 'error'
  text: string
}

export default function ArtisanJobDetails() {
  const { user } = useAuth()
  const { jobId } = useParams()

  // Bumping `version` makes the page read the saved data again after a change.
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState<Message | null>(null)

  const item = useMemo(
    () => (user && jobId ? getJobForArtisan(user.id, jobId) : null),
    [user, jobId, version],
  )
  const profile = useMemo(() => (user ? getArtisanProfile(user.id) : null), [user, version])

  function handleResult(result: ActionResult, successText: string) {
    setMessage(result.ok ? { tone: 'success', text: successText } : { tone: 'error', text: result.error })
    setVersion((current) => current + 1)
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Job not found</h1>
        <p className="mt-2 text-slate-600">
          This job doesn't exist, or it isn't open to you any more.
        </p>
        <Link to="/artisan/jobs" className={buttonClasses('primary', 'md', 'mt-6')}>
          Back to available jobs
        </Link>
      </div>
    )
  }

  const { job, customerFirstName, applicationCount, myApplication, matchesSkills } = item
  const isOpen = AVAILABLE_STATUSES.includes(job.status)
  const isSelected = Boolean(job.artisanId) && job.artisanId === user?.id

  // Can apply when the job is open and there is no live quotation (none yet, or a withdrawn one).
  const canApply = isOpen && (myApplication === null || myApplication.status === 'withdrawn')
  const profileComplete = isArtisanProfileComplete(profile)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/artisan/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Available jobs
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
        <StatusBadge status={job.status} />
      </div>

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

      <Card className="mt-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{job.category}</Badge>
          {matchesSkills && <Badge tone="success">Matches your skills</Badge>}
          {myApplication && <MyApplicationBadge status={myApplication.status} />}
        </div>

        <p className="mt-4 whitespace-pre-line text-slate-700">{job.description}</p>
                <JobPhotos images={job.images} />
                
        <ul className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
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
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            {applicationCount === 0
              ? 'No applications yet'
              : `${applicationCount} ${applicationCount === 1 ? 'application' : 'applications'} so far`}
          </li>
        </ul>

        <p className="mt-3 text-xs text-slate-600">
          Posted by {customerFirstName} on {formatDate(job.createdAt)}
        </p>
      </Card>

      {myApplication && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Your quotation</h2>
            <MyApplicationBadge status={myApplication.status} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{formatNaira(myApplication.price)}</p>
          <p className="text-sm text-slate-600">
            {myApplication.estimatedDays} {myApplication.estimatedDays === 1 ? 'day' : 'days'} to finish
          </p>
          <p className="mt-3 text-slate-700">{myApplication.proposal}</p>
          <p className="mt-2 text-xs text-slate-600">Sent {formatDate(myApplication.createdAt)}</p>

          {myApplication.status === 'pending' && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <WithdrawQuotation
                application={myApplication}
                jobTitle={job.title}
                onResult={(result) =>
                  handleResult(result, 'Quotation withdrawn. The customer has been notified.')
                }
              />
            </div>
          )}
          {myApplication.status === 'rejected' && (
            <p className="mt-3 text-sm text-slate-600">
              The customer did not choose this quotation, so you can't send another one for this job.
            </p>
          )}
        </Card>
      )}

            {isSelected && (
        <ArtisanJobActions
          key={job.id}
          job={job}
          onChanged={() => setVersion((current) => current + 1)}
        />
      )}

      {!isOpen && !isSelected && (
        <Card className="mt-6">
          <p className="text-slate-700">This job is no longer open for applications.</p>
        </Card>
      )}

      {canApply &&
        (profileComplete ? (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {myApplication ? 'Send a new quotation' : 'Send your quotation'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The customer compares prices, timelines and ratings, so be clear about what you offer.
            </p>
            <div className="mt-5">
              <QuotationForm
                job={job}
                onResult={(result) =>
                  handleResult(result, 'Quotation sent. The customer has been notified.')
                }
              />
            </div>
          </Card>
        ) : (
          <div className="mt-6">
            <ProfileCompletionCard checks={getProfileChecks(profile)} editLink />
          </div>
        ))}
    </div>
  )
}