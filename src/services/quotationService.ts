import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { formatNaira } from '../lib/formatters'
import { createId } from '../lib/ids'
import { applyTransition } from '../lib/statusMachine'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Application, Job, Notification } from '../types'
import type { PublicUser } from './authService'
import { AVAILABLE_STATUSES } from './jobBrowseService'
import { buildNotification } from './notificationService'
import { getArtisanProfile, isArtisanProfileComplete } from './profileService'

export const PROPOSAL_MIN_LENGTH = 20
export const PROPOSAL_MAX_LENGTH = 600
export const MIN_PRICE = 1000
export const MAX_PRICE = 100_000_000
export const MAX_DAYS = 365

// Everything in the quotation form, as text (that is what inputs give us).
export interface QuotationFormValues {
  price: string
  estimatedDays: string
  proposal: string
}

export type QuotationFieldName = keyof QuotationFormValues
export type QuotationFieldErrors = Partial<Record<QuotationFieldName, string>>

export function validateQuotationInput(values: QuotationFormValues): QuotationFieldErrors {
  const errors: QuotationFieldErrors = {}

  const price = Number(values.price)
  if (!values.price.trim() || !Number.isFinite(price)) {
    errors.price = 'Enter your price as a number.'
  } else if (!Number.isInteger(price) || price < MIN_PRICE) {
    errors.price = `Price must be a whole number of at least ${formatNaira(MIN_PRICE)}.`
  } else if (price > MAX_PRICE) {
    errors.price = 'That price is too large.'
  }

  const days = Number(values.estimatedDays)
  if (!values.estimatedDays.trim() || !Number.isFinite(days)) {
    errors.estimatedDays = 'Enter how many days the job will take.'
  } else if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    errors.estimatedDays = `Enter a whole number of days from 1 to ${MAX_DAYS}.`
  }

  const proposal = values.proposal.trim()
  if (proposal.length < PROPOSAL_MIN_LENGTH) {
    errors.proposal = `Describe your plan in at least ${PROPOSAL_MIN_LENGTH} characters.`
  } else if (proposal.length > PROPOSAL_MAX_LENGTH) {
    errors.proposal = `Keep your proposal under ${PROPOSAL_MAX_LENGTH} characters.`
  }

  return errors
}

function fail(error: string): ActionResult {
  return { ok: false, error }
}

export function createApplication(
  artisan: PublicUser,
  jobId: string,
  values: QuotationFormValues,
): ActionResult {
  if (artisan.role !== 'artisan') return fail('Only artisans can send quotations.')

  if (Object.keys(validateQuotationInput(values)).length > 0) {
    return fail('Please fix the highlighted fields.')
  }

  if (!isArtisanProfileComplete(getArtisanProfile(artisan.id))) {
    return fail('Complete your profile before you apply for jobs.')
  }

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const applications = readList<Application>(STORAGE_KEYS.applications)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job) return fail('This job no longer exists.')

  if (!AVAILABLE_STATUSES.includes(job.status)) {
    return fail('This job is no longer open for applications.')
  }

  // Stops double-clicks and a second open tab. A withdrawn quotation does not count.
  const existing = applications.find(
    (item) => item.jobId === job.id && item.artisanId === artisan.id && item.status !== 'withdrawn',
  )
  if (existing) return fail('You have already applied for this job.')

  // The first application moves the job to "Applications Received", through the status engine.
  let nextJobs = jobs
  if (job.status === 'open') {
    const transition = applyTransition(job, 'applications_received', 'system', {
      note: 'First application received',
    })
    if (!transition.ok) return fail(transition.error)
    nextJobs = jobs.map((item) => (item.id === job.id ? transition.job : item))
  }

  const application: Application = {
    id: createId('app'),
    jobId: job.id,
    artisanId: artisan.id,
    proposal: values.proposal.trim(),
    price: Number(values.price),
    estimatedDays: Number(values.estimatedDays),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  const notification = buildNotification(
    job.customerId,
    `${artisan.name} sent a quotation of ${formatNaira(application.price)} for “${job.title}”.`,
    job.id,
  )

  return commitWrites([
    { key: STORAGE_KEYS.jobs, value: nextJobs, old: jobs },
    { key: STORAGE_KEYS.applications, value: [...applications, application], old: applications },
    { key: STORAGE_KEYS.notifications, value: [...notifications, notification], old: notifications },
  ])
}

// Only a quotation that is still awaiting a decision can be withdrawn.
export function withdrawApplication(artisan: PublicUser, applicationId: string): ActionResult {
  if (artisan.role !== 'artisan') return fail('Only artisans can withdraw a quotation.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const applications = readList<Application>(STORAGE_KEYS.applications)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const application = applications.find(
    (item) => item.id === applicationId && item.artisanId === artisan.id,
  )
  if (!application) return fail('This quotation no longer exists.')

  if (application.status !== 'pending') {
    return fail('Only a quotation that is still awaiting a decision can be withdrawn.')
  }

  const job = jobs.find((item) => item.id === application.jobId)

  const nextApplications = applications.map((item) =>
    item.id === application.id ? { ...item, status: 'withdrawn' as const } : item,
  )

  const nextNotifications = job
    ? [
        ...notifications,
        buildNotification(
          job.customerId,
          `${artisan.name} withdrew their quotation for “${job.title}”.`,
          job.id,
        ),
      ]
    : notifications

  return commitWrites([
    { key: STORAGE_KEYS.applications, value: nextApplications, old: applications },
    { key: STORAGE_KEYS.notifications, value: nextNotifications, old: notifications },
  ])
}

// ---------- This artisan's own applications ----------

export interface MyApplication {
  application: Application
  job: Job | null // null if the job no longer exists
}

export function getApplicationsForArtisan(artisanId: string): MyApplication[] {
  const jobs = readList<Job>(STORAGE_KEYS.jobs)

  return readList<Application>(STORAGE_KEYS.applications)
    .filter((item) => item.artisanId === artisanId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((application) => ({
      application,
      job: jobs.find((item) => item.id === application.jobId) ?? null,
    }))
}