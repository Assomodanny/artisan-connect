import type { Role } from '../types'

export interface NavItem {
  to: string
  label: string
  end?: boolean // true = highlight only on this exact address
}

const PUBLIC_LINKS: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/artisans', label: 'Find artisans' },
  { to: '/how-it-works', label: 'How it works' },
]

const ROLE_LINKS: Record<Role, NavItem[]> = {
  customer: [
    { to: '/customer/jobs', label: 'My jobs', end: true },
    { to: '/customer/jobs/new', label: 'Post a job', end: true },
    { to: '/customer/profile', label: 'Profile' },
  ],
  artisan: [
    { to: '/artisan/jobs', label: 'Browse jobs' },
    { to: '/artisan/applications', label: 'Applications' },
    { to: '/artisan/active', label: 'Active jobs' },
    { to: '/artisan/profile', label: 'Profile' },
  ],
  reviewer: [{ to: '/reviewer/dashboard', label: 'Case review' }],
}

// Signed out: the public links. Signed in: Home plus the links for that role.
export function getNavLinks(role: Role | null): NavItem[] {
  if (role === null) return PUBLIC_LINKS
  return [{ to: '/', label: 'Home', end: true }, ...ROLE_LINKS[role]]
}