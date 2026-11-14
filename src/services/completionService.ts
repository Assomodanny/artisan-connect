import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { formatNaira } from '../lib/formatters'
import { applyTransition } from '../lib/statusMachine'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Job, Notification, PaymentRecord } from '../types'
import type { PublicUser } from './authService'
import { buildNotification } from './notificationService'

function fail(error: string): ActionResult {
  return { ok: false, error }
}

// Awaiting Customer Confirmation -> Completed, and the held payment is marked as released.
// SIMULATED: no money moves anywhere.
export function confirmCompletion(customer: PublicUser, jobId: string): ActionResult {
  if (customer.role !== 'customer') return fail('Only the customer can confirm the work.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.customerId !== customer.id) return fail('This job no longer exists.')

  // The status engine refuses this unless the artisan has marked the work as completed.
  const transition = applyTransition(job, 'completed', customer, {
    note: 'Customer confirmed the work. Simulated payment released.',
    patch: { progress: 100 },
  })
  if (!transition.ok) return fail(transition.error)

  const payment = payments.find((item) => item.jobId === job.id)
  if (!payment || payment.status !== 'held') {
    return fail('There is no held payment for this job, so it cannot be confirmed.')
  }

  const releasedPayment: PaymentRecord = {
    ...payment,
    status: 'released',
    releasedAt: transition.job.updatedAt,
  }

  const nextNotifications = job.artisanId
    ? [
        ...notifications,
        buildNotification(
          job.artisanId,
          `The customer confirmed “${job.title}”. A simulated payment of ${formatNaira(payment.amount)} was released to you.`,
          job.id,
        ),
      ]
    : notifications

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    {
      key: STORAGE_KEYS.payments,
      value: payments.map((item) => (item.id === payment.id ? releasedPayment : item)),
      old: payments,
    },
    { key: STORAGE_KEYS.notifications, value: nextNotifications, old: notifications },
  ])
}