import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { formatNaira } from '../lib/formatters'
import { createId } from '../lib/ids'
import { applyTransition } from '../lib/statusMachine'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Job, Notification, PaymentRecord } from '../types'
import type { PublicUser } from './authService'
import { buildNotification } from './notificationService'

function fail(error: string): ActionResult {
  return { ok: false, error }
}

export function getPaymentForJob(jobId: string): PaymentRecord | null {
  return readList<PaymentRecord>(STORAGE_KEYS.payments).find((item) => item.jobId === jobId) ?? null
}

// Artisan Selected -> Awaiting Payment. Creates the (pending) payment record.
export function proceedToPayment(customer: PublicUser, jobId: string): ActionResult {
  if (customer.role !== 'customer') return fail('Only the customer can start the payment step.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.customerId !== customer.id) return fail('This job no longer exists.')
  if (job.status !== 'artisan_selected') {
    return fail('The payment step can only start right after you choose an artisan.')
  }
  if (job.agreedPrice === undefined) return fail('This job has no agreed price yet.')

  const existing = payments.find((item) => item.jobId === job.id)
  if (existing && existing.status !== 'pending') {
    return fail('A payment already exists for this job.')
  }

  const transition = applyTransition(job, 'awaiting_payment', customer, {
    note: 'Payment step started',
  })
  if (!transition.ok) return fail(transition.error)

  const payment: PaymentRecord = {
    id: createId('pay'),
    jobId: job.id,
    amount: job.agreedPrice,
    status: 'pending',
    simulated: true,
  }

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    // Reuse a pending record if one already exists, so there is never a second one.
    { key: STORAGE_KEYS.payments, value: existing ? payments : [...payments, payment], old: payments },
  ])
}

// Awaiting Payment -> Payment Held. SIMULATED: no money moves anywhere.
export function recordSimulatedPayment(customer: PublicUser, jobId: string): ActionResult {
  if (customer.role !== 'customer') return fail('Only the customer can record a payment.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.customerId !== customer.id) return fail('This job no longer exists.')

  // Friendly message for a double-click or a second open tab.
  if (job.status !== 'awaiting_payment') {
    return fail('This job is not waiting for payment. It may already have been recorded.')
  }
  if (!job.artisanId) return fail('This job has no selected artisan.')

  const payment = payments.find((item) => item.jobId === job.id)
  if (!payment || payment.status !== 'pending') {
    return fail('There is no pending payment for this job.')
  }

  const transition = applyTransition(job, 'payment_held', customer, {
    note: `Simulated payment of ${formatNaira(payment.amount)} recorded`,
  })
  if (!transition.ok) return fail(transition.error)

  const heldPayment: PaymentRecord = {
    ...payment,
    status: 'held',
    heldAt: transition.job.updatedAt,
  }

  const notification = buildNotification(
    job.artisanId,
    `A simulated payment of ${formatNaira(payment.amount)} is held for “${job.title}”. You can start the job.`,
    job.id,
  )

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    {
      key: STORAGE_KEYS.payments,
      value: payments.map((item) => (item.id === payment.id ? heldPayment : item)),
      old: payments,
    },
    { key: STORAGE_KEYS.notifications, value: [...notifications, notification], old: notifications },
  ])
}