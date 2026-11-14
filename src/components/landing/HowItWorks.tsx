import { BadgeCheck, ClipboardList, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  icon: LucideIcon
  title: string
  text: string
}

const STEPS: Step[] = [
  { icon: ClipboardList, title: 'Post your job', text: 'Describe the work, your location, budget and preferred date.' },
  { icon: Users, title: 'Compare quotations', text: 'Artisans apply with a price and a plan. Compare skills, ratings and cost.' },
  { icon: Wallet, title: 'Record a simulated payment', text: 'Accept a quotation and record a payment into the demo holding system.' },
  { icon: BadgeCheck, title: 'Confirm and review', text: 'When the work is done, confirm it, release the simulated payment and leave a review.' },
]

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="how-heading" className="text-center text-3xl font-bold text-slate-900">How it works</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-semibold text-brand-800">Step {index + 1}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.text}</p>
              </li>
            )
          })}
        </ol>
        <p className="mt-8 text-center text-sm text-slate-600">
          All payment steps in this project are simulated for demonstration. No real money moves.
        </p>
      </div>
    </section>
  )
}