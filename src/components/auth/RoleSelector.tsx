import { Hammer, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SignupRole } from '../../services/authService'

interface RoleOption {
  value: SignupRole
  title: string
  text: string
  icon: LucideIcon
}

const OPTIONS: RoleOption[] = [
  { value: 'customer', title: 'Customer', text: 'I need a job done', icon: User },
  { value: 'artisan', title: 'Artisan', text: 'I offer skilled services', icon: Hammer },
]

interface RoleSelectorProps {
  value: SignupRole
  onChange: (role: SignupRole) => void
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-slate-800">I am joining as a</legend>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <label key={option.value} className="relative block cursor-pointer">
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span className="flex h-full flex-col items-center gap-1 rounded-xl border border-slate-300 bg-white p-4 text-center peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                <Icon className="h-6 w-6 text-brand-700" aria-hidden="true" />
                <span className="font-semibold text-slate-900">{option.title}</span>
                <span className="text-xs text-slate-600">{option.text}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}