import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, BadgeCheck, Briefcase, MapPin } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/formatters'
import { getArtisanSummaryById } from '../../services/artisanService'
import { countCompletedJobs, getPublicReviews } from '../../services/publicArtisanService'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import RatingStars from '../../components/ui/RatingStars'

export default function ArtisanProfilePage() {
  const { artisanId } = useParams()
  const { user: viewer } = useAuth()

  const data = useMemo(() => {
    if (!artisanId) return null
    const summary = getArtisanSummaryById(artisanId)
    if (!summary) return null
    return {
      summary,
      reviews: getPublicReviews(artisanId),
      completedJobs: countCompletedJobs(artisanId),
    }
  }, [artisanId])

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Artisan not found</h1>
        <p className="mt-2 text-slate-600">This artisan doesn't exist or is no longer listed.</p>
        <Link to="/artisans" className={buttonClasses('primary', 'md', 'mt-6')}>
          Find artisans
        </Link>
      </div>
    )
  }

  const { summary, reviews, completedJobs } = data
  const { user, profile } = summary
  const firstName = user.name.trim().split(/\s+/)[0]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/artisans"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Find artisans
      </Link>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
            <RatingStars rating={profile.ratingAverage} count={profile.ratingCount} />
          </div>
        </div>

        {profile.skills.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill} tone="brand">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        <ul className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          {profile.serviceLocation && (
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {profile.serviceLocation}
            </li>
          )}
          <li className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
            {profile.experienceYears} {profile.experienceYears === 1 ? 'year' : 'years'} of experience
          </li>
          <li className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            {completedJobs} {completedJobs === 1 ? 'job' : 'jobs'} completed
          </li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold text-slate-900">About</h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">
          {profile.bio || "This artisan hasn't added a bio yet."}
        </p>
        <p className="mt-4 text-xs text-slate-600">Member since {formatDate(user.createdAt)}</p>
      </Card>

      {viewer?.role === 'customer' && (
        <Card className="mt-6 border border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-brand-900">Want {firstName}'s help?</h2>
          <p className="mt-1 text-sm text-slate-700">
            Post a job. Artisans whose skills match can send you a quotation to compare.
          </p>
          <Link to="/customer/jobs/new" className={buttonClasses('primary', 'md', 'mt-4')}>
            Post a job
          </Link>
        </Card>
      )}
      {!viewer && (
        <Card className="mt-6 border border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-brand-900">Want {firstName}'s help?</h2>
          <p className="mt-1 text-sm text-slate-700">
            Create a customer account and post a job. Artisans whose skills match can send you a
            quotation to compare.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/register" className={buttonClasses('primary', 'md')}>
              Sign up to post a job
            </Link>
            <Link to="/login" className={buttonClasses('secondary', 'md')}>
              Log in
            </Link>
          </div>
        </Card>
      )}

      <section aria-labelledby="reviews-heading" className="mt-10">
        <h2 id="reviews-heading" className="text-xl font-bold text-slate-900">
          Reviews ({reviews.length})
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Customers can review an artisan only after confirming a finished job.
        </p>

        {reviews.length === 0 ? (
          <Card className="mt-4 text-center">
            <p className="font-semibold text-slate-900">No reviews yet</p>
            <p className="mt-1 text-sm text-slate-600">
              Reviews appear here after customers confirm a completed job.
            </p>
          </Card>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map(({ review, customerFirstName, jobTitle }) => (
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
        )}
      </section>
    </div>
  )
}