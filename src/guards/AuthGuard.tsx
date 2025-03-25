import { useRouter } from "next/router"
import { useEffect, ReactNode } from "react"
import { useClientContext } from "@/contexts/clientContext"
import { UserRole } from "@/types/auth"

interface AuthGuardProps {
  requiredRoles: UserRole[]
  children: ReactNode
}

export function AuthGuard({ requiredRoles, children }: AuthGuardProps) {
  const { loading, data, setRedirect } = useClientContext()
  const { isAuthenticated, user } = data
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      setRedirect(router.route)
      router.push("/login")
      return
    }
    if (isAuthenticated && !requiredRoles.includes('admin')) {
      if (!requiredRoles.includes(user?.role as UserRole)) {
        router.push("/")
      }
    }
  }, [loading, router, user, setRedirect, isAuthenticated, requiredRoles])

  /* show loading indicator while the auth provider is still initializing */
  if (loading) {
    return <h1>Application Loading</h1>
  }

  // if auth initialized with a valid user show protected page
  if (!loading && user) {
    return <>{children}</>
  }

  /* otherwise don't return anything, will do a redirect from useEffect */
  return null
}