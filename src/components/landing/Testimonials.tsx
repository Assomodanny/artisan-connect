import { useState } from 'react'
import { getRecentReviews } from '../../services/reviewService'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import RatingStars from '../ui/RatingStars'

export default function Testimonials() {
  const [items] = useState(() => getRecentReviews(3))

  if (items.length === 0) return null

  return (
    <section aria-labelledby="reviews-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 id="reviews-heading" className="text-center text-3xl font-bold text-slate-900">
        Demonstration reviews
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
      Reviews left by accounts in this demonstration. They are not from real customers.
      </p>

      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map(({ review, customerName, artisanName, jobTitle }) => (
          <li key={review.id}>
            <Card className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-2">
                <RatingStars rating={review.rating} />
                <Badge tone="info">Demonstration review</Badge>
              </div>
              <blockquote className="mt-4 flex-1 text-slate-700">“{review.comment}”</blockquote>
              <p className="mt-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{customerName}</span> reviewed{' '}
                {artisanName} for “{jobTitle}”
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}