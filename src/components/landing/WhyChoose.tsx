import { ListChecks, Scale, ShieldCheck, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Reason {
  icon: LucideIcon
  title: string
  text: string
}

const REASONS: Reason[] = [
  { icon: Scale, title: 'Compare before you choose', text: 'See each artisan\'s price, timeline, skills and rating side by side.' },
  { icon: ListChecks, title: 'Follow every step', text: 'Clear job statuses show exactly where your job stands, from posting to completion.' },
  { icon: ShieldCheck, title: 'Payment held until you confirm', text: 'In this demo, a simulated payment is held and only released when you confirm the work.' },
  { icon: Star, title: 'Ratings you can check', text: 'Customers rate artisans after each completed job, so reputations build over time.' },
]

export default function WhyChoose() {
  return (
    <section aria-labelledby="why-heading" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="why-heading" className="text-center text-3xl font-bold text-slate-900">
          Why choose Artisan Connect
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {REASONS.map((reason) => {
            const Icon = reason.icon
            return (
              <li key={reason.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{reason.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{reason.text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}