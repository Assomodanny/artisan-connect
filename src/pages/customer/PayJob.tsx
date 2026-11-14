import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatDate, formatNaira } from '../../lib/formatters'
import { getArtisanSummaryById } from '../../services/artisanService'
import { getJobForCustomer } from '../../services/jobService'
import { getPaymentForJob, recordSimulatedPayment } from '../../services/paymentService'
import StatusBadge from '../../components/jobs/StatusBadge'
import Badge from '../../components/ui/Badge'
import Button, { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import SimulatedBanner from '../../components/ui/SimulatedBanner'
import type { PaymentStatus } from '../../types'

const RECEIPT_TITLES: Record<PaymentStatus, string> = {
  pending: 'Payment pending',
  held: 'Payment held (simulated)',
  released: 'Payment released (simulated)',
  refunded: 'Payment refunded (simulated)',
}

export default function PayJob() {
  const { user } = useAuth()
  const { jobId } = useParams()

  const [version, setVersion] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const data = useMemo(() => {
    if (!user || !jobId) return null
    const job = getJobForCustomer(user.id, jobId)
    if (!job) return null
    return {
      job,
      payment: getPaymentForJob(job.id),
      artisan: job.artisanId ? getArtisanSummaryById(job.artisanId) : null,
    }
  }, [user, jobId, version])

  function handleRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !data) return

    if (!confirmed) {
      setError('Tick the box to confirm you understand this is a simulated payment.')
      document.getElementById('pay-confirm')?.focus()
      return
    }

    const result = recordSimulatedPayment(user, data.job.id)
    setError(result.ok ? null : result.error)
    setVersion((current) => current + 1) // show the real saved state, success or not
  }

  if (!data) {
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

  const { job, payment, artisan } = data
  const jobPath = `/customer/jobs/${job.id}`
  const canPay = job.status === 'awaiting_payment' && payment?.status === 'pending'
  const hasReceipt = payment !== null && payment.status !== 'pending'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        to={jobPath}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to job
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Payment</h1>
        <Badge tone="info">Simulated</Badge>
      </div>

      <div className="mt-4">
        <SimulatedBanner>
          This is a demonstration. No money moves, no card or bank details are collected, and
          browser storage is not secure escrow. Recording a payment only changes a status in this
          browser.
        </SimulatedBanner>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
          <StatusBadge status={job.status} />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-600">Artisan</dt>
            <dd className="font-semibold text-slate-900">{artisan?.user.name ?? 'Unknown artisan'}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Agreed price</dt>
            <dd className="text-xl font-bold text-slate-900">
              {formatNaira(payment?.amount ?? job.agreedPrice ?? 0)}
            </dd>
          </div>
        </dl>
      </Card>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {canPay && payment && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">How it works in this demo</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>You record the payment here. The platform marks it as held.</li>
            <li>{artisan?.user.name ?? 'The artisan'} is told and starts the job.</li>
            <li>When the work is done, you review it and confirm.</li>
            <li>The simulated payment is then marked as released to the artisan.</li>
          </ol>

          <form onSubmit={handleRecord} noValidate className="mt-6 space-y-4">
            <label className="flex items-start gap-3 text-sm text-slate-800">
              <input
                id="pay-confirm"
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-700"
              />
              <span>I understand this is a simulated payment and no real money is moved.</span>
            </label>
            <Button type="submit">Record simulated payment of {formatNaira(payment.amount)}</Button>
          </form>
        </Card>
      )}

      {hasReceipt && payment && (
        <Card className="mt-6 border border-sky-200 bg-sky-50">
          <div className="flex items-center gap-2 text-sky-900">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-semibold">{RECEIPT_TITLES[payment.status]}</h2>
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-600">Amount</dt>
              <dd className="font-semibold text-slate-900">{formatNaira(payment.amount)}</dd>
            </div>
            {payment.heldAt && (
              <div>
                <dt className="text-slate-600">Recorded</dt>
                <dd className="font-semibold text-slate-900">{formatDate(payment.heldAt)}</dd>
              </div>
            )}
          </dl>
          {payment.status === 'held' && (
            <p className="mt-3 text-sm text-slate-700">
              Waiting for {artisan?.user.name ?? 'the artisan'} to start the job.
            </p>
          )}
          <Link to={jobPath} className={buttonClasses('secondary', 'md', 'mt-4')}>
            Back to job
          </Link>
        </Card>
      )}

      {!canPay && !hasReceipt && (
        <Card className="mt-6">
          <p className="text-slate-700">
            There is nothing to pay for this job right now. Payment opens after you accept a
            quotation and choose <strong>Continue to payment</strong> on the job page.
          </p>
          <Link to={jobPath} className={buttonClasses('primary', 'md', 'mt-4')}>
            Back to job
          </Link>
        </Card>
      )}
    </div>
  )
}