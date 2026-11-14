import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import { formatDate, formatDateOnly, formatNaira } from '../../lib/formatters'
import { getArtisanSummaryById } from '../../services/artisanService'
import {
  acceptApplication,
  getApplicationsForJob,
  rejectApplication,
} from '../../services/applicationService'
import type { ApplicationDetail } from '../../services/applicationService'
import { getJobForCustomer } from '../../services/jobService'
import { getPaymentForJob } from '../../services/paymentService'
import { getReviewForJob } from '../../services/reviewService'
import ApplicationCard from '../../components/jobs/ApplicationCard'
import CompletionSection from '../../components/jobs/CompletionSection'
import PaymentStepCard from '../../components/jobs/PaymentStepCard'
import StatusBadge from '../../components/jobs/StatusBadge'
import StatusTimeline from '../../components/jobs/StatusTimeline'
import Badge from '../../components/ui/Badge'
import Button, { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import JobProblemSection from '../../components/jobs/JobProblemSection'
import JobPhotos from '../../components/jobs/JobPhotos'

interface PendingAction {
  kind: 'accept' | 'decline'
  detail: ApplicationDetail
}

interface Notice {
  tone: 'success' | 'error'
  text: string
}

export default function JobDetails() {
  const { user } = useAuth()
  const { jobId } = useParams()

  // Bumping `version` makes the page read the saved data again after a change.
  const [version, setVersion] = useState(0)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const details = useMemo(() => {
    if (!user || !jobId) return null
    const job = getJobForCustomer(user.id, jobId)
    if (!job) return null
    return {
      job,
      applications: getApplicationsForJob(job.id),
      artisan: job.artisanId ? getArtisanSummaryById(job.artisanId) : null,
      payment: getPaymentForJob(job.id),
      review: getReviewForJob(job.id),
    }
  }, [user, jobId, version])

  function handleConfirm() {
    if (!user || !pendingAction) return
    const { kind, detail } = pendingAction
    const artisanName = detail.artisan?.user.name ?? 'The artisan'

    const result =
      kind === 'accept'
        ? acceptApplication(user, detail.application.id)
        : rejectApplication(user, detail.application.id)

    setPendingAction(null)
    setNotice(
      result.ok
        ? {
            tone: 'success',
            text:
              kind === 'accept'
                ? `Quotation accepted. ${artisanName} has been notified.`
                : `Quotation declined. ${artisanName} has been notified.`,
          }
        : { tone: 'error', text: result.error },
    )
    setVersion((current) => current + 1)
  }

  if (!details) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Job not found</h1>
        <p className="mt-2 text-slate-600">This job doesn't exist, or it isn't one of your jobs.</p>
        <Link to="/customer/jobs" className={buttonClasses('primary', 'md', 'mt-6')}>
          Back to my jobs
        </Link>
      </div>
    )
  }

  const { job, applications, artisan, payment, review } = details

  const canDecide = job.status === 'open' || job.status === 'applications_received'
  const pending = applications.filter((item) => item.application.status === 'pending')
  const lowestPendingPrice =
    pending.length > 1 ? Math.min(...pending.map((item) => item.application.price)) : null

  const showProgress = ['in_progress', 'awaiting_confirmation', 'completed'].includes(job.status)

  const pendingName = pendingAction?.detail.artisan?.user.name ?? 'this artisan'
  const pendingPrice = pendingAction ? formatNaira(pendingAction.detail.application.price) : ''

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        to="/customer/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        My jobs
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
        <StatusBadge status={job.status} />
      </div>

      {notice && (
        <p
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'mt-6 flex items-center gap-2 rounded-lg p-3 text-sm',
            notice.tone === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-800',
          )}
        >
          {notice.tone === 'success' && (
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          {notice.text}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <Badge tone="brand">{job.category}</Badge>
            <p className="mt-4 whitespace-pre-line text-slate-700">{job.description}</p>
                      <JobPhotos images={job.images} />
                      
            <ul className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
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

            {job.artisanId && (
              <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-600">Selected artisan</dt>
                  <dd className="font-semibold text-slate-900">
                    {artisan?.user.name ?? 'Unknown artisan'}
                  </dd>
                </div>
                {job.agreedPrice !== undefined && (
                  <div>
                    <dt className="text-slate-600">Agreed price</dt>
                    <dd className="font-semibold text-slate-900">{formatNaira(job.agreedPrice)}</dd>
                  </div>
                )}
              </dl>
            )}

            {showProgress && (
              <div className="mt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Work progress</span>
                  <span className="font-semibold text-slate-900">{job.progress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Work progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={job.progress}
                  className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"
                >
                  <div className="h-full bg-brand-700" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
            )}
          </Card>

          <PaymentStepCard job={job} artisanName={artisan?.user.name ?? 'the artisan'} />

          <CompletionSection
            job={job}
            payment={payment}
            review={review}
            artisanName={artisan?.user.name ?? 'the artisan'}
              onChanged={() => setVersion((current) => current + 1)}                  
          />
          
          <JobProblemSection job={job} onChanged={() => setVersion((current) => current + 1)} />

          <section aria-labelledby="applications-heading">
            <h2 id="applications-heading" className="text-xl font-bold text-slate-900">
              Applications and quotations ({applications.length})
            </h2>

            {applications.length === 0 ? (
              <Card className="mt-4 text-center">
                <p className="font-semibold text-slate-900">No applications yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  Artisans who apply will appear here with their price and plan.
                </p>
              </Card>
            ) : (
              <ul className="mt-4 space-y-4">
                {applications.map((detail) => {
                  const isPending = detail.application.status === 'pending'
                  return (
                    <li key={detail.application.id}>
                      <ApplicationCard
                        detail={detail}
                        jobBudget={job.budget}
                        isLowestPrice={isPending && detail.application.price === lowestPendingPrice}
                        actions={
                          isPending && canDecide ? (
                            <>
                              <Button onClick={() => setPendingAction({ kind: 'accept', detail })}>
                                Accept quotation
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => setPendingAction({ kind: 'decline', detail })}
                              >
                                Decline
                              </Button>
                            </>
                          ) : undefined
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside aria-labelledby="timeline-heading">
          <Card>
            <h2 id="timeline-heading" className="text-lg font-bold text-slate-900">
              Status timeline
            </h2>
            <div className="mt-4">
              <StatusTimeline history={job.statusHistory} />
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.kind === 'decline' ? 'Decline this quotation?' : 'Accept this quotation?'}
        confirmLabel={pendingAction?.kind === 'decline' ? 'Decline quotation' : 'Accept quotation'}
        confirmVariant={pendingAction?.kind === 'decline' ? 'danger' : 'primary'}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      >
        {pendingAction?.kind === 'decline' ? (
          <p>
            {pendingName} will be told you declined their quotation of {pendingPrice}. This can't
            be undone.
          </p>
        ) : (
          <p>
            You are choosing {pendingName} at {pendingPrice}. Your other pending quotations for this
            job will be marked as not selected, and those artisans will be notified. This can't be
            undone.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}