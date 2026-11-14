import {
  Ellipsis,
  Flame,
  Hammer,
  LayoutGrid,
  PaintRoller,
  Snowflake,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ServiceCategory } from '../types'

interface CategoryMeta {
  icon: LucideIcon
  blurb: string
}

// Record<ServiceCategory, ...> means TypeScript errors if a category is missing here.
export const CATEGORY_META: Record<ServiceCategory, CategoryMeta> = {
  Plumbing: { icon: Wrench, blurb: 'Leaks, pipes, taps and bathrooms' },
  Electrical: { icon: Zap, blurb: 'Wiring, sockets and fuse boxes' },
  Carpentry: { icon: Hammer, blurb: 'Wardrobes, doors and furniture' },
  Painting: { icon: PaintRoller, blurb: 'Interior and exterior painting' },
  Cleaning: { icon: Sparkles, blurb: 'Homes, offices and after-build cleaning' },
  Tiling: { icon: LayoutGrid, blurb: 'Floor and wall tiles' },
  Welding: { icon: Flame, blurb: 'Gates, frames and metalwork' },
  'Air Conditioning': { icon: Snowflake, blurb: 'Installation and servicing' },
  Other: { icon: Ellipsis, blurb: 'Other skilled trades' },
}