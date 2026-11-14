import type { Job, JobStatus, Role, StatusChange } from '../types'

// Human-friendly names for every status (used later by badges and timelines).
export const STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Open for Applications',
  applications_received: 'Applications Received',
  artisan_selected: 'Artisan Selected',
  awaiting_payment: 'Awaiting Payment',
  payment_held: 'Payment Held',
  in_progress: 'Job in Progress',
  awaiting_confirmation: 'Awaiting Customer Confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refund_requested: 'Refund Requested',
  refunded: 'Refunded',
  disputed: 'Disputed',
}

// Who is acting on a job, from the job's point of view.
export type TransitionActor = 'customer' | 'artisan' | 'reviewer' | 'system'

// The person (or 'system') trying to make a change.
export interface Actor {
  id: string
  role: Role
}

interface TransitionRule {
  from: JobStatus
  to: JobStatus
  by: TransitionActor[]
}

// The single source of truth: every allowed move. Anything not listed is rejected.
const RULES: TransitionRule[] = [
  { from: 'open', to: 'applications_received', by: ['system'] },
  { from: 'open', to: 'artisan_selected', by: ['customer'] },
  { from: 'applications_received', to: 'artisan_selected', by: ['customer'] },
  { from: 'open', to: 'cancelled', by: ['customer'] },
  { from: 'applications_received', to: 'cancelled', by: ['customer'] },
  { from: 'artisan_selected', to: 'cancelled', by: ['customer', 'artisan'] },
  { from: 'artisan_selected', to: 'awaiting_payment', by: ['customer'] },
  { from: 'awaiting_payment', to: 'payment_held', by: ['customer'] },
  { from: 'awaiting_payment', to: 'cancelled', by: ['customer', 'artisan'] },

  { from: 'payment_held', to: 'in_progress', by: ['artisan'] },
  { from: 'in_progress', to: 'awaiting_confirmation', by: ['artisan'] },
  { from: 'awaiting_confirmation', to: 'completed', by: ['customer'] },

  { from: 'payment_held', to: 'refund_requested', by: ['customer'] },
  { from: 'in_progress', to: 'refund_requested', by: ['customer'] },
  { from: 'awaiting_confirmation', to: 'refund_requested', by: ['customer'] },
  { from: 'awaiting_confirmation', to: 'disputed', by: ['customer'] },

  { from: 'refund_requested', to: 'refunded', by: ['artisan', 'reviewer'] },
  { from: 'refund_requested', to: 'disputed', by: ['artisan'] },

  { from: 'disputed', to: 'completed', by: ['reviewer'] },
  { from: 'disputed', to: 'refunded', by: ['reviewer'] },
]

// A refund request can be withdrawn, returning the job to one of these.
const WITHDRAWABLE_TO: JobStatus[] = [
  'payment_held',
  'in_progress',
  'awaiting_confirmation',
]

export type TransitionResult = { ok: true } | { ok: false; error: string }

export interface TransitionOptions {
  // Needed when withdrawing a refund request (comes from the RefundRequest).
  previousStatus?: JobStatus
  note?: string
  // Extra job fields to set in the same step (e.g. artisanId, agreedPrice).
  patch?: Partial<Job>
}

function fail(error: string): TransitionResult {
  return { ok: false, error }
}

// Works out which kind of actor this person is for THIS job.
// A customer must own the job; an artisan must be the one selected for it.
function actorKind(job: Job, actor: Actor | 'system'): TransitionActor | null {
  if (actor === 'system') return 'system'
  if (actor.role === 'reviewer') return 'reviewer'
  if (actor.role === 'customer' && actor.id === job.customerId) return 'customer'
  if (actor.role === 'artisan' && job.artisanId && actor.id === job.artisanId) {
    return 'artisan'
  }
  return null
}

export function canTransition(
  job: Job,
  next: JobStatus,
  actor: Actor | 'system',
  options: TransitionOptions = {},
): TransitionResult {
  const kind = actorKind(job, actor)
  if (!kind) return fail('You are not allowed to change this job.')

  if (job.status === next) {
    return fail(`This job is already "${STATUS_LABELS[next]}".`)
  }

  // Special case: withdrawing a refund request restores the earlier status.
  if (
    job.status === 'refund_requested' &&
    options.previousStatus === next &&
    WITHDRAWABLE_TO.includes(next)
  ) {
    return kind === 'customer'
      ? { ok: true }
      : fail('Only the customer can withdraw a refund request.')
  }

  const rule = RULES.find((r) => r.from === job.status && r.to === next)
  if (!rule) {
    return fail(
      `A job that is "${STATUS_LABELS[job.status]}" cannot move to "${STATUS_LABELS[next]}".`,
    )
  }

  if (!rule.by.includes(kind)) {
    return fail(
      `You are not allowed to move this job to "${STATUS_LABELS[next]}".`,
    )
  }

  return { ok: true }
}

// Every status this actor may move the job to right now.
// Pages use this to show only the buttons that are allowed.
export function getAvailableTransitions(
  job: Job,
  actor: Actor | 'system',
  options: TransitionOptions = {},
): JobStatus[] {
  const candidates = new Set<JobStatus>(
    RULES.filter((r) => r.from === job.status).map((r) => r.to),
  )
  if (job.status === 'refund_requested' && options.previousStatus) {
    candidates.add(options.previousStatus)
  }
  return [...candidates].filter((next) => canTransition(job, next, actor, options).ok)
}

// Checks the rules, then returns a NEW job with the status changed and
// the change recorded in statusHistory. It does not save anything.
export function applyTransition(
  job: Job,
  next: JobStatus,
  actor: Actor | 'system',
  options: TransitionOptions = {},
): { ok: true; job: Job } | { ok: false; error: string } {
  const check = canTransition(job, next, actor, options)
  if (!check.ok) return check

  const merged: Job = { ...job, ...options.patch }

  if (
    next === 'artisan_selected' &&
    (!merged.artisanId ||
      !merged.acceptedApplicationId ||
      merged.agreedPrice === undefined)
  ) {
    return {
      ok: false,
      error: 'Selecting an artisan needs the artisan, the application and the agreed price.',
    }
  }

  const at = new Date().toISOString()
  const change: StatusChange = {
    from: job.status,
    to: next,
    by: actor === 'system' ? 'system' : actor.id,
    at,
    note: options.note,
  }

  return {
    ok: true,
    job: {
      ...merged,
      status: next,
      updatedAt: at,
      statusHistory: [...job.statusHistory, change],
    },
  }
}