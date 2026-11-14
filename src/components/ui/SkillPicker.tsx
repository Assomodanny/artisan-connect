import { Check } from 'lucide-react'
import { SERVICE_CATEGORIES } from '../../types'
import type { ServiceCategory } from '../../types'

interface SkillPickerProps {
  id: string
  value: ServiceCategory[]
  onChange: (skills: ServiceCategory[]) => void
  error?: string | null
}

// Real checkboxes drawn as pills, so keyboard and screen readers work. A tick shows the
// selected ones, so the state never depends on colour alone.
export default function SkillPicker({ id, value, onChange, error }: SkillPickerProps) {
  function toggle(name: ServiceCategory) {
    onChange(value.includes(name) ? value.filter((skill) => skill !== name) : [...value, name])
  }

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="block text-sm font-medium text-slate-800">Your skills</legend>
      <p className="mt-1 text-sm text-slate-600">Choose every kind of work you do.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SERVICE_CATEGORIES.map((name, index) => {
          const selected = value.includes(name)
          return (
            <label key={name} className="cursor-pointer">
              <input
                id={`${id}-${index}`}
                type="checkbox"
                checked={selected}
                onChange={() => toggle(name)}
                className="peer sr-only"
              />
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-800 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                {name}
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  )
}