export const PASSWORD_MIN_LENGTH = 8

// Each validator returns an error message, or null when the value is fine.
export function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 2) return 'Enter your full name.'
  if (trimmed.length > 80) return 'Name is too long.'
  return null
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Enter your email address.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.'
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  return null
}