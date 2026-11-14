import { useMemo } from 'react'
import { Link } from 'react-router'
import ProfileCompletionCard from '../../components/artisans/ProfileCompletionCard'
import DashboardPlaceholder from '../../components/dashboard/DashboardPlaceholder'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'
import { formatNaira } from '../../lib/formatters'
import { averageRating, getReviewsForArtisan } from '../../services/artisanReviewService'
import { getEarningsForArtisan } from '../../services/earningsService'
import { getArtisanProfile, getProfileChecks } from '../../services/profileService'
import { getJobsForSelectedArtisan, groupActiveJobs } from '../../services/workService'

export default function ArtisanDashboard() {
  const { user } = useAuth()

  const checks = useMemo(
    () => getProfileChecks(user ? getArtisanProfile(user.id) : null),
    [user],
  )
  const actionCount = useMemo(
    () => (user ? groupActiveJobs(getJobsForSelectedArtisan(user.id)).action.length : 0),
    [user],
  )
  const stats = useMemo(() => {
    if (!user) return null
    const reviews = getReviewsForArtisan(user.id).map((item) => item.review)
    return {
      summary: getEarningsForArtisan(user.id).summary,
      reviewCount: reviews.length,
      average: averageRating(reviews),
    }
  }, [user])

  return (
    <DashboardPlaceholder roleLabel="Artisan" upcoming={['Portfolio photos and a profile picture']}>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/artisan/jobs" className={buttonClasses('primary', 'md')}>
          Browse jobs
        </Link>
        <Link to="/artisan/applications" className={buttonClasses('secondary', 'md')}>
          My applications
        </Link>
        <Link to="/artisan/active" className={buttonClasses('secondary', 'md')}>
          Active jobs
        </Link>
        <Link to="/artisan/earnings" className={buttonClasses('secondary', 'md')}>
          Earnings
        </Link>
        <Link to="/artisan/reviews" className={buttonClasses('secondary', 'md')}>
          Reviews
        </Link>
        <Link to="/artisan/notifications" className={buttonClasses('secondary', 'md')}>
          Notifications
        </Link>
        <Link to="/artisan/profile" className={buttonClasses('secondary', 'md')}>
          Edit profile
        </Link>
      </div>

      {stats && (
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <dt className="text-sm text-slate-600">Earned (simulated)</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">
              {formatNaira(stats.summary.released)}
            </dd>
          </Card>
          <Card className="p-5">
            <dt className="text-sm text-slate-600">Held (simulated)</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{formatNaira(stats.summary.held)}</dd>
          </Card>
          <Card className="p-5">
            <dt className="text-sm text-slate-600">Your rating</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">
              {stats.reviewCount === 0
                ? 'No reviews yet'
                : `${stats.average.toFixed(1)} (${stats.reviewCount})`}
            </dd>
          </Card>
        </dl>
      )}

      {actionCount > 0 && (
        <Card className="mt-6 border border-brand-200 bg-brand-50">
          <h2 className="font-semibold text-brand-900">
            {actionCount} {actionCount === 1 ? 'job needs' : 'jobs need'} your action
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Start a job, update its progress, or answer a refund request.
          </p>
          <Link to="/artisan/active" className={buttonClasses('primary', 'md', 'mt-4')}>
            View active jobs
          </Link>
        </Card>
      )}

      <div className="mt-6">
        <ProfileCompletionCard checks={checks} editLink />
      </div>
    </DashboardPlaceholder>
  )
}