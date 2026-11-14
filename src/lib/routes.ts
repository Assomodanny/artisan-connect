import type { Role } from '../types'

// Where each kind of user lands after signing in.
export function getHomePathForRole(role: Role): string {
  switch (role) {
    case 'customer':
      return '/customer/dashboard'
    case 'artisan':
      return '/artisan/dashboard'
    case 'reviewer':
      return '/reviewer/dashboard'
  }
}

// Only allows redirects to pages inside this app ("/something", never "//evil.com").
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }
  return fallback
}

// Each role has its own area of the site.
const ROLE_AREAS: Array<[prefix: string, role: Role]> = [
  ['/customer', 'customer'],
  ['/artisan', 'artisan'],
  ['/reviewer', 'reviewer'],
]

// Can this role open this path? Public pages are open to everyone.
// Note the prefix + '/' check: "/artisans" (the public browse page) is NOT inside "/artisan".
export function canRoleAccessPath(role: Role, path: string): boolean {
  for (const [prefix, requiredRole] of ROLE_AREAS) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return role === requiredRole
  }
  return true
}

// The page a notification about a job should open, for each role.
export function getJobPathForRole(role: Role, jobId: string): string {
  switch (role) {
    case 'customer':
      return `/customer/jobs/${jobId}`
    case 'artisan':
      return `/artisan/jobs/${jobId}`
    case 'reviewer':
      return '/reviewer/dashboard'
  }
}