import { type ReactElement } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectAuthStatus, selectCurrentUser } from "../selectors";
import AuthGate from "./AuthGate";
import { Navigate, useLocation } from "react-router-dom";
import { AuthStatusEnum } from "../types";

type Props = { element: ReactElement };

export default function ProtectedRoute({ element }: Props) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const requiresWizard = isAuthed && user?.role === "owner" && user?.wizardCompleted === false;

  return (
    <AuthGate>
      {isAuthed ? (
        requiresWizard && location.pathname !== "/dashboard" ? (
          <Navigate to="/dashboard" replace />
        ) : (
          element
        )
      ) : status === AuthStatusEnum.AUTHENTICATED ? (
        <Navigate to="/login" replace state={{ from: location }} />
      ) : (
        // if unauthenticated after hydration (status === "unauthenticated"), redirect
        <Navigate to="/login" replace state={{ from: location }} />
      )}
    </AuthGate>
  );
}
