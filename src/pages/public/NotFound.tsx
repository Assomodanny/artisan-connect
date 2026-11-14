import { Link, useLocation } from 'react-router'
import { Search } from 'lucide-react'
import { buttonClasses } from '../../components/ui/Button'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <Search className="h-12 w-12 text-brand-700" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">
        <code className="break-all rounded bg-slate-100 px-1.5 py-0.5">{pathname}</code> doesn't exist.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses('primary', 'md')}>
          Back to home
        </Link>
        <Link to="/artisans" className={buttonClasses('secondary', 'md')}>
          Find artisans
        </Link>
      </div>
    </div>
  )
}