import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { formatNaira } from '../lib/formatters'
import { createId } from '../lib/ids'
import { applyTransition } from '../lib/statusMachine'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type {
  Application,
  Job,
  JobStatus,
  Notification,
  PaymentRecord,
  RefundRequest,
  User,
} from '../types'
import type { PublicUser } from './authService'
import { buildNotification } from './notificationService'

function fail(error: string): ActionResult {
  return { ok: false, error }
}

// A request is "open" while it still needs a decision.
function isActive(request: RefundRequest): boolean {
  return request.status === 'pending' || request.status === 'disputed'
}

export const REASON_MIN_LENGTH = 10
export const REASON_MAX_LENGTH = 500

export function validateReason(reason: string): string | null {
  const trimmed = reason.trim()
  if (trimmed.length < REASON_MIN_LENGTH) {
    return `Explain what went wrong in at least ${REASON_MIN_LENGTH} characters.`
  }
  if (trimmed.length > REASON_MAX_LENGTH) {
    return `Keep the reason under ${REASON_MAX_LENGTH} characters.`
  }
  return null
}

// The newest refund request or dispute for a job, if any.
export function getRefundRequestForJob(jobId: string): RefundRequest | null {
  const matches = readList<RefundRequest>(STORAGE_KEYS.refundRequests)
    .filter((item) => item.jobId === jobId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return matches[0] ?? null
}

// ---------- Customer actions ----------

// Cancel before payment is recorded. The status engine decides whether the move is allowed.
export function cancelJob(customer: PublicUser, jobId: string): ActionResult {
  if (customer.role !== 'customer') return fail('Only the customer who posted the job can cancel it.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const applications = readList<Application>(STORAGE_KEYS.applications)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.customerId !== customer.id) return fail('This job no longer exists.')

  const transition = applyTransition(job, 'cancelled', customer, { note: 'Cancelled by the customer' })
  if (!transition.ok) return fail(transition.error)

  // Everyone who should hear about it: artisans with pending quotations, plus the chosen artisan.
  const recipients = new Set<string>()
  for (const application of applications) {
    if (application.jobId === job.id && application.status === 'pending') {
      recipients.add(application.artisanId)
    }
  }
  if (job.artisanId) recipients.add(job.artisanId)

  const nextApplications = applications.map((item) =>
    item.jobId === job.id && item.status === 'pending'
      ? { ...item, status: 'rejected' as const }
      : item,
  )

  // A payment that was never recorded has no reason to stay around.
  const nextPayments = payments.filter((item) => !(item.jobId === job.id && item.status === 'pending'))

  const newNotifications = [...recipients].map((artisanId) =>
    buildNotification(artisanId, `The customer cancelled “${job.title}”.`, job.id),
  )

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    { key: STORAGE_KEYS.applications, value: nextApplications, old: applications },
    { key: STORAGE_KEYS.payments, value: nextPayments, old: payments },
    { key: STORAGE_KEYS.notifications, value: [...notifications, ...newNotifications], old: notifications },
  ])
}

