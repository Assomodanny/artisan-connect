import type { TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/classNames'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  error?: string | null
  hint?: string
}

export default function TextAreaField({
  id,
  label,
  error,
  hint,
  className,
  rows = 5,
  ...rest
}: TextAreaFieldProps) {
  const showHint = Boolean(hint) && !error
  const describedBy =
    [error ? `${id}-error` : null, showHint ? `${id}-hint` : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          'mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-brand-700',
          error ? 'border-red-600' : 'border-slate-300',
          className,
        )}
        {...rest}
      />
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