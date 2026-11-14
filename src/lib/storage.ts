// All localStorage keys live here, so a typo can never create a new key by accident.
export const STORAGE_KEYS = {
  users: 'ac_users',
  customerProfiles: 'ac_customer_profiles',
  artisanProfiles: 'ac_artisan_profiles',
  jobs: 'ac_jobs',
  applications: 'ac_applications',
  payments: 'ac_payments',
  refundRequests: 'ac_refund_requests',
  reviews: 'ac_reviews',
  notifications: 'ac_notifications',
  session: 'ac_session',
  seeded: 'ac_seeded_v1',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export type WriteResult = { ok: true } | { ok: false; error: string }

/**
 * Read one value. Returns `fallback` if the key is missing, the JSON is
 * malformed, or localStorage itself is unavailable.
 * Pass `isValid` to also reject data that parses but has the wrong shape.
 */
export function readJSON<T>(
  key: StorageKey,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (isValid && !isValid(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

/** Read a list. Anything that is not an array becomes an empty list. */
export function readList<T>(key: StorageKey): T[] {
  const value = readJSON<unknown>(key, [])
  if (!Array.isArray(value)) return []
  // Skip anything that is not an object (null, numbers, text), so damaged data can't crash a page.
  return value.filter((item) => typeof item === 'object' && item !== null) as T[]
}

/** Write one value. Never throws; tells the caller whether it worked. */
export function writeJSON(key: StorageKey, value: unknown): WriteResult {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (error) {
    const isQuotaError =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    return {
      ok: false,
      error: isQuotaError
        ? 'Browser storage is full. Try removing some images and save again.'
        : 'Could not save your data in this browser.',
    }
  }
}

export function removeItem(key: StorageKey): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing useful to do if storage is unavailable.
  }
}

/** Wipe every Artisan Connect key (used later by a "Reset demo data" button). */
export function clearAppData(): void {
  Object.values(STORAGE_KEYS).forEach(removeItem)
}