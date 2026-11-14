import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cx } from '../../lib/classNames'
import {
  BIO_MAX_LENGTH,
  BIO_MIN_LENGTH,
  MAX_EXPERIENCE_YEARS,
  getArtisanProfile,
  getProfileChecks,
  profileToFormValues,
  saveArtisanProfile,
  validateProfileInput,
} from '../../services/profileService'
import type { ProfileFieldErrors, ProfileFieldName, ProfileFormValues } from '../../services/profileService'
import ProfileCompletionCard from '../../components/artisans/ProfileCompletionCard'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import SkillPicker from '../../components/ui/SkillPicker'
import TextAreaField from '../../components/ui/TextAreaField'
import TextField from '../../components/ui/TextField'

const FIELD_ORDER: ProfileFieldName[] = ['skills', 'experienceYears', 'serviceLocation', 'bio']

// Which element to focus when a field has an error.
const FOCUS_IDS: Record<ProfileFieldName, string> = {
  skills: 'profile-skills-0',
  experienceYears: 'profile-experienceYears',
  serviceLocation: 'profile-serviceLocation',
  bio: 'profile-bio',
}

interface Message {
  tone: 'success' | 'error'
  text: string
}

export default function ArtisanProfileEditor() {
  const { user } = useAuth()

  const [initial] = useState(() => (user ? getArtisanProfile(user.id) : null))
  const [saved, setSaved] = useState(initial)
  const [values, setValues] = useState<ProfileFormValues>(() => profileToFormValues(initial))
  const [errors, setErrors] = useState<ProfileFieldErrors>({})
  const [message, setMessage] = useState<Message | null>(null)

  function setField<K extends ProfileFieldName>(field: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setMessage(null)

    const nextErrors = validateProfileInput(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(FOCUS_IDS[firstInvalid])?.focus()
      return
    }

    const result = saveArtisanProfile(user, values)
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }

    // Show what was really saved (trimmed text, tidy skill order).
    const updated = getArtisanProfile(user.id)
    setSaved(updated)
    setValues(profileToFormValues(updated))
    setMessage({ tone: 'success', text: 'Profile saved.' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">My profile</h1>
      <p className="mt-1 text-slate-600">
        This is what customers see when you send a quotation.
      </p>

      <div className="mt-6">
        <ProfileCompletionCard checks={getProfileChecks(saved)} />
      </div>

      <Card className="mt-6 p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
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

          <SkillPicker
            id="profile-skills"
            value={values.skills}
            onChange={(skills) => setField('skills', skills)}
            error={errors.skills}
          />

          <TextField
            id="profile-experienceYears"
            label="Years of experience"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_EXPERIENCE_YEARS}
            step={1}
            hint="Whole years. Enter 0 if you have less than a year."
            value={values.experienceYears}
            onChange={(event) => setField('experienceYears', event.target.value)}
            error={errors.experienceYears}
          />

          <TextField
            id="profile-serviceLocation"
            label="Service location"
            placeholder="e.g. Ibadan, Oyo State"
            maxLength={100}
            value={values.serviceLocation}
            onChange={(event) => setField('serviceLocation', event.target.value)}
            error={errors.serviceLocation}
          />

          <TextAreaField
            id="profile-bio"
            label="About you and your work"
            rows={5}
            maxLength={BIO_MAX_LENGTH}
            hint={`At least ${BIO_MIN_LENGTH} characters. Say what you do and what customers can expect.`}
            value={values.bio}
            onChange={(event) => setField('bio', event.target.value)}
            error={errors.bio}
          />

          <p className="text-sm text-slate-600">
            Portfolio photos and a profile picture are coming in a later step.
          </p>

          <Button type="submit">Save profile</Button>
        </form>
      </Card>
    </div>
  )
}