// Shared by "request a refund" and "report a problem": both open a case on a job with a held payment.
function openCase(
  customer: PublicUser,
  jobId: string,
  reason: string,
  kind: 'refund' | 'problem',
): ActionResult {
  if (customer.role !== 'customer') return fail('Only the customer who posted the job can do this.')
  if (validateReason(reason)) return fail('Please fix the highlighted field.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const requests = readList<RefundRequest>(STORAGE_KEYS.refundRequests)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const job = jobs.find((item) => item.id === jobId)
  if (!job || job.customerId !== customer.id) return fail('This job no longer exists.')

  // Stops double-clicks and a second open tab from creating two cases.
  if (requests.some((item) => item.jobId === job.id && isActive(item))) {
    return fail('There is already an open request for this job.')
  }

  const payment = payments.find((item) => item.jobId === job.id)
  if (!payment || payment.status !== 'held') {
    return fail('Only a job with a held payment can be refunded or disputed.')
  }

  const next: JobStatus = kind === 'refund' ? 'refund_requested' : 'disputed'
  const transition = applyTransition(job, next, customer, {
    note: kind === 'refund' ? 'Refund requested' : 'Customer reported a problem with the work',
  })
  if (!transition.ok) return fail(transition.error)

  const request: RefundRequest = {
    id: createId('refund'),
    jobId: job.id,
    requestedBy: customer.id,
    reason: reason.trim(),
    previousStatus: job.status, // used to put the job back if the request is withdrawn
    status: kind === 'refund' ? 'pending' : 'disputed',
    createdAt: transition.job.updatedAt,
  }

  const nextNotifications = job.artisanId
    ? [
        ...notifications,
        buildNotification(
          job.artisanId,
          kind === 'refund'
            ? `The customer requested a refund for “${job.title}”.`
            : `The customer reported a problem with “${job.title}”. It was sent to the Demo Reviewer.`,
          job.id,
        ),
      ]
    : notifications

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    { key: STORAGE_KEYS.refundRequests, value: [...requests, request], old: requests },
    { key: STORAGE_KEYS.notifications, value: nextNotifications, old: notifications },
  ])
}

export function requestRefund(customer: PublicUser, jobId: string, reason: string): ActionResult {
  return openCase(customer, jobId, reason, 'refund')
}

export function reportProblem(customer: PublicUser, jobId: string, reason: string): ActionResult {
  return openCase(customer, jobId, reason, 'problem')
}

// Only a request that is still awaiting review can be withdrawn. The job goes back to where it was.
export function withdrawRefundRequest(customer: PublicUser, requestId: string): ActionResult {
  if (customer.role !== 'customer') return fail('Only the customer can withdraw a request.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const requests = readList<RefundRequest>(STORAGE_KEYS.refundRequests)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const request = requests.find((item) => item.id === requestId)
  const job = request ? jobs.find((item) => item.id === request.jobId) : undefined
  if (!request || !job || job.customerId !== customer.id || request.requestedBy !== customer.id) {
    return fail('This request no longer exists.')
  }

  if (request.status !== 'pending') {
    return fail('Only a request that is still awaiting review can be withdrawn.')
  }

  const transition = applyTransition(job, request.previousStatus, customer, {
    previousStatus: request.previousStatus,
    note: 'Refund request withdrawn',
  })
  if (!transition.ok) return fail(transition.error)

  const nextRequests = requests.map((item) =>
    item.id === request.id ? { ...item, status: 'withdrawn' as const } : item,
  )

  const nextNotifications = job.artisanId
    ? [
        ...notifications,
        buildNotification(
          job.artisanId,
          `The customer withdrew the refund request for “${job.title}”.`,
          job.id,
        ),
      ]
    : notifications

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    { key: STORAGE_KEYS.refundRequests, value: nextRequests, old: requests },
    { key: STORAGE_KEYS.notifications, value: nextNotifications, old: notifications },
  ])
}

// ---------- Demo Reviewer ----------

export interface RefundCase {
  request: RefundRequest
  job: Job | null // null if the job no longer exists
  customerName: string
  artisanName: string
  amount: number
}

