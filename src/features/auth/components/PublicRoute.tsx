import { type ReactElement } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { selectAuthIsRegistration, selectIsAuthenticated, selectAccountStatusPrompt, selectCurrentUser } from "../selectors";
import { getHomeRouteForRole } from "../../../shared/lib/permissions";
import AuthGate from "./AuthGate";

type Props = { element: ReactElement };

/**
 * PublicRoute protects authentication pages (login, register) from authenticated users.
 * Uses AuthGate to ensure session is hydrated before checking authentication status.
 * If user is already authenticated, redirect them to their role-appropriate home route.
 */
export default function PublicRoute({ element }: Props) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const isRegistration = useSelector(selectAuthIsRegistration);
  const accountStatusPrompt = useSelector(selectAccountStatusPrompt);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // Don't redirect away from the login/register page while the account status prompt dialog is active
  // (tokens are set for API calls but the user hasn't completed the prompt yet)
  const shouldRedirect = isAuthed && !accountStatusPrompt;

  // Use role-appropriate home route (e.g. /my-profile for dashboard_user, /dashboard for owner/team_member)
  const homeRoute = getHomeRouteForRole(user?.role);

  return (
    <AuthGate>
      {shouldRedirect ? 
        isRegistration ?
          <Navigate to="/welcome" replace state={{ from: location }} />
          :
          <Navigate to={homeRoute} replace state={{ from: location }} />
        : element
      }
    </AuthGate>
  );
}

