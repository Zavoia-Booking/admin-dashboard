import { useRouter } from "next/router"
import { useEffect, ReactNode } from "react"
import { UserRole } from "@/types/auth"
import { useStores } from "@/pages/_app"
import { toast } from "sonner"

interface AuthGuardProps {
  requiredRoles: UserRole[]
  children: ReactNode
}

export function AuthGuard({ requiredRoles, children }: AuthGuardProps) {
  const { authStore } = useStores()
  const router = useRouter()

  console.log('isLoading', authStore.isLoading);

  useEffect(() => {
    // Wait for authentication check to complete
    if (authStore.isLoading) return;

    // If not authenticated, redirect to login
    if (!authStore.isAuthenticated || !authStore.user) {
      // Only save current path if not already redirecting to login
      if (router.pathname !== "/login") {
        // Save current path for redirect after login
        localStorage.setItem('authRedirect', router.asPath);
        
        // Redirect to login
        router.push("/login");
      }
      return;
    }

    // User is authenticated but doesn't have required role
    if (authStore.user && !requiredRoles.includes(UserRole.ADMIN)) {
      if (!requiredRoles.includes(authStore.user.role as UserRole)) {
        toast.error("You don't have permission to access this page");
        router.push("/dashboard");
      }
    }
  }, [authStore.isLoading, authStore.isAuthenticated, authStore.user, requiredRoles, router.pathname, router.asPath]);

  // Show loading while checking auth
  if (authStore.isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-sm text-muted-foreground">Verifying authentication...</div>
      </div>
    );
  }

  // Show protected content if authenticated
  if (!authStore.isLoading && authStore.isAuthenticated && authStore.user) {
    return <>{children}</>;
  }

  // Return loading indicator during redirect
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-sm text-muted-foreground">Redirecting...</div>
    </div>
  );
}