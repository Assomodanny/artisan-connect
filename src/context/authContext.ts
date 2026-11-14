import { createContext } from 'react'
import type { AuthResult, PublicUser, RegisterInput } from '../services/authService'

export interface AuthContextValue {
  user: PublicUser | null
  register: (input: RegisterInput) => AuthResult
  login: (email: string, password: string) => AuthResult
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)