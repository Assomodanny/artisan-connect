import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { canRoleAccessPath, getHomePathForRole, safeRedirectPath } from '../../lib/routes'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import PasswordField from '../../components/ui/PasswordField'
import TextField from '../../components/ui/TextField'

export default function Login() {
  const { user, login } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Already signed in (or just signed in): go to where they were headed, or their home page.
  if (user) {
    const home = getHomePathForRole(user.role)
    const from = (location.state as { from?: unknown } | null)?.from
    const target = safeRedirectPath(from, home)
    return <Navigate to={canRoleAccessPath(user.role, target) ? target : home} replace />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const nextEmailError = email.trim() ? null : 'Enter your email address.'
    const nextPasswordError = password ? null : 'Enter your password.'
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)

    if (nextEmailError) {
      document.getElementById('login-email')?.focus()
      return
    }
    if (nextPasswordError) {
      document.getElementById('login-password')?.focus()
      return
    }

    const result = login(email, password)
    if (!result.ok) setFormError(result.error)
    // On success the user state changes and the redirect above takes over.
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back to Artisan Connect."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-800 underline">
            Create an account
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

        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
        />

        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  )
}