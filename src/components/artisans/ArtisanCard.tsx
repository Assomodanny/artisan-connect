import { Link } from 'react-router'
import { Briefcase, MapPin } from 'lucide-react'
import type { ArtisanSummary } from '../../services/artisanService'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import RatingStars from '../ui/RatingStars'

interface ArtisanCardProps {
  artisan: ArtisanSummary
}

export default function ArtisanCard({ artisan }: ArtisanCardProps) {
  const { user, profile } = artisan

  return (
    <Link
      to={`/artisans/${user.id}`}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
    >
      <Card interactive className="h-full">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div>
            <h3 className="font-semibold text-slate-900">{user.name}</h3>
            <RatingStars rating={profile.ratingAverage} count={profile.ratingCount} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <Badge key={skill} tone="brand">{skill}</Badge>
          ))}
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{profile.bio}</p>

        <ul className="mt-4 space-y-1 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {profile.serviceLocation}
          </li>
          <li className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            {profile.experienceYears} years of experience
          </li>
        </ul>
      </Card>
    </Link>
  )
}