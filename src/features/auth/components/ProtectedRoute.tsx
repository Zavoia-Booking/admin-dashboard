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
      {isAuthed ? element : 
        <Navigate to="/login" replace state={{ from: location }} />
      }
    </AuthGate>
  );
}
