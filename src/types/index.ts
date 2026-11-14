// ---------- Roles ----------
// 'reviewer' is the seeded "Demo Reviewer" account that resolves disputes.
export type Role = 'customer' | 'artisan' | 'reviewer'

// ---------- Service categories ----------
export const SERVICE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Tiling',
  'Welding',
  'Air Conditioning',
  'Other',
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

// ---------- Users and profiles ----------
export interface User {
  id: string
  role: Role
  name: string
  email: string
  // DEMO ONLY: stored as plain text. Never do this in a real application.
  password: string
  createdAt: string // ISO date string
}

export interface CustomerProfile {
  userId: string
  phone: string
  address: string
  avatar?: string // compressed data URL
}

export interface ArtisanProfile {
  userId: string
  skills: ServiceCategory[]
  experienceYears: number
  bio: string
  serviceLocation: string
  portfolio: string[] // compressed data URLs
  avatar?: string
  ratingAverage: number
  ratingCount: number
}

// ---------- Jobs ----------
export type JobStatus =
  | 'open'
  | 'applications_received'
  | 'artisan_selected'
  | 'awaiting_payment'
  | 'payment_held'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'refund_requested'
  | 'refunded'
  | 'disputed'

export interface StatusChange {
  from: JobStatus | null // null for the first entry (job creation)
  to: JobStatus
  by: string // a user id, or 'system'
  at: string // ISO date string
  note?: string
}

export interface Job {
  id: string
  customerId: string
  title: string
  description: string
  category: ServiceCategory
  location: string
  budget: number
  preferredDate: string
  images: string[] // compressed data URLs
  status: JobStatus
  statusHistory: StatusChange[]
  createdAt: string
  updatedAt: string

  // "Booking" fields: empty until a quotation is accepted
  acceptedApplicationId?: string
  artisanId?: string
  agreedPrice?: number
  progress: number // 0 to 100
}

// ---------- Applications (each one includes a quotation) ----------
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface Application {
  id: string
  jobId: string
  artisanId: string
  proposal: string
  price: number
  estimatedDays: number
  status: ApplicationStatus
  createdAt: string
}

// ---------- Payments (SIMULATED only) ----------
export type PaymentStatus = 'pending' | 'held' | 'released' | 'refunded'

export interface PaymentRecord {
  id: string
  jobId: string
  amount: number
  status: PaymentStatus
  simulated: true // always true: no real money moves in this app
  heldAt?: string
  releasedAt?: string
  refundedAt?: string
}

// ---------- Refunds and disputes ----------
export type RefundRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disputed'
  | 'withdrawn'

export interface RefundRequest {
  id: string
  jobId: string
  requestedBy: string // user id
  reason: string
  previousStatus: JobStatus // restored if the request is withdrawn
  status: RefundRequestStatus
  createdAt: string
  resolvedBy?: string
  resolutionNote?: string
    artisanResponse?: string // the artisan's side, written when they contest
}

// ---------- Reviews and notifications ----------
export interface Review {
  id: string
  jobId: string
  customerId: string
  artisanId: string
  rating: number // 1 to 5
  comment: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string // who receives it
  message: string
  jobId?: string
  read: boolean
  createdAt: string
}