import { useRouter } from "next/router"
import { useEffect, ReactNode } from "react"
import { UserRole } from "@/types/auth"
import { useStores } from "@/pages/_app"
import { toast } from "sonner"
import { runInAction, reaction } from "mobx"
import { observer } from "mobx-react-lite"

interface AuthGuardProps {
  requiredRoles: UserRole[]
  children: ReactNode
}

// Helper function to check if a user has the required role
function hasRequiredRole(user: any, requiredRoles: UserRole[]): boolean {
  // Admin role always has access to everything
  if (user.role === UserRole.ADMIN) return true;
  
  // Check if the user has any of the required roles
  return requiredRoles.includes(user.role as UserRole);
}

export const AuthGuard = observer(({ requiredRoles, children }: AuthGuardProps) => {
  const { authStore } = useStores()
  const router = useRouter()
  
  // Force loading state to false if we already have user data
  // This catches cases where store state might be stale after navigation
  if (authStore.isLoading && authStore.user && authStore.isAuthenticated) {
    console.log("AuthGuard: Force resetting isLoading because user is already authenticated");
    runInAction(() => {
      authStore.isLoading = false;
    });
  }
  
  useEffect(() => {
    // Skip if we're still loading
    if (authStore.isLoading) return;
    
    // If not authenticated, redirect to login
    if (!authStore.isAuthenticated || !authStore.user) {
      if (router.pathname !== "/login") {
        // Save current path for redirect after login
        localStorage.setItem('authRedirect', router.asPath);
        console.log("AuthGuard: Redirecting to login");
        router.push("/login");
      }
      return;
    }
    
    // Check if user has required roles
    if (authStore.user && !hasRequiredRole(authStore.user, requiredRoles)) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [
    authStore.isLoading, 
    authStore.isAuthenticated, 
    authStore.user, 
    requiredRoles, 
    router
  ]);

  // Render logic - prioritize showing content if authenticated
  if (authStore.isAuthenticated && authStore.user) {
    return <>{children}</>;
  }
  
  // For loading or redirecting states, show a spinner
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-sm text-muted-foreground">
        {authStore.isLoading ? "Verifying authentication..." : "Redirecting..."}
      </div>
    </div>
  );
});