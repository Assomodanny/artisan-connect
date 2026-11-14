import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Job, PaymentRecord, PaymentStatus, User } from '../types'
import { firstName } from './jobBrowseService'

export interface EarningEntry {
  payment: PaymentRecord
  job: Job | null // null if the job no longer exists
  customerFirstName: string
  date: string // when the payment last changed state
}

export interface EarningsSummary {
  released: number // earned (simulated)
  held: number // waiting on the customer, a refund request or a dispute
  refunded: number // returned to the customer
  releasedCount: number
}

// The date that matters for each state of a payment.
function entryDate(payment: PaymentRecord, job: Job | undefined): string {
  const byStatus: Record<PaymentStatus, string | undefined> = {
    pending: undefined,
    held: payment.heldAt,
    released: payment.releasedAt,
    refunded: payment.refundedAt,
  }
  return byStatus[payment.status] ?? job?.updatedAt ?? ''
}

export function getEarningsForArtisan(artisanId: string): {
  entries: EarningEntry[]
  summary: EarningsSummary
} {
  const myJobs = readList<Job>(STORAGE_KEYS.jobs).filter((job) => job.artisanId === artisanId)
  const users = readList<User>(STORAGE_KEYS.users)

  const entries = readList<PaymentRecord>(STORAGE_KEYS.payments)
    // A "pending" payment means nothing has been recorded yet, so it isn't counted.
    .filter((payment) => payment.status !== 'pending')
    .map((payment): EarningEntry | null => {
      const job = myJobs.find((item) => item.id === payment.jobId)
      if (!job) return null // someone else's job
      const customer = users.find((user) => user.id === job.customerId)
      return {
        payment,
        job,
        customerFirstName: customer ? firstName(customer.name) : 'A customer',
        date: entryDate(payment, job),
      }
    })
    .filter((entry): entry is EarningEntry => entry !== null)
    .sort((a, b) => b.date.localeCompare(a.date))

  const sumFor = (status: PaymentStatus) =>
    entries
      .filter((entry) => entry.payment.status === status)
      .reduce((total, entry) => total + entry.payment.amount, 0)

  return {
    entries,
    summary: {
      released: sumFor('released'),
      held: sumFor('held'),
      refunded: sumFor('refunded'),
      releasedCount: entries.filter((entry) => entry.payment.status === 'released').length,
    },
  }
}