export function getRefundCases(): { open: RefundCase[]; resolved: RefundCase[] } {
  const requests = readList<RefundRequest>(STORAGE_KEYS.refundRequests)
  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const users = readList<User>(STORAGE_KEYS.users)

  const nameOf = (id: string | undefined) => users.find((user) => user.id === id)?.name ?? 'Unknown user'

  const cases = [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((request): RefundCase => {
      const job = jobs.find((item) => item.id === request.jobId) ?? null
      const payment = payments.find((item) => item.jobId === request.jobId)
      return {
        request,
        job,
        customerName: nameOf(request.requestedBy),
        artisanName: nameOf(job?.artisanId),
        amount: payment?.amount ?? job?.agreedPrice ?? 0,
      }
    })

  return {
    open: cases.filter((item) => isActive(item.request)),
    resolved: cases.filter((item) => !isActive(item.request)),
  }
}

export type CaseDecision = 'refund' | 'release'

// The Demo Reviewer settles a case. SIMULATED: no money moves anywhere.
export function resolveCase(
  reviewer: PublicUser,
  requestId: string,
  decision: CaseDecision,
): ActionResult {
  if (reviewer.role !== 'reviewer') return fail('Only the Demo Reviewer can resolve cases.')

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const requests = readList<RefundRequest>(STORAGE_KEYS.refundRequests)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const request = requests.find((item) => item.id === requestId)
  const job = request ? jobs.find((item) => item.id === request.jobId) : undefined
  if (!request || !job) return fail('This case no longer exists.')

  if (!isActive(request)) return fail('This case has already been resolved.')

  if (decision === 'release' && request.status !== 'disputed') {
    return fail('Payment can only be released to the artisan in a dispute. A pending refund request can be approved.')
  }

  const payment = payments.find((item) => item.jobId === job.id)
  if (!payment || payment.status !== 'held') return fail('There is no held payment for this job.')

  const target: JobStatus = decision === 'refund' ? 'refunded' : 'completed'
  const transition = applyTransition(job, target, reviewer, {
    note:
      decision === 'refund'
        ? 'Demo Reviewer approved a simulated refund'
        : 'Demo Reviewer released the simulated payment to the artisan',
    patch: decision === 'release' ? { progress: 100 } : undefined,
  })
  if (!transition.ok) return fail(transition.error)

  const at = transition.job.updatedAt
  const amount = formatNaira(payment.amount)

  const nextPayment: PaymentRecord =
    decision === 'refund'
      ? { ...payment, status: 'refunded', refundedAt: at }
      : { ...payment, status: 'released', releasedAt: at }

  const nextRequest: RefundRequest = {
    ...request,
    status: decision === 'refund' ? 'approved' : 'rejected',
    resolvedBy: reviewer.id,
    resolutionNote:
      decision === 'refund'
        ? 'Refund approved by the Demo Reviewer (simulated). The payment was marked as refunded to the customer.'
        : 'Resolved in favour of the artisan by the Demo Reviewer (simulated). The payment was marked as released to the artisan.',
  }

  const newNotifications: Notification[] = [
    buildNotification(
      job.customerId,
      decision === 'refund'
        ? `Your refund for “${job.title}” was approved. A simulated payment of ${amount} was marked as refunded to you.`
        : `The Demo Reviewer resolved your dispute for “${job.title}” in favour of the artisan. The simulated payment was released to them.`,
      job.id,
    ),
  ]
  if (job.artisanId) {
    newNotifications.push(
      buildNotification(
        job.artisanId,
        decision === 'refund'
          ? `The refund for “${job.title}” was approved. The simulated payment of ${amount} was returned to the customer.`
          : `The dispute for “${job.title}” was resolved in your favour. A simulated payment of ${amount} was released to you.`,
        job.id,
      ),
    )
  }

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    {
      key: STORAGE_KEYS.payments,
      value: payments.map((item) => (item.id === payment.id ? nextPayment : item)),
      old: payments,
    },
    {
      key: STORAGE_KEYS.refundRequests,
      value: requests.map((item) => (item.id === request.id ? nextRequest : item)),
      old: requests,
    },
    { key: STORAGE_KEYS.notifications, value: [...notifications, ...newNotifications], old: notifications },
  ])
}

// ---------- Artisan actions ----------

export function validateResponse(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed.length < REASON_MIN_LENGTH) {
    return `Explain why you are contesting in at least ${REASON_MIN_LENGTH} characters.`
  }
  if (trimmed.length > REASON_MAX_LENGTH) {
    return `Keep your response under ${REASON_MAX_LENGTH} characters.`
  }
  return null
}

interface PendingCase {
  jobs: Job[]
  requests: RefundRequest[]
  payments: PaymentRecord[]
  notifications: Notification[]
  request: RefundRequest
  job: Job
  payment: PaymentRecord
}

