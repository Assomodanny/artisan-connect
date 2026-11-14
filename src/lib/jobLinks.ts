import type { Role } from '../types'

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