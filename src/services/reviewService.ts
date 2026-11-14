import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { createId } from '../lib/ids'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type { ArtisanProfile, Job, Notification, Review, User } from '../types'
import type { PublicUser } from './authService'
import { buildNotification } from './notificationService'
import { firstName } from './jobBrowseService'

// A review together with the names a page needs to display it.
export interface ReviewDetail {
  review: Review
  customerName: string
  artisanName: string
  jobTitle: string
}

export function getRecentReviews(limit = 3): ReviewDetail[] {
  const reviews = readList<Review>(STORAGE_KEYS.reviews)
  const users = readList<User>(STORAGE_KEYS.users)
  const jobs = readList<Job>(STORAGE_KEYS.jobs)

  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown user'

  // ISO date strings sort correctly as plain text, newest first here.
  return [...reviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((review) => ({
      review,
      customerName: nameOf(review.customerId),
      artisanName: nameOf(review.artisanId),
      jobTitle: jobs.find((job) => job.id === review.jobId)?.title ?? 'a job',
    }))
}

export function getReviewForJob(jobId: string): Review | null {
  return readList<Review>(STORAGE_KEYS.reviews).find((item) => item.jobId === jobId) ?? null
}

export interface ReviewFormValues {
  rating: number
  comment: string
}

export type ReviewFieldErrors = Partial<Record<keyof ReviewFormValues, string>>

export function validateReviewInput(values: ReviewFormValues): ReviewFieldErrors {
  const errors: ReviewFieldErrors = {}

  if (!Number.isInteger(values.rating) || values.rating < 1 || values.rating > 5) {
    errors.rating = 'Choose a rating from 1 to 5 stars.'
  }

  const comment = values.comment.trim()
  if (comment.length < 10) errors.comment = 'Write at least 10 characters about your experience.'
  else if (comment.length > 500) errors.comment = 'Keep your review under 500 characters.'

  return errors
}

function fail(error: string): ActionResult {
  return { ok: false, error }
}

export function submitReview(
  customer: PublicUser,
  jobId: string,
  values: ReviewFormValues,
): ActionResult {
  if (customer.role !== 'customer') return fail('Only the customer can review this job.')

  if (Object.keys(validateReviewInput(values)).length > 0) {
    return fail('Please fix the highlighted fields.')
  }

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const reviews = readList<Review>(STORAGE_KEYS.reviews)
  const profiles = readList<ArtisanProfile>(STORAGE_KEYS.artisanProfiles)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.customerId !== customer.id) return fail('This job no longer exists.')
  if (job.status !== 'completed') {
    return fail('You can review a job only after the work is confirmed as complete.')
  }
  if (!job.artisanId) return fail('This job has no artisan to review.')

  // Stops double-clicks, a second open tab, and reviewing the same job twice.
  if (reviews.some((item) => item.jobId === job.id)) {
    return fail('You have already reviewed this job.')
  }

  const profile = profiles.find((item) => item.userId === job.artisanId)
  if (!profile) return fail("This artisan's profile no longer exists.")

  const review: Review = {
    id: createId('review'),
    jobId: job.id,
    customerId: customer.id,
    artisanId: job.artisanId,
    rating: values.rating,
    comment: values.comment.trim(),
    createdAt: new Date().toISOString(),
  }

  // The artisan's rating is worked out from ALL their reviews, so the numbers can't drift.
  const nextReviews = [...reviews, review]
  const artisanReviews = nextReviews.filter((item) => item.artisanId === job.artisanId)
  const total = artisanReviews.reduce((sum, item) => sum + item.rating, 0)
  const ratingAverage = Math.round((total / artisanReviews.length) * 10) / 10

  const nextProfiles = profiles.map((item) =>
    item.userId === profile.userId
      ? { ...item, ratingAverage, ratingCount: artisanReviews.length }
      : item,
  )

  const notification = buildNotification(
    job.artisanId,
    `You received a ${values.rating}-star review for “${job.title}”.`,
    job.id,
  )

  return commitWrites([
    { key: STORAGE_KEYS.reviews, value: nextReviews, old: reviews },
    { key: STORAGE_KEYS.artisanProfiles, value: nextProfiles, old: profiles },
    { key: STORAGE_KEYS.notifications, value: [...notifications, notification], old: notifications },
  ])
}

// ---------- An artisan's own reviews ----------

export interface ArtisanReview {
  review: Review
  customerFirstName: string // artisans see first names only
  jobTitle: string
}

export function getReviewsForArtisan(artisanId: string): ArtisanReview[] {
  const users = readList<User>(STORAGE_KEYS.users)
  const jobs = readList<Job>(STORAGE_KEYS.jobs)

  return readList<Review>(STORAGE_KEYS.reviews)
    .filter((item) => item.artisanId === artisanId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((review) => {
      const customer = users.find((user) => user.id === review.customerId)
      return {
        review,
        customerFirstName: customer ? firstName(customer.name) : 'A customer',
        jobTitle: jobs.find((job) => job.id === review.jobId)?.title ?? 'a job',
      }
    })
}

// One decimal place, like the ratings stored on artisan profiles. 0 when there are no reviews.
export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const total = reviews.reduce((sum, item) => sum + item.rating, 0)
  return Math.round((total / reviews.length) * 10) / 10
}

// How many reviews gave 5 stars, 4 stars, and so on down to 1.
export function getRatingBreakdown(reviews: Review[]): Array<{ stars: number; count: number }> {
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((item) => item.rating === stars).length,
  }))
}