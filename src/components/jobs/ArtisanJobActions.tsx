import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import type { ActionResult } from '../../lib/commit'
import { formatDate, formatNaira } from '../../lib/formatters'
import { getPaymentForJob } from '../../services/paymentService'
import { getReviewForJob } from '../../services/reviewService'
import { markJobCompleted, startJob, updateProgress } from '../../services/workService'
import type { Job, JobStatus } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ConfirmDialog from '../ui/ConfirmDialog'
import ProgressBar from '../ui/ProgressBar'
import RatingStars from '../ui/RatingStars'
import ArtisanRefundResponse from './ArtisanRefundResponse'

interface Message {
  tone: 'success' | 'error'
  text: string
}

interface ArtisanJobActionsProps {
  job: Job
  onChanged: () => void // tells the page to read the saved data again
}

// What the selected artisan can do (or is waiting for) at each stage of the job.
export default function ArtisanJobActions({ job, onChanged }: ArtisanJobActionsProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState<Message | null>(null)
  const [progressChoice, setProgressChoice] = useState(job.progress)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const payment = useMemo(() => getPaymentForJob(job.id), [job.id, job.status, job.updatedAt])
  const review = useMemo(() => getReviewForJob(job.id), [job.id, job.status, job.updatedAt])

  const price = formatNaira(job.agreedPrice ?? payment?.amount ?? 0)
  const released = payment?.status === 'released' ? payment : null

  // The slider can never sit below the saved progress, even after a failed save.
  const sliderValue = Math.max(progressChoice, job.progress)
  const sliderMax = Math.max(95, job.progress)

  function report(result: ActionResult, successText: string) {
    setMessage(result.ok ? { tone: 'success', text: successText } : { tone: 'error', text: result.error })
    onChanged()
  }

  function handleStart() {
    if (!user) return
    report(startJob(user, job.id), 'Job started. The customer has been notified.')
  }

  function handleSaveProgress() {
    if (!user) return
    report(updateProgress(user, job.id, sliderValue), `Progress saved at ${sliderValue}%.`)
  }

  function handleComplete() {
    if (!user) return
    setConfirmOpen(false)
    report(
      markJobCompleted(user, job.id),
      'Marked as completed. The customer has been asked to check the work and confirm.',
    )
  }

  const waitingInfo: Partial<Record<JobStatus, { title: string; text: string }>> = {
    artisan_selected: {
      title: 'You were chosen for this job',
      text: `Agreed price ${price}. The customer is arranging the simulated payment. You can start once it is held.`,
    },
    awaiting_payment: {
      title: "Waiting for the customer's payment",
      text: `The customer needs to record the simulated payment of ${price}. You can start once it is held.`,
    },
    awaiting_confirmation: {
      title: 'Waiting for the customer to confirm',
      text: 'You marked the work as completed. The customer will check it and confirm, which releases the simulated payment.',
    },
    refunded: {
      title: 'Refunded',
      text: `The refund was approved. The simulated payment of ${price} was returned to the customer.`,
    },
    cancelled: {
      title: 'This job was cancelled',
      text: 'No work is needed and no payment is due.',
    },
  }
  const info = waitingInfo[job.status]

  return (
    <div className="mt-6 space-y-4">
      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'flex items-center gap-2 rounded-lg p-3 text-sm',
            message.tone === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-800',
          )}
        >
          {message.tone === 'success' && (
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          {message.text}
        </p>
      )}

      {job.status === 'payment_held' && (
        <Card className="border border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-brand-900">Payment held (simulated). You can start</h2>
          <p className="mt-1 text-sm text-slate-700">
            {price} is marked as held in this demo. Starting the job tells the customer you are on it.
          </p>
          <Button className="mt-4" onClick={handleStart}>
            Start the job
          </Button>
        </Card>
      )}

      {job.status === 'in_progress' && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Job in progress</h2>
          <div className="mt-4">
            <ProgressBar value={job.progress} />
          </div>

          <div className="mt-6">
            <label htmlFor="work-progress" className="block text-sm font-medium text-slate-800">
              Update your progress: {sliderValue}%
            </label>
            <input
              id="work-progress"
              type="range"
              min={job.progress}
              max={sliderMax}
              step={5}
              value={sliderValue}
              onChange={(event) => setProgressChoice(Number(event.target.value))}
              aria-describedby="work-progress-hint"
              className="mt-2 w-full accent-brand-700"
            />
            <p id="work-progress-hint" className="mt-1 text-sm text-slate-600">
              Progress can only move forward. Use Mark as completed to reach 100%.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
            <Button onClick={handleSaveProgress} disabled={sliderValue === job.progress}>
              Save progress
            </Button>
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              Mark as completed
            </Button>
          </div>
        </Card>
      )}

      {(job.status === 'refund_requested' || job.status === 'disputed') && (
        <ArtisanRefundResponse job={job} onResult={report} />
      )}

      {info && (
        <Card>
          <h2 className="font-semibold text-slate-900">{info.title}</h2>
          <p className="mt-1 text-sm text-slate-700">{info.text}</p>
          {job.status === 'awaiting_confirmation' && (
            <div className="mt-4">
              <ProgressBar value={job.progress} />
            </div>
          )}
        </Card>
      )}

      {job.status === 'completed' && (
        <>
          <Card className="border border-sky-200 bg-sky-50">
            <h2 className="font-semibold text-sky-900">
              {released ? 'Payment released (simulated)' : 'Job completed'}
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              {released
                ? `${price} was marked as released to you${released.releasedAt ? ` on ${formatDate(released.releasedAt)}` : ''}. No real money moved.`
                : 'The job is finished.'}
            </p>
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-900">Customer review</h2>
            {review ? (
              <>
                <div className="mt-2">
                  <RatingStars rating={review.rating} />
                </div>
                <p className="mt-3 text-slate-700">{review.comment}</p>
                <p className="mt-2 text-xs text-slate-600">Posted {formatDate(review.createdAt)}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                The customer hasn't left a review yet. It will appear here.
              </p>
            )}
          </Card>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Mark this job as completed?"
        confirmLabel="Mark as completed"
        onConfirm={handleComplete}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          The customer will be asked to check the work and confirm it. Progress is set to 100%. This
          can't be undone.
        </p>
      </ConfirmDialog>
    </div>
  )
}