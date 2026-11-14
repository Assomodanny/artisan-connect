import { SERVICE_CATEGORIES } from '../types'
import type { ServiceCategory } from '../types'
import { getArtisanSummaries } from './artisanService'
import type { ArtisanSummary } from './artisanService'
import { isArtisanProfileComplete } from './profileService'

export type ArtisanSort = 'rating' | 'experience' | 'reviews'
export const ARTISAN_SORT_OPTIONS: ArtisanSort[] = ['rating', 'experience', 'reviews']

export const ARTISAN_SORT_LABELS: Record<ArtisanSort, string> = {
  rating: 'Highest rated',
  experience: 'Most experienced',
  reviews: 'Most reviews',
}

export type MinRating = 0 | 3 | 4
const MIN_RATINGS: MinRating[] = [0, 3, 4]

export interface ArtisanFilters {
  query: string
  category: ServiceCategory | ''
  location: string
  minRating: MinRating
  sort: ArtisanSort
}

// ---------- Filters <-> address bar ----------

export function parseArtisanFilters(params: URLSearchParams): ArtisanFilters {
  const category = params.get('category')
  const sort = params.get('sort')
  const rating = Number(params.get('minRating'))

  return {
    query: params.get('q') ?? '',
    category: SERVICE_CATEGORIES.find((name) => name === category) ?? '',
    location: params.get('location') ?? '',
    minRating: MIN_RATINGS.find((value) => value === rating) ?? 0,
    sort: ARTISAN_SORT_OPTIONS.find((value) => value === sort) ?? 'rating',
  }
}

// Only non-default values go into the address, so the URL stays short.
export function artisanFiltersToParams(filters: ArtisanFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.category) params.set('category', filters.category)
  if (filters.location) params.set('location', filters.location)
  if (filters.minRating > 0) params.set('minRating', String(filters.minRating))
  if (filters.sort !== 'rating') params.set('sort', filters.sort)
  return params
}

export function hasActiveArtisanFilters(filters: ArtisanFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.category !== '' ||
    Boolean(filters.location.trim()) ||
    filters.minRating > 0
  )
}

// ---------- Reading and filtering ----------

// Only artisans with a complete profile are listed, so no blank cards appear.
export function getListedArtisans(): ArtisanSummary[] {
  return getArtisanSummaries().filter((item) => isArtisanProfileComplete(item.profile))
}

export function filterArtisans(items: ArtisanSummary[], filters: ArtisanFilters): ArtisanSummary[] {
  // "leaking pipe" matches an artisan whose name, bio or skills contain either word.
  const words = filters.query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 2)
  const location = filters.location.trim().toLowerCase()

  const results = items.filter(({ user, profile }) => {
    if (words.length > 0) {
      const haystack = `${user.name} ${profile.bio} ${profile.skills.join(' ')}`.toLowerCase()
      if (!words.some((word) => haystack.includes(word))) return false
    }
    if (filters.category && !profile.skills.includes(filters.category)) return false
    if (location && !profile.serviceLocation.toLowerCase().includes(location)) return false
    if (
      filters.minRating > 0 &&
      (profile.ratingCount === 0 || profile.ratingAverage < filters.minRating)
    ) {
      return false
    }
    return true
  })

  results.sort((a, b) => {
    switch (filters.sort) {
      case 'experience':
        return (
          b.profile.experienceYears - a.profile.experienceYears ||
          b.profile.ratingAverage - a.profile.ratingAverage
        )
      case 'reviews':
        return (
          b.profile.ratingCount - a.profile.ratingCount ||
          b.profile.ratingAverage - a.profile.ratingAverage
        )
      default:
        return (
          b.profile.ratingAverage - a.profile.ratingAverage ||
          b.profile.ratingCount - a.profile.ratingCount ||
          b.profile.experienceYears - a.profile.experienceYears
        )
    }
  })

  return results
}