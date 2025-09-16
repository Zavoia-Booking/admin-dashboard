import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { googleAuthAction } from "../actions";
import type { RootState } from "../../../app/providers/store";
import { Spinner } from "../../../shared/components/ui/spinner";

function useQuery(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export default function GoogleOAuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

  useEffect(() => {
    const code = query.get("code");
    const error = query.get("error");

    if (error) {
      navigate("/register", { replace: true });
      return;
    }

    if (code) {
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

      dispatch(
        googleAuthAction.request({
          code,
          redirectUri,
        })
      );

      // Clean the URL (remove query params) to avoid double-dispatch on reload
      if (location.search) {
        navigate("/auth/callback", { replace: true });
      }
    } else {
      // No code present; send back to register
      navigate("/register", { replace: true });
    }
  }, [dispatch, navigate, location.search, query]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" color="info" />
    </div>
  );
}


