import { createId } from '../lib/ids'
import { isStoredImage } from '../lib/images'
import { STORAGE_KEYS, readList, writeJSON } from '../lib/storage'
import { SERVICE_CATEGORIES } from '../types'
import type { Job, ServiceCategory } from '../types'
import type { PublicUser } from './authService'

export const MAX_JOB_PHOTOS = 4

// Everything typed into the "Post a job" form. The photos are stored pictures.
export interface JobFormValues {
  title: string
  description: string
  category: ServiceCategory | ''
  location: string
  budget: string
  preferredDate: string
  images: string[]
}

export type JobFieldName = keyof JobFormValues
export type JobFieldErrors = Partial<Record<JobFieldName, string>>
export type JobResult = { ok: true; job: Job } | { ok: false; error: string }

// The same customer posting the same title twice within this time is treated as a double-click.
const DUPLICATE_WINDOW_MS = 30_000

// Today as "YYYY-MM-DD" in the user's own timezone (used for the date picker's minimum).
export function getTodayString(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function validateJobInput(values: JobFormValues): JobFieldErrors {
  const errors: JobFieldErrors = {}

  const title = values.title.trim()
  if (title.length < 5) errors.title = 'Give your job a title of at least 5 characters.'
  else if (title.length > 80) errors.title = 'Keep the title under 80 characters.'

  if (!values.category || !SERVICE_CATEGORIES.includes(values.category)) {
    errors.category = 'Choose a service category.'
  }

  const description = values.description.trim()
  if (description.length < 20) errors.description = 'Describe the work in at least 20 characters.'
  else if (description.length > 1000) errors.description = 'Keep the description under 1000 characters.'

  const location = values.location.trim()
  if (location.length < 3) errors.location = 'Enter where the work is (area and city).'
  else if (location.length > 100) errors.location = 'Keep the location under 100 characters.'

  const budget = Number(values.budget)
  if (!values.budget.trim() || !Number.isFinite(budget)) {
    errors.budget = 'Enter your budget as a number.'
  } else if (!Number.isInteger(budget) || budget < 1000) {
    errors.budget = 'Budget must be a whole number of at least ₦1,000.'
  } else if (budget > 100_000_000) {
    errors.budget = 'That budget is too large.'
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.preferredDate)) {
    errors.preferredDate = 'Choose your preferred date.'
  } else if (values.preferredDate < getTodayString()) {
    errors.preferredDate = 'Preferred date cannot be in the past.'
  }

  if (values.images.length > MAX_JOB_PHOTOS) {
    errors.images = `You can add up to ${MAX_JOB_PHOTOS} photos.`
  } else if (values.images.some((photo) => !isStoredImage(photo))) {
    errors.images = 'One of the photos is not valid. Remove it and add it again.'
  }

  return errors
}

export function createJob(customer: PublicUser, values: JobFormValues): JobResult {
  if (customer.role !== 'customer') return { ok: false, error: 'Only customers can post jobs.' }

  const errors = validateJobInput(values)
  if (Object.keys(errors).length > 0 || !values.category) {
    return { ok: false, error: 'Please fix the highlighted fields.' }
  }

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const title = values.title.trim()
  const now = Date.now()

  const isDuplicate = jobs.some(
    (existing) =>
      existing.customerId === customer.id &&
      existing.title.toLowerCase() === title.toLowerCase() &&
      now - new Date(existing.createdAt).getTime() < DUPLICATE_WINDOW_MS,
  )
  if (isDuplicate) {
    return { ok: false, error: 'You just posted a job with this title. Check My Jobs.' }
  }

  const at = new Date(now).toISOString()
  const job: Job = {
    id: createId('job'),
    customerId: customer.id,
    title,
    description: values.description.trim(),
    category: values.category,
    location: values.location.trim(),
    budget: Number(values.budget),
    preferredDate: values.preferredDate,
    images: values.images,
    status: 'open',
    statusHistory: [{ from: null, to: 'open', by: customer.id, at }],
    createdAt: at,
    updatedAt: at,
    progress: 0,
  }

  const saved = writeJSON(STORAGE_KEYS.jobs, [...jobs, job])
  if (!saved.ok) return { ok: false, error: saved.error }

  return { ok: true, job }
}

// A customer's own jobs, newest first.
export function getJobsForCustomer(customerId: string): Job[] {
  return readList<Job>(STORAGE_KEYS.jobs)
    .filter((job) => job.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// One job, but only if it belongs to this customer.
// A job that is missing and a job that belongs to someone else look identical to the caller.
export function getJobForCustomer(customerId: string, jobId: string): Job | null {
  const job = readList<Job>(STORAGE_KEYS.jobs).find((item) => item.id === jobId)
  return job && job.customerId === customerId ? job : null
}