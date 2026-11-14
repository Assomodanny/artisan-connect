import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

export default function SimulatedBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}