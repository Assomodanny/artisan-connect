import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { SERVICE_CATEGORIES } from '../../types'
import type { ServiceCategory } from '../../types'
import { MAX_JOB_PHOTOS, createJob, getTodayString, validateJobInput } from '../../services/jobService'
import type { JobFieldErrors, JobFieldName, JobFormValues } from '../../services/jobService'
import Button, { buttonClasses } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import MultiImagePicker from '../../components/ui/MultiImagePicker'
import SelectField from '../../components/ui/SelectField'
import TextAreaField from '../../components/ui/TextAreaField'
import TextField from '../../components/ui/TextField'

const FIELD_ORDER: JobFieldName[] = [
  'title',
  'category',
  'description',
  'location',
  'budget',
  'preferredDate',
  'images',
]

const EMPTY_VALUES: JobFormValues = {
  title: '',
  description: '',
  category: '',
  location: '',
  budget: '',
  preferredDate: '',
  images: [],
}

export default function PostJob() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<JobFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<JobFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  function setField<K extends JobFieldName>(field: K, value: JobFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setFormError(null)

    const nextErrors = validateJobInput(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(`job-${firstInvalid}`)?.focus()
      return
    }

    const result = createJob(user, values)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    navigate('/customer/jobs', { state: { posted: result.job.title } })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Post a job</h1>
      <p className="mt-1 text-slate-600">
        Describe the work. Artisans will apply with their price and plan.
      </p>

      <Card className="mt-6 p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {formError}
            </p>
          )}

          <TextField
            id="job-title"
            label="Job title"
            placeholder="e.g. Fix leaking kitchen sink"
            maxLength={80}
            value={values.title}
            onChange={(event) => setField('title', event.target.value)}
            error={errors.title}
          />

          <SelectField
            id="job-category"
            label="Service category"
            value={values.category}
            onChange={(event) => setField('category', event.target.value as ServiceCategory | '')}
            error={errors.category}
          >
            <option value="">Choose a category</option>
            {SERVICE_CATEGORIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </SelectField>

          <TextAreaField
            id="job-description"
            label="Description"
            hint="What needs doing, and anything the artisan should know. At least 20 characters."
            maxLength={1000}
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            error={errors.description}
          />

          <TextField
            id="job-location"
            label="Location"
            placeholder="e.g. Bodija, Ibadan"
            maxLength={100}
            value={values.location}
            onChange={(event) => setField('location', event.target.value)}
            error={errors.location}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="job-budget"
              label="Budget (₦)"
              type="number"
              inputMode="numeric"
              min={1000}
              step={1}
              hint="Amount in Naira."
              value={values.budget}
              onChange={(event) => setField('budget', event.target.value)}
              error={errors.budget}
            />
            <TextField
              id="job-preferredDate"
              label="Preferred date"
              type="date"
              min={getTodayString()}
              value={values.preferredDate}
              onChange={(event) => setField('preferredDate', event.target.value)}
              error={errors.preferredDate}
            />
          </div>

          <MultiImagePicker
            id="job-images"
            label="Reference photos (optional)"
            itemLabel="Reference photo"
            hint="Show the problem or the space. Artisans who can see this job will see them."
            emptyText="No photos yet. Photos help artisans give an accurate quotation."
            max={MAX_JOB_PHOTOS}
            images={values.images}
            onChange={(images) => setField('images', images)}
            error={errors.images}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit">Post job</Button>
            <Link to="/customer/jobs" className={buttonClasses('secondary', 'md')}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}