import { type ReactElement } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../selectors";
import AuthGate from "./AuthGate";
import { Navigate, useLocation } from "react-router-dom";

type Props = { element: ReactElement };

export default function ProtectedRoute({ element }: Props) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const location = useLocation();

  return (
    <AuthGate>
      {isAuthed ? element : (() => {
        try {
          const currentPath = location.pathname + (location.search || "");
          const isAuthRoute = currentPath.startsWith('/login') || currentPath.startsWith('/register') || currentPath.startsWith('/auth/callback');
          if (!isAuthRoute) {
            localStorage.setItem('authRedirect', currentPath);
          }
        } catch {}
        return <Navigate to="/login" replace state={{ from: location }} />;
      })()}
    </AuthGate>
  );
}
