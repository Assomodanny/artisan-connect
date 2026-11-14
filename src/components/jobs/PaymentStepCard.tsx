import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { formatNaira } from '../../lib/formatters'
import { proceedToPayment } from '../../services/paymentService'
import type { Job } from '../../types'
import Button, { buttonClasses } from '../ui/Button'
import Card from '../ui/Card'

interface PaymentStepCardProps {
  job: Job
  artisanName: string
}

// Shows the right "payment" call to action for each stage. Renders nothing for other stages.
export default function PaymentStepCard({ job, artisanName }: PaymentStepCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const price = formatNaira(job.agreedPrice ?? 0)
  const payPath = `/customer/jobs/${job.id}/pay`

  function handleContinue() {
    if (!user) return
    const result = proceedToPayment(user, job.id)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(payPath)
  }

  if (job.status === 'artisan_selected') {
    return (
      <Card className="border border-brand-200 bg-brand-50">
        <h2 className="font-semibold text-brand-900">Next step: payment</h2>
        <p className="mt-1 text-sm text-slate-700">
          You chose {artisanName} at {price}. Record the simulated payment so they can start.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <Button className="mt-4" onClick={handleContinue}>
          Continue to payment
        </Button>
      </Card>
    )
  }

  if (job.status === 'awaiting_payment') {
    return (
      <Card className="border border-brand-200 bg-brand-50">
        <h2 className="font-semibold text-brand-900">Waiting for your payment</h2>
        <p className="mt-1 text-sm text-slate-700">
          {artisanName} can start once you record the simulated payment of {price}.
        </p>
        <Link to={payPath} className={buttonClasses('primary', 'md', 'mt-4')}>
          Go to payment
        </Link>
      </Card>
    )
  }

  if (job.status === 'payment_held') {
    return (
      <Card className="border border-sky-200 bg-sky-50">
        <h2 className="font-semibold text-sky-900">Payment held (simulated)</h2>
        <p className="mt-1 text-sm text-slate-700">
          {price} is marked as held in this demo. Waiting for {artisanName} to start the job.
        </p>
        <Link to={payPath} className={buttonClasses('secondary', 'md', 'mt-4')}>
          View payment record
        </Link>
      </Card>
    )
  }

  return null
}