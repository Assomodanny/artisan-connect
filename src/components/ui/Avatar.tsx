import { getInitials } from '../../lib/formatters'
import { isStoredImage } from '../../lib/images'
import { cx } from '../../lib/classNames'

type AvatarSize = 'md' | 'lg' | 'xl'

interface AvatarProps {
  name: string
  size?: AvatarSize
  src?: string // a stored photo; initials are shown when there isn't one
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-3xl',
}

// Decorative, because the person's name is always shown next to it.
export default function Avatar({ name, size = 'md', src }: AvatarProps) {
  if (src && isStoredImage(src)) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cx('shrink-0 rounded-full object-cover', SIZE_CLASSES[size])}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800',
        SIZE_CLASSES[size],
      )}
    >
      {getInitials(name)}
    </span>
  )
}