// Loads everything both artisan answers need, or returns a message saying why they can't proceed.
function loadPendingCase(artisan: PublicUser, requestId: string): PendingCase | string {
  if (artisan.role !== 'artisan') return 'Only the selected artisan can respond to a refund request.'

  const jobs = readList<Job>(STORAGE_KEYS.jobs)
  const requests = readList<RefundRequest>(STORAGE_KEYS.refundRequests)
  const payments = readList<PaymentRecord>(STORAGE_KEYS.payments)
  const notifications = readList<Notification>(STORAGE_KEYS.notifications)

  const request = requests.find((item) => item.id === requestId)
  const job = request ? jobs.find((item) => item.id === request.jobId) : undefined
  if (!request || !job || job.artisanId !== artisan.id) return 'This request no longer exists.'

  // Stops double-clicks and stale tabs: only a request still awaiting an answer can be answered.
  if (request.status !== 'pending') return 'This request has already been answered.'

  const payment = payments.find((item) => item.jobId === job.id)
  if (!payment || payment.status !== 'held') return 'There is no held payment for this job.'

  return { jobs, requests, payments, notifications, request, job, payment }
}

// Refund Requested -> Refunded. SIMULATED: no money moves anywhere.
export function acceptRefund(artisan: PublicUser, requestId: string): ActionResult {
  const loaded = loadPendingCase(artisan, requestId)
  if (typeof loaded === 'string') return fail(loaded)
  const { jobs, requests, payments, notifications, request, job, payment } = loaded

  const transition = applyTransition(job, 'refunded', artisan, {
    note: 'Artisan accepted the refund request',
  })
  if (!transition.ok) return fail(transition.error)

  const nextPayment: PaymentRecord = {
    ...payment,
    status: 'refunded',
    refundedAt: transition.job.updatedAt,
  }
  const nextRequest: RefundRequest = {
    ...request,
    status: 'approved',
    resolvedBy: artisan.id,
    resolutionNote:
      'The artisan accepted the refund (simulated). The payment was marked as refunded to the customer.',
  }
  const notification = buildNotification(
    job.customerId,
    `${artisan.name} accepted your refund request for “${job.title}”. A simulated payment of ${formatNaira(payment.amount)} was marked as refunded to you.`,
    job.id,
  )

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    {
      key: STORAGE_KEYS.payments,
      value: payments.map((item) => (item.id === payment.id ? nextPayment : item)),
      old: payments,
    },
    {
      key: STORAGE_KEYS.refundRequests,
      value: requests.map((item) => (item.id === request.id ? nextRequest : item)),
      old: requests,
    },
    { key: STORAGE_KEYS.notifications, value: [...notifications, notification], old: notifications },
  ])
}

// Refund Requested -> Disputed. The Demo Reviewer then decides.
export function contestRefund(
  artisan: PublicUser,
  requestId: string,
  response: string,
): ActionResult {
  if (validateResponse(response)) return fail('Please fix the highlighted field.')

  const loaded = loadPendingCase(artisan, requestId)
  if (typeof loaded === 'string') return fail(loaded)
  const { jobs, requests, notifications, request, job } = loaded

  const transition = applyTransition(job, 'disputed', artisan, {
    note: 'Artisan contested the refund request',
  })
  if (!transition.ok) return fail(transition.error)

  const nextRequest: RefundRequest = {
    ...request,
    status: 'disputed',
    artisanResponse: response.trim(),
  }
  const notification = buildNotification(
    job.customerId,
    `${artisan.name} contested your refund request for “${job.title}”. It was sent to the Demo Reviewer, and the simulated payment stays held until they decide.`,
    job.id,
  )

  return commitWrites([
    {
      key: STORAGE_KEYS.jobs,
      value: jobs.map((item) => (item.id === job.id ? transition.job : item)),
      old: jobs,
    },
    {
      key: STORAGE_KEYS.refundRequests,
      value: requests.map((item) => (item.id === request.id ? nextRequest : item)),
      old: requests,
    },
    { key: STORAGE_KEYS.notifications, value: [...notifications, notification], old: notifications },
  ])
}