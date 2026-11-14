import { Link } from 'react-router'
import { CheckCircle2, Circle } from 'lucide-react'
import type { ProfileCheck } from '../../services/profileService'
import { buttonClasses } from '../ui/Button'
import Card from '../ui/Card'

interface ProfileCompletionCardProps {
  checks: ProfileCheck[]
  editLink?: boolean // show a "Complete my profile" button when something is missing
}

export default function ProfileCompletionCard({ checks, editLink = false }: ProfileCompletionCardProps) {
  const complete = checks.every((check) => check.done)

  return (
    <Card className={complete ? 'border border-green-200 bg-green-50' : 'border border-amber-200 bg-amber-50'}>
      <h2 className={complete ? 'font-semibold text-green-900' : 'font-semibold text-amber-900'}>
        {complete ? 'Your profile is complete' : 'Finish your profile to apply for jobs'}
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        {complete
          ? 'Customers see your skills, experience and rating next to every quotation you send.'
          : 'Customers choose artisans by their profile, so these are needed before you can send a quotation.'}
      </p>

      <ul className="mt-3 space-y-1.5 text-sm">
        {checks.map((check) => (
          <li key={check.key} className="flex items-center gap-2 text-slate-800">
            {check.done ? (
              <CheckCircle2 className="h-4 w-4 text-green-700" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4 text-amber-700" aria-hidden="true" />
            )}
            <span className="sr-only">{check.done ? 'Done: ' : 'To do: '}</span>
            {check.label}
          </li>
        ))}
      </ul>

      {editLink && !complete && (
        <Link to="/artisan/profile" className={buttonClasses('primary', 'md', 'mt-4')}>
          Complete my profile
        </Link>
      )}
    </Card>
  )
}