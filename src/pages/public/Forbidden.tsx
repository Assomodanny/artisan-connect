import { Link } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getHomePathForRole } from '../../lib/routes'
import { buttonClasses } from '../../components/ui/Button'

export default function Forbidden() {
  const { user } = useAuth()
  const homePath = user ? getHomePathForRole(user.role) : '/'

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <ShieldAlert className="h-12 w-12 text-brand-700" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">You can't open this page</h1>
      <p className="mt-2 text-slate-600">
        This page is for a different type of account.
        {user ? ` You are signed in as a ${user.role}.` : ''}
      </p>
      <Link to={homePath} className={buttonClasses('primary', 'md', 'mt-6')}>
        {user ? 'Go to my dashboard' : 'Back to home'}
      </Link>
    </div>
  )
}