import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import Forbidden from '../../pages/public/Forbidden'
import type { Role } from '../../types'

interface ProtectedRouteProps {
  allowedRoles: Role[]
}

// Wrap routes with this. Signed out -> log in. Wrong role -> access denied. Otherwise show the page.
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // "from" lets the login page send the person back here afterwards.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (!allowedRoles.includes(user.role)) return <Forbidden />

  return <Outlet />
}