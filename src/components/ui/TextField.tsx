import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/classNames'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string | null
  hint?: string
  trailing?: ReactNode // e.g. the show/hide button inside the box
}

export default function TextField({
  id,
  label,
  error,
  hint,
  trailing,
  className,
  ...rest
}: TextFieldProps) {
  const showHint = Boolean(hint) && !error
  const describedBy =
    [error ? `${id}-error` : null, showHint ? `${id}-hint` : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            'w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-brand-700',
            error ? 'border-red-600' : 'border-slate-300',
        trailing ? 'pr-11' : false,
            className,
          )}
          {...rest}
        />
       {trailing ? (
  <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
) : null}
      </div>
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