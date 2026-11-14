import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Job, Review, User } from '../types'
import { firstName } from './jobBrowseService'

export interface PublicReview {
  review: Review
  customerFirstName: string // the public sees first names only
  jobTitle: string
}

export function getPublicReviews(artisanId: string): PublicReview[] {
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

export function countCompletedJobs(artisanId: string): number {
  return readList<Job>(STORAGE_KEYS.jobs).filter(
    (job) => job.artisanId === artisanId && job.status === 'completed',
  ).length
}