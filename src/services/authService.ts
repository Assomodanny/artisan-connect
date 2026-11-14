import { REVIEWER_CODE } from '../lib/config'
import { STORAGE_KEYS, readJSON, readList, removeItem, writeJSON } from '../lib/storage'
import type { WriteResult } from '../lib/storage'
import { createId } from '../lib/ids'
import { validateEmail, validateName, validatePassword } from '../lib/validators'
import type { ArtisanProfile, CustomerProfile, Role, User } from '../types'

// What the rest of the app sees: a user WITHOUT the password.
export type PublicUser = Omit<User, 'password'>

// The two roles anyone can choose when signing up.
export type SignupRole = Extract<Role, 'customer' | 'artisan'>

export interface RegisterInput {
  name: string
  email: string
  password: string
  role: SignupRole | 'reviewer'
  reviewerCode?: string // only needed (and checked) when the role is 'reviewer'
}

export type AuthResult = { ok: true; user: PublicUser } | { ok: false; error: string }

const ID_PREFIX: Record<SignupRole | 'reviewer', string> = {
  customer: 'cust',
  artisan: 'art',
  reviewer: 'rev',
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }
}

function addCustomerProfile(userId: string): WriteResult {
  const profiles = readList<CustomerProfile>(STORAGE_KEYS.customerProfiles)
  const profile: CustomerProfile = { userId, phone: '', address: '' }
  return writeJSON(STORAGE_KEYS.customerProfiles, [...profiles, profile])
}

function addArtisanProfile(userId: string): WriteResult {
  const profiles = readList<ArtisanProfile>(STORAGE_KEYS.artisanProfiles)
  const profile: ArtisanProfile = {
    userId,
    skills: [],
    experienceYears: 0,
    bio: '',
    serviceLocation: '',
    portfolio: [],
    ratingAverage: 0,
    ratingCount: 0,
  }
  return writeJSON(STORAGE_KEYS.artisanProfiles, [...profiles, profile])
}

export function registerUser(input: RegisterInput): AuthResult {
  const problem =
    validateName(input.name) ?? validateEmail(input.email) ?? validatePassword(input.password)
  if (problem) return { ok: false, error: problem }

  if (input.role !== 'customer' && input.role !== 'artisan' && input.role !== 'reviewer') {
    return { ok: false, error: 'Choose whether you are a customer or an artisan.' }
  }

  // The reviewer account can only be created with the private code from config.ts.
  if (input.role === 'reviewer' && (input.reviewerCode ?? '').trim() !== REVIEWER_CODE) {
    return { ok: false, error: 'That reviewer code is not correct.' }
  }

  const email = normalizeEmail(input.email)
  const users = readList<User>(STORAGE_KEYS.users)

  // This check also stops a double-click from creating two accounts.
  if (users.some((existing) => normalizeEmail(existing.email) === email)) {
    return { ok: false, error: 'An account with this email already exists.' }
  }

  const user: User = {
    id: createId(ID_PREFIX[input.role]),
    role: input.role,
    name: input.name.trim(),
    email,
    password: input.password, // DEMO ONLY: plain text. Never do this in a real app.
    createdAt: new Date().toISOString(),
  }

  const savedUsers = writeJSON(STORAGE_KEYS.users, [...users, user])
  if (!savedUsers.ok) return { ok: false, error: savedUsers.error }

  // A reviewer has no profile of their own.
  const noProfile: WriteResult = { ok: true }
  const savedProfile =
    input.role === 'customer'
      ? addCustomerProfile(user.id)
      : input.role === 'artisan'
        ? addArtisanProfile(user.id)
        : noProfile

  if (!savedProfile.ok) {
    writeJSON(STORAGE_KEYS.users, users) // undo, so we never leave an account with no profile
    return { ok: false, error: savedProfile.error }
  }

  const savedSession = writeJSON(STORAGE_KEYS.session, user.id)
  if (!savedSession.ok) {
    return {
      ok: false,
      error: 'Your account was created, but we could not keep you signed in. Please log in.',
    }
  }

  return { ok: true, user: toPublicUser(user) }
}

export function loginUser(email: string, password: string): AuthResult {
  const normalized = normalizeEmail(email)
  if (!normalized || !password) return { ok: false, error: 'Enter your email and password.' }

  const user = readList<User>(STORAGE_KEYS.users).find(
    (existing) => normalizeEmail(existing.email) === normalized,
  )

  // One message for "no such email" and "wrong password", so neither is revealed.
  if (!user || user.password !== password) {
    return { ok: false, error: 'Incorrect email or password.' }
  }

  const saved = writeJSON(STORAGE_KEYS.session, user.id)
  if (!saved.ok) return { ok: false, error: saved.error }

  return { ok: true, user: toPublicUser(user) }
}

export function logoutUser(): void {
  removeItem(STORAGE_KEYS.session)
}

// Looks up who is signed in. The session stores only a user id.
export function getSessionUser(): PublicUser | null {
  const userId = readJSON<string | null>(STORAGE_KEYS.session, null)
  if (typeof userId !== 'string') return null

  const user = readList<User>(STORAGE_KEYS.users).find((existing) => existing.id === userId)
  if (!user) {
    removeItem(STORAGE_KEYS.session) // the account no longer exists, so end the session
    return null
  }
  return toPublicUser(user)
}