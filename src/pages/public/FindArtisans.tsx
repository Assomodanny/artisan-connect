import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ARTISAN_SORT_LABELS,
  ARTISAN_SORT_OPTIONS,
  artisanFiltersToParams,
  filterArtisans,
  getListedArtisans,
  hasActiveArtisanFilters,
  parseArtisanFilters,
} from '../../services/artisanSearchService'
import type { ArtisanFilters, ArtisanSort, MinRating } from '../../services/artisanSearchService'
import { SERVICE_CATEGORIES } from '../../types'
import type { ServiceCategory } from '../../types'
import ArtisanCard from '../../components/artisans/ArtisanCard'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import SelectField from '../../components/ui/SelectField'
import TextField from '../../components/ui/TextField'

export default function FindArtisans() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => parseArtisanFilters(searchParams), [searchParams])
  const items = useMemo(() => getListedArtisans(), [])
  const results = useMemo(() => filterArtisans(items, filters), [items, filters])

  // Filters live in the address bar. "replace" keeps the back button free of every keystroke.
  function update(change: Partial<ArtisanFilters>) {
    setSearchParams(artisanFiltersToParams({ ...filters, ...change }), { replace: true })
  }

  function clearFilters() {
    setSearchParams({}, { replace: true })
  }

  const filtersActive = hasActiveArtisanFilters(filters)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Find artisans</h1>
      <p className="mt-1 text-slate-600">
        Browse skilled artisans. To work with one, post a job and they can send you a quotation.
      </p>

      <Card className="mt-6">
        <form
          role="search"
          aria-label="Filter artisans"
          onSubmit={(event) => event.preventDefault()}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              id="artisans-q"
              label="Search"
              type="search"
              placeholder="e.g. pipe, wiring, Emeka"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
            />
            <SelectField
              id="artisans-category"
              label="Skill"
              value={filters.category}
              onChange={(event) => update({ category: event.target.value as ServiceCategory | '' })}
            >
              <option value="">All skills</option>
              {SERVICE_CATEGORIES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </SelectField>
            <TextField
              id="artisans-location"
              label="Location"
              placeholder="e.g. Ibadan"
              value={filters.location}
              onChange={(event) => update({ location: event.target.value })}
            />
            <SelectField
              id="artisans-rating"
              label="Minimum rating"
              value={String(filters.minRating)}
              onChange={(event) => update({ minRating: Number(event.target.value) as MinRating })}
            >
              <option value="0">Any rating</option>
              <option value="3">3 stars and up</option>
              <option value="4">4 stars and up</option>
            </SelectField>
            <SelectField
              id="artisans-sort"
              label="Sort by"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as ArtisanSort })}
            >
              {ARTISAN_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {ARTISAN_SORT_LABELS[option]}
                </option>
              ))}
            </SelectField>
          </div>

          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </form>
      </Card>

      <p role="status" className="mt-6 text-sm text-slate-600">
        {results.length} {results.length === 1 ? 'artisan' : 'artisans'} found
      </p>

      {results.length === 0 ? (
        <Card className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            {items.length === 0 ? 'No artisans are listed yet' : 'No artisans match your filters'}
          </h2>
          <p className="mt-1 text-slate-600">
            {items.length === 0
              ? 'Artisans appear here once they complete their profile.'
              : 'Try a different search, or clear the filters to see everyone.'}
          </p>
          {items.length > 0 && filtersActive && (
            <Button className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <ul className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((artisan) => (
            <li key={artisan.user.id}>
              <ArtisanCard artisan={artisan} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-center text-sm text-slate-600">
        Are you an artisan?{' '}
        <Link to="/register?role=artisan" className="font-semibold text-brand-800 underline">
          Join and create your profile
        </Link>
      </p>
    </div>
  )
}