import type { ActionResult } from '../lib/commit'
import { isStoredImage } from '../lib/images'
import { STORAGE_KEYS, readList, writeJSON } from '../lib/storage'
import type { CustomerProfile } from '../types'
import type { PublicUser } from './authService'

export const ADDRESS_MAX_LENGTH = 150

// Everything in the profile form. The photo is a stored data URL, or undefined for none.
export interface CustomerProfileFormValues {
  phone: string
  address: string
  avatar?: string
}

export type CustomerFieldName = 'phone' | 'address'
export type CustomerFieldErrors = Partial<Record<CustomerFieldName, string>>

export function getCustomerProfile(userId: string): CustomerProfile | null {
  return readList<CustomerProfile>(STORAGE_KEYS.customerProfiles).find((item) => item.userId === userId) ?? null
}

export function customerProfileToFormValues(profile: CustomerProfile | null): CustomerProfileFormValues {
  return {
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    avatar: profile?.avatar,
  }
}

export function validateCustomerProfile(values: CustomerProfileFormValues): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {}

  // Phone and address are optional, but when given they must make sense.
  const phone = values.phone.trim()
  if (phone) {
    const digits = phone.replace(/[\s\-()]/g, '')
    if (!/^\+?\d{7,15}$/.test(digits)) {
      errors.phone = 'Enter a valid phone number, for example 0803 000 0001.'
    }
  }

  if (values.address.trim().length > ADDRESS_MAX_LENGTH) {
    errors.address = `Keep the address under ${ADDRESS_MAX_LENGTH} characters.`
  }

  return errors
}

export function saveCustomerProfile(user: PublicUser, values: CustomerProfileFormValues): ActionResult {
  if (user.role !== 'customer') return { ok: false, error: 'Only customers have a customer profile.' }

  if (Object.keys(validateCustomerProfile(values)).length > 0) {
    return { ok: false, error: 'Please fix the highlighted fields.' }
  }
  if (values.avatar !== undefined && !isStoredImage(values.avatar)) {
    return { ok: false, error: 'That photo is not valid. Please choose it again.' }
  }

  const profiles = readList<CustomerProfile>(STORAGE_KEYS.customerProfiles)
  const exists = profiles.some((item) => item.userId === user.id)

  const updated: CustomerProfile = {
    userId: user.id,
    phone: values.phone.trim(),
    address: values.address.trim(),
    // The photo key is left out entirely when there is no photo.
    ...(values.avatar ? { avatar: values.avatar } : {}),
  }

  const next = exists
    ? profiles.map((item) => (item.userId === user.id ? updated : item))
    : [...profiles, updated]

  return writeJSON(STORAGE_KEYS.customerProfiles, next)
}