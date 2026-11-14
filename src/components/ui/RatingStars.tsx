import { Star } from 'lucide-react'
import { cx } from '../../lib/classNames'

interface RatingStarsProps {
  rating: number
  count?: number // leave out for a single review's stars
}

export default function RatingStars({ rating, count }: RatingStarsProps) {
  if (count === 0) {
    return <span className="text-sm text-slate-600">No reviews yet</span>
  }

  const filled = Math.round(rating)
  const label =
    count === undefined
      ? `Rated ${rating.toFixed(1)} out of 5`
      : `Rated ${rating.toFixed(1)} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`

  return (
    <span className="flex items-center gap-1.5">
      <span role="img" aria-label={label} className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden="true"
            className={cx('h-4 w-4', n <= filled ? 'fill-amber-500 text-amber-500' : 'text-slate-300')}
          />
        ))}
      </span>
      {count !== undefined && (
        <span className="text-sm text-slate-600">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </span>
  )
}