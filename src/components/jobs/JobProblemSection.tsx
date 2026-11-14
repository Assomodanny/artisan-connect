import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import { formatDate } from '../../lib/formatters'
import {
  cancelJob,
  getRefundRequestForJob,
  reportProblem,
  requestRefund,
  validateReason,
  withdrawRefundRequest,
} from '../../services/refundService'
import type { JobStatus } from '../../types'
import type { Job } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ConfirmDialog from '../ui/ConfirmDialog'
import TextAreaField from '../ui/TextAreaField'
import RefundStatusBadge from './RefundStatusBadge'

type DialogKind = 'cancel' | 'refund' | 'problem'

interface DialogText {
  title: string
  confirmLabel: string
  cancelLabel: string
  variant: 'primary' | 'danger'
  intro: string
  success: string
}

const DIALOGS: Record<DialogKind, DialogText> = {
  cancel: {
    title: 'Cancel this job?',
    confirmLabel: 'Yes, cancel this job',
    cancelLabel: 'Keep job',
    variant: 'danger',
    intro:
      "This closes the job. Any artisans who applied or were chosen will be told. This can't be undone.",
    success: 'Job cancelled. The artisans involved have been notified.',
  },
  refund: {
    title: 'Request a refund?',
    confirmLabel: 'Request refund',
    cancelLabel: 'Cancel',
    variant: 'primary',
    intro:
      'Explain what went wrong. The artisan is told, and the simulated payment stays held while the request is reviewed.',
    success: 'Refund requested. The artisan has been notified and the request is awaiting review.',
  },
  problem: {
    title: 'Report a problem with the work?',
    confirmLabel: 'Report problem',
    cancelLabel: 'Cancel',
    variant: 'primary',
    intro:
      'The work is sent to the Demo Reviewer to decide. The simulated payment stays held until then.',
    success: 'Problem reported. The Demo Reviewer will decide. The payment stays held (simulated) until then.',
  },
}

const CANCELLABLE: JobStatus[] = ['open', 'applications_received', 'artisan_selected', 'awaiting_payment']
const REFUNDABLE: JobStatus[] = ['payment_held', 'in_progress', 'awaiting_confirmation']

interface Message {
  tone: 'success' | 'error'
  text: string
}

interface JobProblemSectionProps {
  job: Job
  onChanged: () => void // tells the page to read the saved data again
}

export default function JobProblemSection({ job, onChanged }: JobProblemSectionProps) {
  const { user } = useAuth()
  const [dialog, setDialog] = useState<DialogKind | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)

  // Re-reads whenever the job changes (every status change updates job.updatedAt).
  const request = useMemo(() => getRefundRequestForJob(job.id), [job.id, job.status, job.updatedAt])

  const canCancel = CANCELLABLE.includes(job.status)
  const canRefund = REFUNDABLE.includes(job.status)
  const canReport = job.status === 'awaiting_confirmation'
  const isCancelled = job.status === 'cancelled'

  function openDialog(kind: DialogKind) {
    setReason('')
    setReasonError(null)
    setDialog(kind)
  }

  function handleConfirm() {
    if (!user || !dialog) return

    if (dialog !== 'cancel') {
      const problem = validateReason(reason)
      if (problem) {
        setReasonError(problem)
        document.getElementById('problem-reason')?.focus()
        return // keep the dialog open so the person can fix it
      }
    }

    const kind = dialog
    const result =
      kind === 'cancel'
        ? cancelJob(user, job.id)
        : kind === 'refund'
          ? requestRefund(user, job.id, reason)
          : reportProblem(user, job.id, reason)

    setDialog(null)
    setMessage(
      result.ok ? { tone: 'success', text: DIALOGS[kind].success } : { tone: 'error', text: result.error },
    )
    onChanged()
  }

  function handleWithdraw() {
    if (!user || !request) return
    const result = withdrawRefundRequest(user, request.id)
    setMessage(
      result.ok
        ? { tone: 'success', text: 'Request withdrawn. Your job is back where it was.' }
        : { tone: 'error', text: result.error },
    )
    onChanged()
  }

  const hasContent = message !== null || request !== null || isCancelled || canCancel || canRefund
  if (!hasContent) return null

  const current = dialog ? DIALOGS[dialog] : null

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

      {request && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">
              {request.status === 'disputed' ? 'Dispute' : 'Refund request'}
            </h2>
            <RefundStatusBadge status={request.status} />
          </div>
          <p className="mt-1 text-xs text-slate-600">Opened {formatDate(request.createdAt)}</p>
          <p className="mt-3 text-slate-700">{request.reason}</p>
          
          {request.artisanResponse && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Artisan's response</p>
              <p className="mt-1">{request.artisanResponse}</p>
            </div>
          )}

          {request.resolutionNote && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {request.resolutionNote}
            </p>
          )}

          {request.status === 'pending' && (
            <div className="mt-4">
              <Button variant="secondary" onClick={handleWithdraw}>
                Withdraw request
              </Button>
            </div>
          )}
          {request.status === 'disputed' && (
            <p className="mt-3 text-sm text-slate-600">
              Waiting for the Demo Reviewer to decide. The payment stays held (simulated) until then.
            </p>
          )}
        </Card>
      )}

      {isCancelled && (
        <Card>
          <h2 className="font-semibold text-slate-900">This job was cancelled</h2>
          <p className="mt-1 text-sm text-slate-600">
            No payment was taken. You can post a new job at any time.
          </p>
        </Card>
      )}

      {(canCancel || canRefund) && (
        <Card>
          <h2 className="font-semibold text-slate-900">
            {canCancel ? 'Need to cancel?' : 'Something not right?'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {canCancel
              ? 'You can cancel until the payment is recorded. Artisans involved will be told.'
              : canReport
                ? 'Reporting a problem sends the work straight to the Demo Reviewer. A refund request asks for the simulated payment back, and the artisan can respond.'
                : 'If the work is not going as agreed, you can ask for a refund of the simulated payment.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {canCancel && (
              <Button variant="secondary" onClick={() => openDialog('cancel')}>
                Cancel job
              </Button>
            )}
            {canReport && (
              <Button variant="secondary" onClick={() => openDialog('problem')}>
                Report a problem with the work
              </Button>
            )}
            {canRefund && (
              <Button variant="secondary" onClick={() => openDialog('refund')}>
                Request a refund
              </Button>
            )}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={dialog !== null}
        title={current?.title ?? ''}
        confirmLabel={current?.confirmLabel ?? 'Confirm'}
        cancelLabel={current?.cancelLabel}
        confirmVariant={current?.variant}
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      >
        <p>{current?.intro}</p>
        {dialog && dialog !== 'cancel' && (
          <div className="mt-4">
            <TextAreaField
              id="problem-reason"
              label="What went wrong?"
              rows={4}
              maxLength={500}
              hint="At least 10 characters."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              error={reasonError}
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}