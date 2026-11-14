import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Job, Review, User } from '../types'
import { firstName } from './jobBrowseService'

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