import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import Card from '../ui/Card'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-slate-600">{subtitle}</p>

        <p className="mt-5 flex gap-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Demonstration only. Accounts are stored in this browser and passwords are not
            protected. Do not use a real password.
          </span>
        </p>

        <div className="mt-6">{children}</div>
      </Card>
      <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
    </div>
  )
}