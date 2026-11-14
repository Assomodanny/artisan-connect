import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import {
  ADDRESS_MAX_LENGTH,
  customerProfileToFormValues,
  getCustomerProfile,
  saveCustomerProfile,
  validateCustomerProfile,
} from '../../services/customerProfileService'
import type {
  CustomerFieldErrors,
  CustomerFieldName,
  CustomerProfileFormValues,
} from '../../services/customerProfileService'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ImageUploader from '../../components/ui/ImageUploader'
import TextField from '../../components/ui/TextField'

const FIELD_ORDER: CustomerFieldName[] = ['phone', 'address']
const FIELD_IDS: Record<CustomerFieldName, string> = {
  phone: 'customer-phone',
  address: 'customer-address',
}

interface Message {
  tone: 'success' | 'error'
  text: string
}

export default function CustomerProfileEditor() {
  const { user } = useAuth()

  const [values, setValues] = useState<CustomerProfileFormValues>(() =>
    customerProfileToFormValues(user ? getCustomerProfile(user.id) : null),
  )
  const [errors, setErrors] = useState<CustomerFieldErrors>({})
  const [message, setMessage] = useState<Message | null>(null)

  if (!user) return null

  function setField<K extends keyof CustomerProfileFormValues>(field: K, value: CustomerProfileFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setMessage(null)

    const nextErrors = validateCustomerProfile(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }

    const result = saveCustomerProfile(user, values)
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }

    // Show what was really saved (trimmed text).
    setValues(customerProfileToFormValues(getCustomerProfile(user.id)))
    setMessage({ tone: 'success', text: 'Profile saved.' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">My profile</h1>
      <p className="mt-1 text-slate-600">Your details and photo. Only you can see this page.</p>

      <Card className="mt-6 p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {message && (
            <p
              role={message.tone === 'error' ? 'alert' : 'status'}
              className={cx(
                'flex items-center gap-2 rounded-lg p-3 text-sm',
                message.tone === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-800',
              )}
            >
              {message.tone === 'success' && (
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              {message.text}
            </p>
          )}

          <ImageUploader
            id="customer-avatar"
            label="Profile photo"
            name={user.name}
            value={values.avatar}
            onChange={(avatar) => setField('avatar', avatar)}
            hint="JPG, PNG or WebP. It is shrunk automatically. Click Save profile to keep it."
          />

          <dl className="grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-600">Name</dt>
              <dd className="font-semibold text-slate-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Email</dt>
              <dd className="break-all font-semibold text-slate-900">{user.email}</dd>
            </div>
          </dl>

          <TextField
            id={FIELD_IDS.phone}
            label="Phone number (optional)"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. 0803 000 0001"
            value={values.phone}
            onChange={(event) => setField('phone', event.target.value)}
            error={errors.phone}
          />

          <TextField
            id={FIELD_IDS.address}
            label="Address (optional)"
            autoComplete="street-address"
            placeholder="e.g. Bodija, Ibadan"
            maxLength={ADDRESS_MAX_LENGTH}
            value={values.address}
            onChange={(event) => setField('address', event.target.value)}
            error={errors.address}
          />

          <Button type="submit">Save profile</Button>
        </form>
      </Card>
    </div>
  )
}