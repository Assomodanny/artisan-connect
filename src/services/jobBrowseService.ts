import { STORAGE_KEYS, readList } from '../lib/storage'
import { SERVICE_CATEGORIES } from '../types'
import type { Application, ArtisanProfile, Job, JobStatus, ServiceCategory, User } from '../types'

// Jobs an artisan can still apply to.
export const AVAILABLE_STATUSES: JobStatus[] = ['open', 'applications_received']

export type JobStatusFilter = 'all' | 'open' | 'applications_received'
export type JobSort = 'newest' | 'budget_high' | 'budget_low' | 'date_soon'

export const SORT_OPTIONS: JobSort[] = ['newest', 'budget_high', 'budget_low', 'date_soon']

export const SORT_LABELS: Record<JobSort, string> = {
  newest: 'Newest first',
  budget_high: 'Highest budget',
  budget_low: 'Lowest budget',
  date_soon: 'Needed soonest',
}

const STATUS_FILTERS: JobStatusFilter[] = ['all', 'open', 'applications_received']

export interface JobFilters {
  query: string
  category: ServiceCategory | ''
  location: string
  minBudget: number | null
  status: JobStatusFilter
  mySkillsOnly: boolean
  sort: JobSort
}

// A job together with what an artisan needs to know about it.
export interface BrowsableJob {
  job: Job
  customerFirstName: string
  applicationCount: number
  myApplication: Application | null // this artisan's own application, if any
  matchesSkills: boolean
}

// ---------- Filters <-> address bar ----------

export function parseFilters(params: URLSearchParams): JobFilters {
  const category = params.get('category')
  const status = params.get('status')
  const sort = params.get('sort')
  const minRaw = params.get('minBudget')
  const min = minRaw === null || minRaw.trim() === '' ? Number.NaN : Number(minRaw)

  return {
    query: params.get('q') ?? '',
    category: SERVICE_CATEGORIES.find((name) => name === category) ?? '',
    location: params.get('location') ?? '',
    minBudget: Number.isFinite(min) && min > 0 ? Math.floor(min) : null,
    status: STATUS_FILTERS.find((value) => value === status) ?? 'all',
    mySkillsOnly: params.get('mySkills') === '1',
    sort: SORT_OPTIONS.find((value) => value === sort) ?? 'newest',
  }
}

// Only non-default values go into the address, so the URL stays short.
export function filtersToParams(filters: JobFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.category) params.set('category', filters.category)
  if (filters.location) params.set('location', filters.location)
  if (filters.minBudget !== null) params.set('minBudget', String(filters.minBudget))
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.mySkillsOnly) params.set('mySkills', '1')
  if (filters.sort !== 'newest') params.set('sort', filters.sort)
  return params
}

export function hasActiveFilters(filters: JobFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.category !== '' ||
    Boolean(filters.location.trim()) ||
    filters.minBudget !== null ||
    filters.status !== 'all' ||
    filters.mySkillsOnly
  )
}

// ---------- Reading jobs ----------
export function firstName(name: string): string {
 return name.trim().split(/\s+/)[0] || 'A customer'
}

function loadItems(artisanId: string): BrowsableJob[] {
  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const applications = readList<Application>(STORAGE_KEYS.applications)
  const users = readList<User>(STORAGE_KEYS.users)
  const profile = readList<ArtisanProfile>(STORAGE_KEYS.artisanProfiles).find(
    (item) => item.userId === artisanId,
  )
  const skills = profile?.skills ?? []

  return jobs.map((job) => {
    const forJob = applications.filter((item) => item.jobId === job.id)
    const mine =
      forJob
        .filter((item) => item.artisanId === artisanId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
    const customer = users.find((user) => user.id === job.customerId)

    return {
      job,
      customerFirstName: customer ? firstName(customer.name) : 'A customer',
      applicationCount: forJob.filter((item) => item.status !== 'withdrawn').length,
      myApplication: mine,
      matchesSkills: skills.includes(job.category),
    }
  })
}

// Jobs still open for applications.
export function getBrowsableJobs(artisanId: string): BrowsableJob[] {
  return loadItems(artisanId).filter((item) => AVAILABLE_STATUSES.includes(item.job.status))
}

// One job, but only if this artisan may see it: open for applications, or they applied,
// or they were chosen. Anything else looks exactly like a job that doesn't exist.
export function getJobForArtisan(artisanId: string, jobId: string): BrowsableJob | null {
  const item = loadItems(artisanId).find((entry) => entry.job.id === jobId)
  if (!item) return null

  const visible =
    AVAILABLE_STATUSES.includes(item.job.status) ||
    item.job.artisanId === artisanId ||
    item.myApplication !== null
  return visible ? item : null
}

export function filterJobs(items: BrowsableJob[], filters: JobFilters): BrowsableJob[] {
  const query = filters.query.trim().toLowerCase()
  const location = filters.location.trim().toLowerCase()

  const results = items.filter(({ job, matchesSkills }) => {
    if (query && !`${job.title} ${job.description} ${job.category}`.toLowerCase().includes(query)) {
      return false
    }
    if (filters.category && job.category !== filters.category) return false
    if (location && !job.location.toLowerCase().includes(location)) return false
    if (filters.minBudget !== null && job.budget < filters.minBudget) return false
    if (filters.status !== 'all' && job.status !== filters.status) return false
    if (filters.mySkillsOnly && !matchesSkills) return false
    return true
  })

  results.sort((a, b) => {
    switch (filters.sort) {
      case 'budget_high':
        return b.job.budget - a.job.budget
      case 'budget_low':
        return a.job.budget - b.job.budget
      case 'date_soon':
        return a.job.preferredDate.localeCompare(b.job.preferredDate)
      default:
        return b.job.createdAt.localeCompare(a.job.createdAt)
    }
  })

  return results
}