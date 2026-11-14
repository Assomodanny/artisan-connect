import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { STATUS_LABELS } from '../../lib/statusMachine'
import { getArtisanSummaryById } from '../../services/artisanService'
import {
  SORT_LABELS,
  SORT_OPTIONS,
  filterJobs,
  filtersToParams,
  getBrowsableJobs,
  hasActiveFilters,
  parseFilters,
} from '../../services/jobBrowseService'
import type { JobFilters, JobSort, JobStatusFilter } from '../../services/jobBrowseService'
import { SERVICE_CATEGORIES } from '../../types'
import type { ServiceCategory } from '../../types'
import ArtisanJobCard from '../../components/jobs/ArtisanJobCard'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import SelectField from '../../components/ui/SelectField'
import TextField from '../../components/ui/TextField'

export default function AvailableJobs() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const items = useMemo(() => (user ? getBrowsableJobs(user.id) : []), [user])
  const skills = useMemo(
    () => (user ? (getArtisanSummaryById(user.id)?.profile.skills ?? []) : []),
    [user],
  )
  const results = useMemo(() => filterJobs(items, filters), [items, filters])

  // Filters live in the address bar. "replace" avoids filling the back button with every keystroke.
  function update(change: Partial<JobFilters>) {
    setSearchParams(filtersToParams({ ...filters, ...change }), { replace: true })
  }

  function clearFilters() {
    setSearchParams({}, { replace: true })
  }

  const filtersActive = hasActiveFilters(filters)
  const noSkills = skills.length === 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Available jobs</h1>
      <p className="mt-1 text-slate-600">Jobs that are still open for applications.</p>

      <Card className="mt-6">
        <form
          role="search"
          aria-label="Filter jobs"
          onSubmit={(event) => event.preventDefault()}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              id="jobs-q"
              label="Search"
              type="search"
              placeholder="e.g. pipe, wiring"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
            />
            <SelectField
              id="jobs-category"
              label="Category"
              value={filters.category}
              onChange={(event) => update({ category: event.target.value as ServiceCategory | '' })}
            >
              <option value="">All categories</option>
              {SERVICE_CATEGORIES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </SelectField>
            <TextField
              id="jobs-location"
              label="Location"
              placeholder="e.g. Bodija"
              value={filters.location}
              onChange={(event) => update({ location: event.target.value })}
            />
            <TextField
              id="jobs-minBudget"
              label="Minimum budget (₦)"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={filters.minBudget ?? ''}
              onChange={(event) => {
                const raw = event.target.value
                update({ minBudget: raw === '' ? null : Math.max(0, Math.floor(Number(raw))) || null })
              }}
            />
            <SelectField
              id="jobs-status"
              label="Status"
              value={filters.status}
              onChange={(event) => update({ status: event.target.value as JobStatusFilter })}
            >
              <option value="all">All open jobs</option>
              <option value="open">{STATUS_LABELS.open}</option>
              <option value="applications_received">{STATUS_LABELS.applications_received}</option>
            </SelectField>
            <SelectField
              id="jobs-sort"
              label="Sort by"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as JobSort })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <label className="flex items-start gap-3 text-sm text-slate-800">
              <input
                id="jobs-mySkills"
                type="checkbox"
                checked={filters.mySkillsOnly}
                disabled={noSkills}
                aria-describedby={noSkills ? 'jobs-mySkills-hint' : undefined}
                onChange={(event) => update({ mySkillsOnly: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-brand-700"
              />
              <span>
                Only show jobs that match my skills{noSkills ? '' : ` (${skills.join(', ')})`}
              </span>
            </label>
            {noSkills && (
                           <p id="jobs-mySkills-hint" className="mt-1 text-sm text-slate-600">
                Your profile has no skills yet.{' '}
                <Link to="/artisan/profile" className="font-semibold text-brand-800 underline">
                  Add your skills
                </Link>{' '}
                to use this filter.
              </p>
            )}
          </div>

          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </form>
      </Card>

      <p role="status" className="mt-6 text-sm text-slate-600">
        {results.length} {results.length === 1 ? 'job' : 'jobs'} found
      </p>

      {results.length === 0 ? (
        <Card className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            {items.length === 0 ? 'No jobs are open right now' : 'No jobs match your filters'}
          </h2>
          <p className="mt-1 text-slate-600">
            {items.length === 0
              ? 'New jobs from customers appear here as soon as they are posted.'
              : 'Try a different search, or clear the filters to see every open job.'}
          </p>
          {items.length > 0 && filtersActive && (
            <Button className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {results.map((item) => (
            <li key={item.job.id}>
              <ArtisanJobCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}