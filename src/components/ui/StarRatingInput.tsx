import { Star } from 'lucide-react'
import { cx } from '../../lib/classNames'

interface StarRatingInputProps {
  id: string
  value: number // 0 means nothing chosen yet
  onChange: (value: number) => void
  error?: string | null
}

// Five real radio buttons drawn as stars, so keyboard (arrow keys) and screen readers work.
export default function StarRatingInput({ id, value, onChange, error }: StarRatingInputProps) {
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="block text-sm font-medium text-slate-800">Your rating</legend>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              id={`${id}-${n}`}
              type="radio"
              name={id}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <Star
              aria-hidden="true"
              className={cx(
                'h-9 w-9 rounded peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700',
                n <= value ? 'fill-amber-500 text-amber-500' : 'text-slate-400',
              )}
            />
            <span className="sr-only">
              {n} {n === 1 ? 'star' : 'stars'}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {value > 0 ? `${value} out of 5` : 'Choose 1 to 5 stars'}
      </p>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  )
}