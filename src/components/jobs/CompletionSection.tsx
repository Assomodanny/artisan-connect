import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import type { ActionResult } from '../../lib/commit'
import { formatDate, formatNaira } from '../../lib/formatters'
import { confirmCompletion } from '../../services/completionService'
import type { Job, PaymentRecord, Review } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ConfirmDialog from '../ui/ConfirmDialog'
import RatingStars from '../ui/RatingStars'
import ReviewForm from './ReviewForm'

interface CompletionSectionProps {
  job: Job
  payment: PaymentRecord | null
  review: Review | null
  artisanName: string
  onChanged: () => void // tells the page to read the saved data again
}

interface Message {
  tone: 'success' | 'error'
  text: string
}

// The last stage: confirm the work, see the released (simulated) payment, leave a review.
export default function CompletionSection({
  job,
  payment,
  review,
  artisanName,
  onChanged,
}: CompletionSectionProps) {
  const { user } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  const amount = formatNaira(payment?.amount ?? job.agreedPrice ?? 0)

  function handleConfirm() {
    if (!user) return
    const result = confirmCompletion(user, job.id)
    setConfirmOpen(false)
    setMessage(
      result.ok
        ? {
            tone: 'success',
            text: `Work confirmed. A simulated payment of ${amount} was released to ${artisanName}. You can now leave a review.`,
          }
        : { tone: 'error', text: result.error },
    )
    onChanged()
  }

  function handleReviewResult(result: ActionResult) {
    setMessage(
      result.ok
        ? { tone: 'success', text: 'Thank you. Your review was saved and the artisan was notified.' }
        : { tone: 'error', text: result.error },
    )
    onChanged()
  }

  if (job.status !== 'awaiting_confirmation' && job.status !== 'completed') return null

  return (
    <div className="space-y-4">
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

      {job.status === 'awaiting_confirmation' && (
        <Card className="border border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-900">{artisanName} says the work is complete</h2>
          <p className="mt-1 text-sm text-slate-700">
            Check the work first. Confirming marks the simulated payment of {amount} as released to{' '}
            {artisanName}, and it can't be undone.
          </p>
                   <p className="mt-2 text-sm text-slate-700">
            Not happy with the work? Don't confirm. Use the options below to report a problem or ask
            for a refund.
          </p>
          <Button className="mt-4" onClick={() => setConfirmOpen(true)}>
            Confirm work is complete
          </Button>
        </Card>
      )}

      {job.status === 'completed' && (
        <>
          {payment?.status === 'released' && (
            <Card className="border border-sky-200 bg-sky-50">
              <h2 className="font-semibold text-sky-900">Payment released (simulated)</h2>
              <p className="mt-1 text-sm text-slate-700">
                {amount} was marked as released to {artisanName}
                {payment.releasedAt ? ` on ${formatDate(payment.releasedAt)}` : ''}. No real money
                moved.
              </p>
            </Card>
          )}

          {review ? (
            <Card>
              <h2 className="font-semibold text-slate-900">Your review</h2>
              <div className="mt-2">
                <RatingStars rating={review.rating} />
              </div>
              <p className="mt-3 text-slate-700">{review.comment}</p>
              <p className="mt-2 text-xs text-slate-600">Posted {formatDate(review.createdAt)}</p>
            </Card>
          ) : (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Rate {artisanName}</h2>
              <p className="mt-1 text-sm text-slate-600">Your review helps other customers choose.</p>
              <div className="mt-4">
                <ReviewForm jobId={job.id} onResult={handleReviewResult} />
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm the work is complete?"
        confirmLabel="Confirm and release payment"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          You are confirming that {artisanName}'s work on “{job.title}” is done. The simulated
          payment of {amount} will be marked as released to them. This can't be undone.
        </p>
      </ConfirmDialog>
    </div>
  )
}