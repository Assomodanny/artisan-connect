import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import { formatDate, formatNaira } from '../../lib/formatters'
import { getRefundCases, resolveCase } from '../../services/refundService'
import type { CaseDecision, RefundCase } from '../../services/refundService'
import RefundStatusBadge from '../../components/jobs/RefundStatusBadge'
import StatusBadge from '../../components/jobs/StatusBadge'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SimulatedBanner from '../../components/ui/SimulatedBanner'

interface PendingDecision {
  item: RefundCase
  decision: CaseDecision
}

interface Notice {
  tone: 'success' | 'error'
  text: string
}

function CaseCard({ item, actions }: { item: RefundCase; actions?: ReactNode }) {
  const { request, job } = item

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{job?.title ?? 'Unknown job'}</h3>
        <div className="flex flex-wrap gap-2">
          <RefundStatusBadge status={request.status} />
          {job && <StatusBadge status={job.status} />}
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-600">Customer</dt>
          <dd className="font-semibold text-slate-900">{item.customerName}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Artisan</dt>
          <dd className="font-semibold text-slate-900">{item.artisanName}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Amount (simulated)</dt>
          <dd className="font-semibold text-slate-900">{formatNaira(item.amount)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-slate-600">Opened {formatDate(request.createdAt)}</p>
      <p className="mt-2 text-slate-700">{request.reason}</p>

      {request.artisanResponse && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Artisan's response</p>
          <p className="mt-1">{request.artisanResponse}</p>
        </div>
      )}

      {request.resolutionNote && (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{request.resolutionNote}</p>
      )}

      {actions && <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200 pt-4">{actions}</div>}
    </Card>
  )
}

export default function ReviewerDashboard() {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [pending, setPending] = useState<PendingDecision | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const cases = useMemo(() => getRefundCases(), [version])

  function handleConfirm() {
    if (!user || !pending) return
    const { item, decision } = pending

    const result = resolveCase(user, item.request.id, decision)

    setPending(null)
    setNotice(
      result.ok
        ? {
            tone: 'success',
            text:
              decision === 'refund'
                ? 'Refund approved. The simulated payment is marked as refunded and both people were notified.'
                : 'Payment released to the artisan. Both people were notified.',
          }
        : { tone: 'error', text: result.error },
    )
    setVersion((current) => current + 1)
  }

  const pendingTitle = pending?.item.job?.title ?? 'this job'
  const pendingAmount = pending ? formatNaira(pending.item.amount) : ''

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Case review</h1>
        <Badge tone="brand">Demo Reviewer</Badge>
      </div>
      <p className="mt-1 text-slate-600">Decide refund requests and disputes between customers and artisans.</p>

      <div className="mt-4">
        <SimulatedBanner>
          Demonstration only. Decisions here only change statuses in this browser. No money moves.
        </SimulatedBanner>
      </div>

      {notice && (
        <p
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'mt-6 flex items-center gap-2 rounded-lg p-3 text-sm',
            notice.tone === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-800',
          )}
        >
          {notice.tone === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />}
          {notice.text}
        </p>
      )}

      <section aria-labelledby="open-heading" className="mt-8">
        <h2 id="open-heading" className="text-xl font-bold text-slate-900">
          Open cases ({cases.open.length})
        </h2>

        {cases.open.length === 0 ? (
          <Card className="mt-4 text-center">
            <p className="font-semibold text-slate-900">No cases need a decision</p>
            <p className="mt-1 text-sm text-slate-600">
              Refund requests and disputes from customers appear here.
            </p>
          </Card>
        ) : (
          <ul className="mt-4 space-y-4">
            {cases.open.map((item) => (
              <li key={item.request.id}>
                <CaseCard
                  item={item}
                  actions={
                    item.request.status === 'disputed' ? (
                      <>
                        <Button onClick={() => setPending({ item, decision: 'refund' })}>
                          Refund the customer
                        </Button>
                        <Button variant="secondary" onClick={() => setPending({ item, decision: 'release' })}>
                          Release payment to the artisan
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setPending({ item, decision: 'refund' })}>Approve refund</Button>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="resolved-heading" className="mt-10">
        <h2 id="resolved-heading" className="text-xl font-bold text-slate-900">
          Resolved ({cases.resolved.length})
        </h2>
        {cases.resolved.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Nothing resolved yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {cases.resolved.map((item) => (
              <li key={item.request.id}>
                <CaseCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.decision === 'release' ? 'Release payment to the artisan?' : 'Refund the customer?'}
        confirmLabel={pending?.decision === 'release' ? 'Release payment' : 'Approve refund'}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      >
        {pending?.decision === 'release' ? (
          <p>
            “{pendingTitle}” will be marked Completed and the simulated payment of {pendingAmount} will
            be released to {pending?.item.artisanName}. This can't be undone.
          </p>
        ) : (
          <p>
            “{pendingTitle}” will be marked Refunded and the simulated payment of {pendingAmount} will be
            returned to {pending?.item.customerName}. This can't be undone.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}