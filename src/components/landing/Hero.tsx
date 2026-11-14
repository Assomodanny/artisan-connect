import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { BadgeCheck, Clock, Search, Star } from 'lucide-react'
import { SERVICE_CATEGORIES } from '../../types'
import type { ServiceCategory } from '../../types'
import { buttonClasses } from '../ui/Button'

const TRUST_POINTS = [
  'Compare quotations side by side',
  'Follow every step of the job',
  'Simulated payment held until you confirm',
]

export default function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ServiceCategory | ''>('')

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category) params.set('category', category)
    const queryString = params.toString()
    navigate(queryString ? `/artisans?${queryString}` : '/artisans')
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
      {/* Decorative glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-400/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-brand-100 ring-1 ring-white/20">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent-300" />
            Skilled artisans, one platform
          </p>

          <h1 className="mt-5 text-4xl font-bold sm:text-5xl lg:text-6xl">
            Hire skilled artisans <span className="text-accent-300">for any job</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-brand-100">
            Post what you need, compare quotations from artisans, and follow the job from start to
            finish.
          </p>

          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Search artisans or services"
            className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-lift sm:flex-row"
          >
            <div className="flex-1">
              <label htmlFor="hero-query" className="sr-only">What do you need done?</label>
              <input
                id="hero-query"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What do you need done? e.g. leaking pipe"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-brand-700"
              />
            </div>
            <div className="sm:w-44">
              <label htmlFor="hero-category" className="sr-only">Service category</label>
              <select
                id="hero-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as ServiceCategory | '')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-700"
              >
                <option value="">All services</option>
                {SERVICE_CATEGORIES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className={buttonClasses('primary', 'md', 'sm:px-6')}>
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-900 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Post a job
            </Link>
            <Link
              to="/register?role=artisan"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Join as an artisan
            </Link>
          </div>

          <ul className="mt-8 space-y-2 text-sm text-brand-100">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-brand-200">
            Demonstration project: payments are simulated and no real money moves.
          </p>
        </motion.div>

        {/* Decorative sample cards: an illustration, not real data */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative hidden lg:block"
        >
          <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-lift">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Sample quotation
              </p>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                Accepted
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                SA
              </span>
              <div>
                <p className="font-semibold">Sample Artisan</p>
                <p className="flex items-center gap-1 text-sm text-slate-600">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  4.9 · Plumbing
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-3xl font-bold">₦95,000</p>
              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="h-4 w-4" />5 days
              </p>
            </div>
          </div>

          <div className="relative -mt-4 ml-14 rounded-2xl bg-white/95 p-5 text-slate-900 shadow-lift">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Fix leaking kitchen sink</p>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                Payment held (simulated)
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-2/3 rounded-full bg-accent-600" />
            </div>
            <p className="mt-2 text-sm text-slate-600">Work progress 65%</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}