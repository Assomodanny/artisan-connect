import { Link } from 'react-router'
import { CalendarDays, MapPin, Users, Wallet } from 'lucide-react'
import { formatDate, formatDateOnly, formatNaira } from '../../lib/formatters'
import type { BrowsableJob } from '../../services/jobBrowseService'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import MyApplicationBadge from './MyApplicationBadge'
import StatusBadge from './StatusBadge'

export default function ArtisanJobCard({ item }: { item: BrowsableJob }) {
  const { job, customerFirstName, applicationCount, myApplication, matchesSkills } = item

  return (
    <Link
      to={`/artisan/jobs/${job.id}`}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
    >
      <Card interactive className="h-full">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
          <StatusBadge status={job.status} />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="brand">{job.category}</Badge>
          {matchesSkills && <Badge tone="success">Matches your skills</Badge>}
          {myApplication && <MyApplicationBadge status={myApplication.status} />}
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{job.description}</p>

        <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            {job.location}
          </li>
          <li className="flex items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
            Budget {formatNaira(job.budget)}
          </li>
          <li className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            Wanted by {formatDateOnly(job.preferredDate)}
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            {applicationCount === 0
              ? 'No applications yet'
              : `${applicationCount} ${applicationCount === 1 ? 'application' : 'applications'}`}
          </li>
        </ul>

        <p className="mt-3 text-xs text-slate-600">
          Posted by {customerFirstName} on {formatDate(job.createdAt)}
        </p>
      </Card>
    </Link>
  )
}