import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { formatNaira } from '../lib/formatters'
import { applyTransition } from '../lib/statusMachine'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Application, ApplicationStatus, Job, JobStatus, Notification, User } from '../types'
import { getArtisanSummaries } from './artisanService'
import type { ArtisanSummary } from './artisanService'
import type { PublicUser } from './authService'
import { buildNotification } from './notificationService'

// An application together with the artisan who sent it.
export interface ApplicationDetail {
  application: Application
  artisan: ArtisanSummary | null // null if the artisan's account no longer exists
}

const STATUS_RANK: Record<ApplicationStatus, number> = {
  accepted: 0,
  pending: 1,
  rejected: 2,
  withdrawn: 3,
}

// Accepted first, then pending, then the rest. Within a group, cheapest first.
export function getApplicationsForJob(jobId: string): ApplicationDetail[] {
  const artisans = getArtisanSummaries()

  return readList<Application>(STORAGE_KEYS.applications)
    .filter((application) => application.jobId === jobId)
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.price - b.price)
    .map((application) => ({
      application,
      artisan: artisans.find((item) => item.user.id === application.artisanId) ?? null,
    }))
}

// ---------- Changing applications ----------

interface Snapshot {
  jobs: Job[]
  applications: Application[]
  notifications: Notification[]
}

function commit(next: Snapshot, previous: Snapshot): ActionResult {
  return commitWrites([
    { key: STORAGE_KEYS.jobs, value: next.jobs, old: previous.jobs },
    { key: STORAGE_KEYS.applications, value: next.applications, old: previous.applications },
    { key: STORAGE_KEYS.notifications, value: next.notifications, old: previous.notifications },
  ])
}

function fail(error: string): ActionResult {
  return { ok: false, error }
}

const DECIDABLE_STATUSES: JobStatus[] = ['open', 'applications_received']

export function acceptApplication(customer: PublicUser, applicationId: string): ActionResult {
  if (customer.role !== 'customer') {
    return fail('Only the customer who posted the job can accept a quotation.')
  }

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const applications = readList<Application>(STORAGE_KEYS.applications)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)
  const users = readList<User>(STORAGE_KEYS.users)

  const application = applications.find((item) => item.id === applicationId)
  const job = application ? jobs.find((item) => item.id === application.jobId) : undefined
  if (!application || !job || job.customerId !== customer.id) {
    return fail('This quotation no longer exists.')
  }

  // Stops double-clicks and stale pages: only a pending quotation can be accepted.
  if (application.status !== 'pending') {
    return fail('This quotation is no longer open for a decision.')
  }

  if (!users.some((user) => user.id === application.artisanId && user.role === 'artisan')) {
    return fail("This artisan's account no longer exists.")
  }

  // The status engine decides whether this move is allowed, and records it in the history.
  const transition = applyTransition(job, 'artisan_selected', customer, {
    note: `Accepted a quotation of ${formatNaira(application.price)}`,
    patch: {
      artisanId: application.artisanId,
      acceptedApplicationId: application.id,
      agreedPrice: application.price,
    },
  })
  if (!transition.ok) return fail(transition.error)

  const otherPending = applications.filter(
    (item) => item.jobId === job.id && item.status === 'pending' && item.id !== application.id,
  )

  const nextApplications = applications.map((item) => {
    if (item.id === application.id) return { ...item, status: 'accepted' as const }
    if (item.jobId === job.id && item.status === 'pending') {
      return { ...item, status: 'rejected' as const }
    }
    return item
  })

  const newNotifications: Notification[] = [
    buildNotification(
      application.artisanId,
      `Your quotation for “${job.title}” was accepted. The customer will now arrange the simulated payment.`,
      job.id,
    ),
    ...otherPending.map((other) =>
      buildNotification(
        other.artisanId,
        `Another artisan was chosen for “${job.title}”. Your quotation was not selected this time.`,
        job.id,
      ),
    ),
  ]

  return commit(
    {
      jobs: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      applications: nextApplications,
      notifications: [...notifications, ...newNotifications],
    },
    { jobs, applications, notifications },
  )
}

export function rejectApplication(customer: PublicUser, applicationId: string): ActionResult {
  if (customer.role !== 'customer') {
    return fail('Only the customer who posted the job can decline a quotation.')
  }

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const applications = readList<Application>(STORAGE_KEYS.applications)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const application = applications.find((item) => item.id === applicationId)
  const job = application ? jobs.find((item) => item.id === application.jobId) : undefined
  if (!application || !job || job.customerId !== customer.id) {
    return fail('This quotation no longer exists.')
  }

  if (application.status !== 'pending') {
    return fail('This quotation is no longer open for a decision.')
  }
  if (!DECIDABLE_STATUSES.includes(job.status)) {
    return fail('Quotations can only be declined before an artisan is selected.')
  }

  const nextApplications = applications.map((item) =>
    item.id === application.id ? { ...item, status: 'rejected' as const } : item,
  )

  const notification = buildNotification(
    application.artisanId,
    `The customer declined your quotation for “${job.title}”.`,
    job.id,
  )

  return commit(
    { jobs, applications: nextApplications, notifications: [...notifications, notification] },
    { jobs, applications, notifications },
  )
}