import { Link } from 'react-router'
import { BadgeCheck, Briefcase, ClipboardList, Search, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { STATUS_LABELS } from '../../lib/statusMachine'
import type { JobStatus } from '../../types'
import { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import SimulatedBanner from '../../components/ui/SimulatedBanner'

interface Step {
  icon: LucideIcon
  title: string
  text: string
}

const CUSTOMER_STEPS: Step[] = [
  { icon: ClipboardList, title: 'Post your job', text: 'Describe the work, your location, budget and preferred date.' },
  { icon: Users, title: 'Compare quotations', text: 'Artisans apply with a price and a plan. Compare skills, ratings and cost, then accept one.' },
  { icon: Wallet, title: 'Record a simulated payment', text: 'The payment is marked as held in the demo holding system until the work is done.' },
  { icon: BadgeCheck, title: 'Confirm and review', text: 'Check the finished work, confirm it, and leave a rating for the artisan.' },
]

const ARTISAN_STEPS: Step[] = [
  { icon: Briefcase, title: 'Build your profile', text: 'Add your skills, experience, location and a short bio so customers can trust you.' },
  { icon: Search, title: 'Find jobs', text: 'Browse open jobs and filter them by category, location and budget.' },
  { icon: ClipboardList, title: 'Send a quotation', text: 'Offer a price, a time estimate and a clear plan for the work.' },
  { icon: Wallet, title: 'Do the work, get paid', text: 'Start once the payment is held, update your progress, and mark the job complete. The simulated payment is released when the customer confirms.' },
]

const STAGES: JobStatus[] = [
  'open',
  'applications_received',
  'artisan_selected',
  'awaiting_payment',
  'payment_held',
  'in_progress',
  'awaiting_confirmation',
  'completed',
]

const FAQ = [
  {
    question: 'Is real money used?',
    answer:
      'No. This is a demonstration project. Every payment is simulated: a status changes in your browser and no money moves. No card or bank details are ever collected.',
  },
  {
    question: 'Can one account be both a customer and an artisan?',
    answer:
      'No. Each account has one role. To try both sides, create two accounts with two different email addresses.',
  },
  {
    question: 'What if the work is not done as agreed?',
    answer:
      'Before you confirm, a customer can ask for a refund or report a problem. The artisan can accept the refund or contest it, and a Demo Reviewer decides contested cases. All of this is simulated too.',
  },
  {
    question: 'How are artisans rated?',
    answer:
      'Only after a customer confirms a finished job can they leave a rating and a review. An artisan’s average is worked out from all of their reviews.',
  },
  {
    question: 'Where is my information stored?',
    answer:
      'Only in this browser, on this computer. Passwords are not protected, so please do not use a real password.',
  },
]

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-6 grid gap-6 sm:grid-cols-2">
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <li key={step.title} className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-800">Step {index + 1}</p>
              <h3 className="font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.text}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold text-slate-900">How Artisan Connect works</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-600">
        Customers post jobs, artisans send quotations, and every job moves through clear steps from
        start to finish.
      </p>

      <section aria-labelledby="customers-heading" className="mt-12">
        <h2 id="customers-heading" className="text-2xl font-bold text-slate-900">For customers</h2>
        <StepList steps={CUSTOMER_STEPS} />
      </section>

      <section aria-labelledby="artisans-heading" className="mt-12">
        <h2 id="artisans-heading" className="text-2xl font-bold text-slate-900">For artisans</h2>
        <StepList steps={ARTISAN_STEPS} />
      </section>

      <section aria-labelledby="stages-heading" className="mt-12">
        <h2 id="stages-heading" className="text-2xl font-bold text-slate-900">The stages of a job</h2>
        <p className="mt-2 text-slate-600">
          Every job follows these stages in order. Nobody can skip one, for example a customer cannot
          confirm work the artisan has not marked as complete.
        </p>
        <ol className="mt-6 grid gap-2 sm:grid-cols-2">
          {STAGES.map((stage, index) => (
            <li
              key={stage}
              className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200/60"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                {index + 1}
              </span>
              <span className="text-slate-800">{STATUS_LABELS[stage]}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          A job can also be Cancelled before payment, or move to Refund Requested, Refunded or
          Disputed if something goes wrong.
        </p>
      </section>

      <section aria-labelledby="payments-heading" className="mt-12">
        <h2 id="payments-heading" className="text-2xl font-bold text-slate-900">About payments</h2>
        <div className="mt-4">
          <SimulatedBanner>
            Payments in this project are simulated. “Held” and “released” are labels in a
            demonstration. No money moves, and browser storage is not secure escrow.
          </SimulatedBanner>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mt-12">
        <h2 id="faq-heading" className="text-2xl font-bold text-slate-900">Questions</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.question}
              className="rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200/60"
            >
              <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-700">
                {item.question}
              </summary>
              <p className="mt-3 text-slate-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <Card className="mt-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">Ready to try it?</h2>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/register" className={buttonClasses('primary', 'lg')}>Post a job</Link>
          <Link to="/register?role=artisan" className={buttonClasses('secondary', 'lg')}>
            Join as an artisan
          </Link>
        </div>
      </Card>
    </div>
  )
}
