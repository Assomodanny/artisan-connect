import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/classNames'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean // adds a hover lift for clickable cards
  children: ReactNode
}

export default function Card({ interactive = false, className, children, ...rest }: CardProps) {
  // If the caller picks its own background (like "bg-green-50"), don't also add white.
  const hasOwnBackground = Boolean(className && /(^|\s)bg-/.test(className))

  return (
    <div
      className={cx(
        'rounded-xl p-6 shadow-soft ring-1 ring-slate-200/60',
        !hasOwnBackground && 'bg-white',
        interactive && 'transition-shadow hover:shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}