import { type ReactElement } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../selectors";
import AuthGate from "./AuthGate";
import { Navigate, useLocation } from "react-router-dom";
import { Permission, getRoutePermission } from "../../../shared/lib/permissions";
import { usePermissions } from "../../../shared/hooks/usePermissions";

type Props = { 
  element: ReactElement;
  /**
   * Optional: Explicitly require a permission for this route.
   * If not provided, will attempt to auto-detect from route path.
   */
  requiredPermission?: Permission;
  /**
   * Where to redirect if user lacks permission (default: /dashboard)
   */
  unauthorizedRedirect?: string;
};

/**
 * ProtectedRoute - Guards routes with authentication AND permission checks
 * 
 * Usage:
 * ```tsx
 * // Auto-detect permission from route path
 * <Route path="/team-members" element={<ProtectedRoute element={<TeamMembersPage />} />} />
 * 
 * // Explicit permission
 * <Route path="/billing" element={
 *   <ProtectedRoute element={<BillingPage />} requiredPermission={Permission.MANAGE_BILLING} />
 * } />
 * ```
 */
export default function ProtectedRoute({ 
  element, 
  requiredPermission,
  unauthorizedRedirect = "/dashboard" 
}: Props) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const { hasPermission, user } = usePermissions();

  // If not authenticated, show login
  if (!isAuthed) {
    return (
      <AuthGate>
        <Navigate to="/login" replace state={{ from: location }} />
      </AuthGate>
    );
  }

  // Determine which permission to check (includes query params for sub-routes like ?tab=billing)
  const permissionToCheck = requiredPermission || getRoutePermission(location.pathname, location.search);

  // If there's a permission requirement and user lacks it, redirect
  if (permissionToCheck && user && !hasPermission(permissionToCheck)) {
    // Redirect to dashboard (or custom redirect) with a message
    return (
      <AuthGate>
        <Navigate 
          to={unauthorizedRedirect} 
          replace 
          state={{ 
            from: location,
            unauthorizedAccess: true,
            requiredPermission: permissionToCheck 
          }} 
        />
      </AuthGate>
    );
  }

  // User is authenticated and has permission (or no permission required)
  return (
    <AuthGate>
      {element}
    </AuthGate>
  );
}
