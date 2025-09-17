import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { googleAuthAction, linkGoogleByCodeAction } from "../actions";
import { refreshSession } from "../../../shared/lib/http";
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
      const mode = sessionStorage.getItem('oauthMode');

      if (mode === 'link') {
        // Dedup: process each Google code only once
        const lastCode = sessionStorage.getItem('oauthLastCode');
        if (lastCode === code) {
          return;
        }
        sessionStorage.setItem('oauthLastCode', code);
        // Ensure access token exists after redirect (Redux lost memory on reload)
        (async () => {
          try { await refreshSession(); } catch {}
          dispatch(linkGoogleByCodeAction.request({ code, redirectUri }));
          // For linking, clean URL but stay on callback page to avoid register page flash
          if (location.search) {
            window.history.replaceState({}, '', '/auth/callback');
          }
        })();
      } else {
        dispatch(googleAuthAction.request({ code, redirectUri }));
        // Clean the URL (remove query params) to avoid double-dispatch on reload
        if (location.search) {
          navigate("/auth/callback", { replace: true });
        }
      }
    } else {
      // No code present; send back to register
      navigate("/register", { replace: true });
    }
  }, [dispatch, navigate, location.search, query]);

  useEffect(() => {
    if (isAuthenticated) {
      const mode = sessionStorage.getItem('oauthMode');
      // Only redirect for register flow; linking flow handles its own redirect in saga
      if (mode !== 'link') {
        navigate("/welcome", { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" color="info" />
    </div>
  );
}


