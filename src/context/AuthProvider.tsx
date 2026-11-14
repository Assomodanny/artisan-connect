import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { STORAGE_KEYS } from '../lib/storage'
import { getSessionUser, loginUser, logoutUser, registerUser } from '../services/authService'
import type { PublicUser, RegisterInput } from '../services/authService'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export default function AuthProvider({ children }: { children: ReactNode }) {
  // Restore the session when the app starts, so a refresh keeps you signed in.
  const [user, setUser] = useState<PublicUser | null>(() => getSessionUser())

  // If you log in or out in another tab, this tab follows.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.session || event.key === null) {
        setUser(getSessionUser())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const register = useCallback((input: RegisterInput) => {
    const result = registerUser(input)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const login = useCallback((email: string, password: string) => {
    const result = loginUser(email, password)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, register, login, logout }),
    [user, register, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}