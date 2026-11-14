import type { ReactNode } from 'react'
import { Construction } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

interface DashboardPlaceholderProps {
  roleLabel: string
  upcoming: string[]
  children?: ReactNode // working links to the pages that exist so far
}

// Temporary dashboard body, replaced by the real dashboards later.
export default function DashboardPlaceholder({
  roleLabel,
  upcoming,
  children,
}: DashboardPlaceholderProps) {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name}</h1>
        <Badge tone="brand">{roleLabel}</Badge>
      </div>

      {children}

      <Card className="mt-8">
        <div className="flex items-center gap-2 text-brand-800">
          <Construction className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-semibold">Still on the way</h2>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
          {upcoming.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}