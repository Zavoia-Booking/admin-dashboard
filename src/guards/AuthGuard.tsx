import { useRouter } from "next/router"
import { useEffect, ReactNode } from "react"
import { UserRole } from "@/types/auth"
import { useUserStore } from "@/hooks/useUserStore"

interface AuthGuardProps {
  requiredRoles: UserRole[]
  children: ReactNode
}

export function AuthGuard({ requiredRoles, children }: AuthGuardProps) {
  const { isLoading, user, isAuthenticated, setRedirect } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setRedirect(router.route)
      router.push("/")
      return
    }
    if (isAuthenticated && !requiredRoles.includes('admin')) {
      if (!requiredRoles.includes(user?.role as UserRole)) {
        router.push("/dashboard")
      }
    }
  }, [isLoading, router, user, setRedirect, isAuthenticated, requiredRoles])

  /* show loading indicator while the auth provider is still initializing */
  if (isLoading) {
    return <h1>Application Loading</h1>
  }

  // if auth initialized with a valid user show protected page
  if (!isLoading && user) {
    return <>{children}</>
  }

  /* otherwise don't return anything, will do a redirect from useEffect */
  return null
}