import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { ActionResult } from '../../lib/commit'
import { formatNaira } from '../../lib/formatters'
import {
  MAX_DAYS,
  MIN_PRICE,
  PROPOSAL_MAX_LENGTH,
  PROPOSAL_MIN_LENGTH,
  createApplication,
  validateQuotationInput,
} from '../../services/quotationService'
import type {
  QuotationFieldErrors,
  QuotationFieldName,
  QuotationFormValues,
} from '../../services/quotationService'
import type { Job } from '../../types'
import Button from '../ui/Button'
import TextAreaField from '../ui/TextAreaField'
import TextField from '../ui/TextField'

const FIELD_ORDER: QuotationFieldName[] = ['price', 'estimatedDays', 'proposal']

const FIELD_IDS: Record<QuotationFieldName, string> = {
  price: 'quote-price',
  estimatedDays: 'quote-estimatedDays',
  proposal: 'quote-proposal',
}

const EMPTY_VALUES: QuotationFormValues = { price: '', estimatedDays: '', proposal: '' }

interface QuotationFormProps {
  job: Job
  onResult: (result: ActionResult) => void
}

export default function QuotationForm({ job, onResult }: QuotationFormProps) {
  const { user } = useAuth()
  const [values, setValues] = useState<QuotationFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<QuotationFieldErrors>({})

  function setField<K extends QuotationFieldName>(field: K, value: QuotationFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    const nextErrors = validateQuotationInput(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }

    onResult(createApplication(user, job.id, values))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id={FIELD_IDS.price}
          label="Your price (₦)"
          type="number"
          inputMode="numeric"
          min={MIN_PRICE}
          step={1}
          hint={`The customer's budget is ${formatNaira(job.budget)}.`}
          value={values.price}
          onChange={(event) => setField('price', event.target.value)}
          error={errors.price}
        />
        <TextField
          id={FIELD_IDS.estimatedDays}
          label="Days to finish"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_DAYS}
          step={1}
          hint="Whole days, from the day you start."
          value={values.estimatedDays}
          onChange={(event) => setField('estimatedDays', event.target.value)}
          error={errors.estimatedDays}
        />
      </div>

      <TextAreaField
        id={FIELD_IDS.proposal}
        label="Your proposal"
        rows={5}
        maxLength={PROPOSAL_MAX_LENGTH}
        hint={`What you will do, what is included, and why you are a good fit. At least ${PROPOSAL_MIN_LENGTH} characters.`}
        value={values.proposal}
        onChange={(event) => setField('proposal', event.target.value)}
        error={errors.proposal}
      />

      <Button type="submit">Send quotation</Button>
    </form>
  )
}