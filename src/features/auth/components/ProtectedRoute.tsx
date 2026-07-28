import { type ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { selectIsAuthenticated } from "../selectors";
import { logoutRequestAction } from "../actions";
import AuthGate from "./AuthGate";
import { Navigate, useLocation } from "react-router-dom";
import { Permission, getRoutePermission, getHomeRouteForRole } from "../../../shared/lib/permissions";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import { Button } from "../../../shared/components/ui/button";

/** Terminal recovery screen: the role has no accessible home route (navigating would loop). Sign out to recover. */
function AccessRecoveryScreen() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  return (
    <div className="min-h-[100svh] bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm text-foreground-3">
          {t("auth:page.errors.sessionExpired")}
        </p>
        <Button rounded="full" className="mt-5" onClick={() => dispatch(logoutRequestAction.request())}>
          {t("navigation:sidebar.logOut")}
        </Button>
      </div>
    </div>
  );
}

type Props = { 
  element: ReactElement;
  /**
   * Optional: Explicitly require a permission for this route.
   * If not provided, will attempt to auto-detect from route path.
   */
  requiredPermission?: Permission;
  /**
   * Where to redirect if user lacks permission.
   * If not provided, uses the role-appropriate home route (e.g. /dashboard for owner, /my-profile for dashboard_user).
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
  unauthorizedRedirect,
}: Props) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const { hasPermission, user, role } = usePermissions();

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
    // Use explicit redirect or fall back to the role-appropriate home route
    const redirectTo = unauthorizedRedirect || getHomeRouteForRole(role);

    // Loop guard: if the redirect target is itself blocked (e.g. an unknown role whose
    // home route also fails), navigating would loop forever — show a recovery screen instead.
    const [redirectPath, redirectQuery] = redirectTo.split("?");
    const redirectPermission = getRoutePermission(redirectPath, redirectQuery ? `?${redirectQuery}` : undefined);
    const redirectAlsoBlocked = !!(redirectPermission && !hasPermission(redirectPermission));

    if (redirectAlsoBlocked) {
      return <AccessRecoveryScreen />;
    }

    return (
      <AuthGate>
        <Navigate
          to={redirectTo}
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
