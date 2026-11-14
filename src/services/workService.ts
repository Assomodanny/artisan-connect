import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { applyTransition } from '../lib/statusMachine'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Job, JobStatus, Notification, PaymentRecord, User } from '../types'
import type { PublicUser } from './authService'
import { firstName } from './jobBrowseService'
import { buildNotification } from './notificationService'

function fail(error: string): ActionResult {
  return { ok: false, error }
}

// A job this artisan was chosen for, with what the list pages need.
export interface ActiveJob {
  job: Job
  customerFirstName: string
  payment: PaymentRecord | null
}

export type JobGroup = 'action' | 'waiting' | 'done'

// Record<JobStatus, ...> makes TypeScript complain if a status is ever missing here.
const GROUP_OF: Record<JobStatus, JobGroup> = {
  open: 'waiting',
  applications_received: 'waiting',
  artisan_selected: 'waiting',
  awaiting_payment: 'waiting',
  payment_held: 'action',
  in_progress: 'action',
  awaiting_confirmation: 'waiting',
  completed: 'done',
  cancelled: 'done',
  refunded: 'done',
    refund_requested: 'action',
  disputed: 'waiting',
}

export function getJobsForSelectedArtisan(artisanId: string): ActiveJob[] {
  const users = readList<User>(STORAGE_KEYS.users)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)

  return readList<Job>(STORAGE_KEYS.jobs)
    .filter((job) => job.artisanId === artisanId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((job) => {
      const customer = users.find((user) => user.id === job.customerId)
      return {
        job,
        customerFirstName: customer ? firstName(customer.name) : 'A customer',
        payment: payments.find((item) => item.jobId === job.id) ?? null,
      }
    })
}

export function groupActiveJobs(items: ActiveJob[]): Record<JobGroup, ActiveJob[]> {
  const groups: Record<JobGroup, ActiveJob[]> = { action: [], waiting: [], done: [] }
  for (const item of items) groups[GROUP_OF[item.job.status]].push(item)
  return groups
}

// Payment Held -> Job in Progress. The status engine checks the move and records it.
export function startJob(artisan: PublicUser, jobId: string): ActionResult {
  if (artisan.role !== 'artisan') return fail('Only the selected artisan can start this job.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.artisanId !== artisan.id) return fail('This job no longer exists.')

  // A double-click or a stale tab gets the engine's own message, e.g. 'already "Job in Progress"'.
  const transition = applyTransition(job, 'in_progress', artisan, { note: 'Artisan started the job' })
  if (!transition.ok) return fail(transition.error)

  const payment = payments.find((item) => item.jobId === job.id)
  if (!payment || payment.status !== 'held') {
    return fail('There is no held payment for this job, so it cannot start.')
  }

  const notification = buildNotification(
    job.customerId,
    `${artisan.name} started work on “${job.title}”.`,
    job.id,
  )

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    { key: STORAGE_KEYS.notifications, value: [...notifications, notification], old: notifications },
  ])
}

// Progress only goes up, and only while the job is in progress. 100% comes from markJobCompleted.
export function updateProgress(artisan: PublicUser, jobId: string, value: number): ActionResult {
  if (artisan.role !== 'artisan') return fail('Only the selected artisan can update progress.')

  if (!Number.isInteger(value) || value < 0 || value > 99) {
    return fail('Progress must be a whole number from 0 to 99. Use "Mark as completed" to reach 100%.')
  }

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.artisanId !== artisan.id) return fail('This job no longer exists.')

  if (job.status !== 'in_progress') {
    return fail('Progress can only be updated while the job is in progress.')
  }
  if (value < job.progress) return fail(`Progress can only go up. It is already at ${job.progress}%.`)
  if (value === job.progress) return fail(`Progress is already at ${value}%.`)

  const updated: Job = { ...job, progress: value, updatedAt: new Date().toISOString() }

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? updated : item)),
      old: jobs,
    },
  ])
}

// Job in Progress -> Awaiting Customer Confirmation, which unlocks the customer's confirm button.
export function markJobCompleted(artisan: PublicUser, jobId: string): ActionResult {
  if (artisan.role !== 'artisan') return fail('Only the selected artisan can complete this job.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.artisanId !== artisan.id) return fail('This job no longer exists.')

  const transition = applyTransition(job, 'awaiting_confirmation', artisan, {
    note: 'Artisan marked the work as completed',
    patch: { progress: 100 },
  })
  if (!transition.ok) return fail(transition.error)

  const notification = buildNotification(
    job.customerId,
    `${artisan.name} marked “${job.title}” as complete. Please check the work and confirm.`,
    job.id,
  )

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    { key: STORAGE_KEYS.notifications, value: [...notifications, notification], old: notifications },
  ])
}