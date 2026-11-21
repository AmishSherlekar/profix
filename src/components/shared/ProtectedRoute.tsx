import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole | UserRole[]
  redirectTo?: string
}

/**
 * ProtectedRoute guards pages by authentication and optional role.
 * This is a UI convenience ONLY — all actual data security is enforced by RLS.
 */
export function ProtectedRoute({ children, requiredRole, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="space-y-3 w-full max-w-sm">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (role && !allowed.includes(role)) {
      // Redirect to the appropriate dashboard for their role
      const dashMap: Record<UserRole, string> = {
        customer: '/customer',
        professional: '/pro',
        admin: '/admin',
      }
      return <Navigate to={dashMap[role] ?? '/'} replace />
    }
  }

  return <>{children}</>
}
