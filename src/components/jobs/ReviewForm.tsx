import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { ActionResult } from '../../lib/commit'
import { submitReview, validateReviewInput } from '../../services/reviewService'
import type { ReviewFieldErrors } from '../../services/reviewService'
import Button from '../ui/Button'
import StarRatingInput from '../ui/StarRatingInput'
import TextAreaField from '../ui/TextAreaField'

interface ReviewFormProps {
  jobId: string
  onResult: (result: ActionResult) => void
}

export default function ReviewForm({ jobId, onResult }: ReviewFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<ReviewFieldErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    const nextErrors = validateReviewInput({ rating, comment })
    setErrors(nextErrors)

    if (nextErrors.rating) {
      document.getElementById('review-rating-1')?.focus()
      return
    }
    if (nextErrors.comment) {
      document.getElementById('review-comment')?.focus()
      return
    }

    onResult(submitReview(user, jobId, { rating, comment }))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <StarRatingInput id="review-rating" value={rating} onChange={setRating} error={errors.rating} />
      <TextAreaField
        id="review-comment"
        label="Your review"
        rows={4}
        maxLength={500}
        hint="How did the work go? At least 10 characters."
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={errors.comment}
      />
      <Button type="submit">Submit review</Button>
    </form>
  )
}