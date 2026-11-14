import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cx } from '../../lib/classNames'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  error?: string | null
  hint?: string
  children: ReactNode // the <option> elements
}

export default function SelectField({
  id,
  label,
  error,
  hint,
  className,
  children,
  ...rest
}: SelectFieldProps) {
  const showHint = Boolean(hint) && !error
  const describedBy =
    [error ? `${id}-error` : null, showHint ? `${id}-hint` : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          'mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-700',
          error ? 'border-red-600' : 'border-slate-300',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
      {showHint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      )}
    </div>
  )
}