import { useMemo } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/formatters'
import {
  averageRating,
  getRatingBreakdown,
  getReviewsForArtisan,
} from '../../services/artisanReviewService'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import RatingStars from '../../components/ui/RatingStars'

export default function MyReviews() {
  const { user } = useAuth()
  const items = useMemo(() => (user ? getReviewsForArtisan(user.id) : []), [user])

  const reviews = items.map((item) => item.review)
  const average = averageRating(reviews)
  const breakdown = getRatingBreakdown(reviews)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">My reviews</h1>
        <Link to="/artisan/earnings" className={buttonClasses('secondary', 'md')}>
          Earnings
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="mt-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No reviews yet</h2>
          <p className="mt-1 text-slate-600">
            A review appears here after a customer confirms a finished job and rates your work.
          </p>
          <Link to="/artisan/active" className={buttonClasses('primary', 'md', 'mt-4')}>
            View active jobs
          </Link>
        </Card>
      ) : (
        <>
          <Card className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-5xl font-bold text-slate-900">{average.toFixed(1)}</p>
                <div className="mt-2">
                  <RatingStars rating={average} count={items.length} />
                </div>
              </div>

              <ul className="space-y-1.5">
                {breakdown.map(({ stars, count }) => (
                  <li key={stars} className="flex items-center gap-3 text-sm">
                    <span className="w-14 text-slate-700">
                      {stars} {stars === 1 ? 'star' : 'stars'}
                    </span>
                    <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <span
                        className="block h-full bg-amber-500"
                        style={{ width: `${(count / items.length) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right text-slate-700">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <ul className="mt-6 space-y-4">
            {items.map(({ review, customerFirstName, jobTitle }) => (
              <li key={review.id}>
                <Card>
                  <RatingStars rating={review.rating} />
                  <p className="mt-3 text-slate-700">{review.comment}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    {customerFirstName} reviewed “{jobTitle}” on {formatDate(review.createdAt)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}