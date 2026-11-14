import { STORAGE_KEYS, readList } from '../lib/storage'
import type { ArtisanProfile, User } from '../types'

// An artisan's account (name, email) joined with their profile (skills, rating).
export interface ArtisanSummary {
  user: User
  profile: ArtisanProfile
}

export function getArtisanSummaries(): ArtisanSummary[] {
  const users = readList<User>(STORAGE_KEYS.users)
  const profiles = readList<ArtisanProfile>(STORAGE_KEYS.artisanProfiles)

  const summaries: ArtisanSummary[] = []
  for (const profile of profiles) {
    const user = users.find((u) => u.id === profile.userId && u.role === 'artisan')
    // A profile with no matching account is skipped instead of crashing the page.
    if (user) summaries.push({ user, profile })
  }
  return summaries
}

// Best rated first; ties are broken by number of reviews, then years of experience.
export function getFeaturedArtisans(limit = 3): ArtisanSummary[] {
  return getArtisanSummaries()
    .sort(
      (a, b) =>
        b.profile.ratingAverage - a.profile.ratingAverage ||
        b.profile.ratingCount - a.profile.ratingCount ||
        b.profile.experienceYears - a.profile.experienceYears,
    )
    .slice(0, limit)
}

export function getArtisanSummaryById(userId: string): ArtisanSummary | null {
  return getArtisanSummaries().find((item) => item.user.id === userId) ?? null
}