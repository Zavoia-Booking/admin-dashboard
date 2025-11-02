import { type ReactElement } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { selectAuthIsRegistration, selectIsAuthenticated } from "../selectors";
import AuthGate from "./AuthGate";

type Props = { element: ReactElement };

/**
 * PublicRoute protects authentication pages (login, register) from authenticated users.
 * Uses AuthGate to ensure session is hydrated before checking authentication status.
 * If user is already authenticated, redirect them to /dashboard instead.
 */
export default function PublicRoute({ element }: Props) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const isRegistration = useSelector(selectAuthIsRegistration);
  const location = useLocation();

  return (
    <AuthGate>
      {isAuthed ? 
        isRegistration ?
          <Navigate to="/welcome" replace state={{ from: location }} />
          :
          <Navigate to="/dashboard" replace state={{ from: location }} />
        : element
      }
    </AuthGate>
  );
}

