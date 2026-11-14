import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { getHomePathForRole } from '../../lib/routes'
import { validateEmail, validateName, validatePassword } from '../../lib/validators'
import type { SignupRole } from '../../services/authService'
import AuthLayout from '../../components/auth/AuthLayout'
import RoleSelector from '../../components/auth/RoleSelector'
import Button from '../../components/ui/Button'
import PasswordField from '../../components/ui/PasswordField'
import TextField from '../../components/ui/TextField'

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword' | 'reviewerCode'
type FieldErrors = Partial<Record<FieldName, string>>

const FIELD_IDS: Record<FieldName, string> = {
  name: 'register-name',
  email: 'register-email',
  password: 'register-password',
  confirmPassword: 'register-confirm-password',
  reviewerCode: 'register-reviewer-code',
}

export default function Register() {
  const { user, register } = useAuth()
  const [searchParams] = useSearchParams()

  const [reviewerMode, setReviewerMode] = useState(false)
  // "/register?role=artisan" preselects the artisan option.
  const [role, setRole] = useState<SignupRole>(
    searchParams.get('role') === 'artisan' ? 'artisan' : 'customer',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [reviewerCode, setReviewerCode] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (user) return <Navigate to={getHomePathForRole(user.role)} replace />

  function switchMode(next: boolean) {
    setReviewerMode(next)
    setErrors({})
    setFormError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const nextErrors: FieldErrors = {}
    const nameError = validateName(name)
    if (nameError) nextErrors.name = nameError
    const emailError = validateEmail(email)
    if (emailError) nextErrors.email = emailError
    const passwordError = validatePassword(password)
    if (passwordError) nextErrors.password = passwordError
    if (!passwordError && confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    if (reviewerMode && !reviewerCode.trim()) {
      nextErrors.reviewerCode = 'Enter the reviewer code.'
    }

    setErrors(nextErrors)

    const order: FieldName[] = ['name', 'email', 'password', 'confirmPassword', 'reviewerCode']
    const firstInvalid = order.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }

    const result = register({
      name,
      email,
      password,
      role: reviewerMode ? 'reviewer' : role,
      reviewerCode: reviewerMode ? reviewerCode : undefined,
    })
    if (!result.ok) setFormError(result.error)
    // On success the user state changes and the redirect above takes over.
  }

  return (
    <AuthLayout
      title={reviewerMode ? 'Create the Demo Reviewer account' : 'Create your account'}
      subtitle={
        reviewerMode
          ? 'The reviewer decides refund requests and disputes.'
          : 'Join as a customer or an artisan.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-800 underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </p>
        )}

        {reviewerMode ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            This account does not post or apply for jobs. You need the reviewer code set by the
            project owner.
          </p>
        ) : (
          <RoleSelector value={role} onChange={setRole} />
        )}

        <TextField
          id={FIELD_IDS.name}
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
        />
        <TextField
          id={FIELD_IDS.email}
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <PasswordField
          id={FIELD_IDS.password}
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <PasswordField
          id={FIELD_IDS.confirmPassword}
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />

        {reviewerMode && (
          <PasswordField
            id={FIELD_IDS.reviewerCode}
            label="Reviewer code"
            autoComplete="off"
            value={reviewerCode}
            onChange={(event) => setReviewerCode(event.target.value)}
            error={errors.reviewerCode}
          />
        )}

        <Button type="submit" className="w-full">
          {reviewerMode ? 'Create reviewer account' : 'Create account'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        {reviewerMode ? (
          <Button variant="ghost" size="sm" onClick={() => switchMode(false)}>
            Back to customer or artisan sign-up
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => switchMode(true)}>
            Setting up the Demo Reviewer?
          </Button>
        )}
      </div>
    </AuthLayout>
  )
}