import type { ActionResult } from '../lib/commit'
import { isStoredImage } from '../lib/images'
import { STORAGE_KEYS, readList, writeJSON } from '../lib/storage'
import { SERVICE_CATEGORIES } from '../types'
import type { ArtisanProfile, ServiceCategory } from '../types'
import type { PublicUser } from './authService'

export const BIO_MIN_LENGTH = 20
export const BIO_MAX_LENGTH = 600
export const MAX_EXPERIENCE_YEARS = 60
export const MAX_PORTFOLIO_PHOTOS = 6

// Everything in the editor form. Experience is text because that is what an input gives us.
export interface ProfileFormValues {
  skills: ServiceCategory[]
  experienceYears: string
  serviceLocation: string
  bio: string
  avatar?: string // a stored photo, or undefined for none
  portfolio: string[] // stored photos
}

// The fields that have their own error messages.
export type ProfileFieldName = 'skills' | 'experienceYears' | 'serviceLocation' | 'bio'
export type ProfileFieldErrors = Partial<Record<ProfileFieldName, string>>

export function getArtisanProfile(userId: string): ArtisanProfile | null {
  return readList<ArtisanProfile>(STORAGE_KEYS.artisanProfiles).find((item) => item.userId === userId) ?? null
}

export function profileToFormValues(profile: ArtisanProfile | null): ProfileFormValues {
  return {
    skills: profile?.skills ?? [],
    experienceYears: String(profile?.experienceYears ?? 0),
    serviceLocation: profile?.serviceLocation ?? '',
    bio: profile?.bio ?? '',
    avatar: profile?.avatar,
    portfolio: profile?.portfolio ?? [],
  }
}

export function validateProfileInput(values: ProfileFormValues): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {}

  if (values.skills.length === 0) {
    errors.skills = 'Choose at least one skill.'
  } else if (values.skills.some((skill) => !SERVICE_CATEGORIES.includes(skill))) {
    errors.skills = 'Choose skills from the list.'
  }

  const years = values.experienceYears.trim()
  if (!years) {
    errors.experienceYears = 'Enter your years of experience (0 if less than a year).'
  } else {
    const number = Number(years)
    if (!Number.isInteger(number) || number < 0 || number > MAX_EXPERIENCE_YEARS) {
      errors.experienceYears = `Enter a whole number from 0 to ${MAX_EXPERIENCE_YEARS}.`
    }
  }

  const location = values.serviceLocation.trim()
  if (location.length < 3) errors.serviceLocation = 'Enter the area and city where you work.'
  else if (location.length > 100) errors.serviceLocation = 'Keep the location under 100 characters.'

  const bio = values.bio.trim()
  if (bio.length < BIO_MIN_LENGTH) {
    errors.bio = `Write at least ${BIO_MIN_LENGTH} characters about your work.`
  } else if (bio.length > BIO_MAX_LENGTH) {
    errors.bio = `Keep your bio under ${BIO_MAX_LENGTH} characters.`
  }

  return errors
}

export function saveArtisanProfile(user: PublicUser, values: ProfileFormValues): ActionResult {
  if (user.role !== 'artisan') return { ok: false, error: 'Only artisans have a professional profile.' }
  if (Object.keys(validateProfileInput(values)).length > 0) {
    return { ok: false, error: 'Please fix the highlighted fields.' }
  }

  if (values.avatar !== undefined && !isStoredImage(values.avatar)) {
    return { ok: false, error: 'Your profile photo is not valid. Please choose it again.' }
  }
  if (values.portfolio.length > MAX_PORTFOLIO_PHOTOS) {
    return { ok: false, error: `You can add up to ${MAX_PORTFOLIO_PHOTOS} portfolio photos.` }
  }
  if (values.portfolio.some((photo) => !isStoredImage(photo))) {
    return { ok: false, error: 'One of your portfolio photos is not valid. Please remove it and add it again.' }
  }

  // Read the stored profile NOW, so the rating (which reviews change) is never overwritten.
  const profiles = readList<ArtisanProfile>(STORAGE_KEYS.artisanProfiles)
  const existing = profiles.find((item) => item.userId === user.id)

  const base: ArtisanProfile = existing ?? {
    userId: user.id,
    skills: [],
    experienceYears: 0,
    bio: '',
    serviceLocation: '',
    portfolio: [],
    ratingAverage: 0,
    ratingCount: 0,
  }

  const updated: ArtisanProfile = {
    ...base,
    // Filtering the master list removes duplicates and keeps a tidy order.
    skills: SERVICE_CATEGORIES.filter((name) => values.skills.includes(name)),
    experienceYears: Number(values.experienceYears.trim()),
    serviceLocation: values.serviceLocation.trim(),
    bio: values.bio.trim(),
    portfolio: values.portfolio,
    avatar: values.avatar, // undefined is left out when saving, which removes the photo
  }

  const next = existing
    ? profiles.map((item) => (item.userId === user.id ? updated : item))
    : [...profiles, updated]

  return writeJSON(STORAGE_KEYS.artisanProfiles, next)
}

// ---------- "Is the profile ready to apply for jobs?" ----------

export interface ProfileCheck {
  key: string
  label: string
  done: boolean
}

export function getProfileChecks(profile: ArtisanProfile | null): ProfileCheck[] {
  return [
    {
      key: 'skills',
      label: 'Choose at least one skill',
      done: (profile?.skills.length ?? 0) > 0,
    },
    {
      key: 'location',
      label: 'Add your service location',
      done: (profile?.serviceLocation.trim().length ?? 0) >= 3,
    },
    {
      key: 'bio',
      label: `Write a short bio (at least ${BIO_MIN_LENGTH} characters)`,
      done: (profile?.bio.trim().length ?? 0) >= BIO_MIN_LENGTH,
    },
  ]
}

export function isArtisanProfileComplete(profile: ArtisanProfile | null): boolean {
  return getProfileChecks(profile).every((check) => check.done)
}