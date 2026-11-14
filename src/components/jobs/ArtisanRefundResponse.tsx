import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { ActionResult } from '../../lib/commit'
import { formatDate, formatNaira } from '../../lib/formatters'
import {
  acceptRefund,
  contestRefund,
  getRefundRequestForJob,
  validateResponse,
} from '../../services/refundService'
import type { Job } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ConfirmDialog from '../ui/ConfirmDialog'
import TextAreaField from '../ui/TextAreaField'
import RefundStatusBadge from './RefundStatusBadge'

type DialogKind = 'accept' | 'contest'

interface ArtisanRefundResponseProps {
  job: Job
  onResult: (result: ActionResult, successText: string) => void
}

export default function ArtisanRefundResponse({ job, onResult }: ArtisanRefundResponseProps) {
  const { user } = useAuth()
  const [dialog, setDialog] = useState<DialogKind | null>(null)
  const [response, setResponse] = useState('')
  const [responseError, setResponseError] = useState<string | null>(null)

  const request = useMemo(() => getRefundRequestForJob(job.id), [job.id, job.status, job.updatedAt])
  const amount = formatNaira(job.agreedPrice ?? 0)

  function openDialog(kind: DialogKind) {
    setResponse('')
    setResponseError(null)
    setDialog(kind)
  }

  function handleConfirm() {
    if (!user || !request || !dialog) return

    if (dialog === 'accept') {
      setDialog(null)
      onResult(
        acceptRefund(user, request.id),
        `Refund accepted. The simulated payment of ${amount} was marked as refunded to the customer.`,
      )
      return
    }

    const problem = validateResponse(response)
    if (problem) {
      setResponseError(problem)
      document.getElementById('contest-response')?.focus()
      return // keep the dialog open so the text can be fixed
    }

    setDialog(null)
    onResult(
      contestRefund(user, request.id, response),
      'Refund contested. The Demo Reviewer will decide, and the payment stays held (simulated) until then.',
    )
  }

  // Data inconsistency safety net: the job says refund or dispute, but no request is saved.
  if (!request) {
    return (
      <Card>
        <h2 className="font-semibold text-slate-900">
          {job.status === 'disputed' ? 'This job is in dispute' : 'The customer asked for a refund'}
        </h2>
        <p className="mt-1 text-sm text-slate-700">
          The details of the request could not be found. The Demo Reviewer will decide.
        </p>
      </Card>
    )
  }

  const isPending = request.status === 'pending'

  return (
    <Card className={isPending ? 'border border-amber-200 bg-amber-50' : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={isPending ? 'font-semibold text-amber-900' : 'font-semibold text-slate-900'}>
          {isPending ? 'The customer asked for a refund' : 'This job is in dispute'}
        </h2>
        <RefundStatusBadge status={request.status} />
      </div>
      <p className="mt-1 text-xs text-slate-600">Opened {formatDate(request.createdAt)}</p>

      <p className="mt-3 text-sm font-semibold text-slate-900">The customer's reason</p>
      <p className="mt-1 text-slate-700">{request.reason}</p>

      {request.artisanResponse && (
        <>
          <p className="mt-3 text-sm font-semibold text-slate-900">Your response</p>
          <p className="mt-1 text-slate-700">{request.artisanResponse}</p>
        </>
      )}

      {isPending ? (
        <>
          <p className="mt-3 text-sm text-slate-700">
            The simulated payment of {amount} stays held. Accept to return it to the customer, or
            contest to send the case to the Demo Reviewer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-amber-200 pt-4">
            <Button onClick={() => openDialog('accept')}>Accept refund</Button>
            <Button variant="secondary" onClick={() => openDialog('contest')}>
              Contest the request
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          The Demo Reviewer will decide. The simulated payment stays held until then.
        </p>
      )}

      <ConfirmDialog
        open={dialog !== null}
        title={dialog === 'accept' ? 'Accept this refund?' : 'Contest this refund request?'}
        confirmLabel={dialog === 'accept' ? 'Accept refund' : 'Send to Demo Reviewer'}
        confirmVariant={dialog === 'accept' ? 'danger' : 'primary'}
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      >
        {dialog === 'accept' ? (
          <p>
            The job will be marked Refunded and the simulated payment of {amount} will be returned to
            the customer. This can't be undone.
          </p>
        ) : (
          <>
            <p>
              Explain your side. The customer and the Demo Reviewer will both read it. The simulated
              payment stays held until the Demo Reviewer decides.
            </p>
            <div className="mt-4">
              <TextAreaField
                id="contest-response"
                label="Your response"
                rows={4}
                maxLength={500}
                hint="At least 10 characters."
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                error={responseError}
              />
            </div>
          </>
        )}
      </ConfirmDialog>
    </Card>
  )
}