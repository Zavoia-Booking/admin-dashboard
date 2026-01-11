import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { googleLoginAction, googleRegisterAction, linkGoogleByCodeAction } from "../actions";
import { refreshSession } from "../../../shared/lib/http";
import type { RootState } from "../../../app/providers/store";
import { Spinner } from "../../../shared/components/ui/spinner";
import { selectCurrentUser, selectAccountLinkingRequired } from "../selectors";

export default function GoogleOAuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const authError = useSelector((s: RootState) => s.auth.error);
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const businessSelection = useSelector((s: RootState) => s.auth.businessSelectionRequired);
  const isAccountLinkingModalOpen = useSelector((s: RootState) => (s as any).auth.isAccountLinkingModalOpen);
  const accountLinkingRequired = useSelector(selectAccountLinkingRequired);
  const user = useSelector(selectCurrentUser);
  
  // Use sessionStorage to track if we've processed the OAuth code (persists across remounts)
  const hasProcessedCodeRef = useRef(false);

  useEffect(() => {
    // Check both ref and sessionStorage to prevent reprocessing across remounts
    const hasProcessedInSession = sessionStorage.getItem('oauthCodeProcessed') === 'true';
    if (hasProcessedCodeRef.current || hasProcessedInSession) return;

    // Parse query params inside effect to avoid dependency issues
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const error = query.get("error");
    const context = sessionStorage.getItem('oauthContext');
    const fallback = context === 'register' ? '/register' : '/login';

    if (error) {
      navigate(fallback, { replace: true });
      return;
    }

    if (code) {
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
      const mode = sessionStorage.getItem('oauthMode');

      // Mark as processed immediately to prevent double processing
      hasProcessedCodeRef.current = true;
      sessionStorage.setItem('oauthCodeProcessed', 'true');

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
        // Determine context from sessionStorage or default to 'login'
        const oauthContext = context as 'login' | 'register' || 'login';

        if (oauthContext === 'register') {
          dispatch(googleRegisterAction.request({ code, redirectUri }));
        } else {
          dispatch(googleLoginAction.request({ code, redirectUri }));
        }
  
        // Clean the URL (remove query params) without triggering a reroute loop
        if (location.search) {
          window.history.replaceState({}, '', '/auth/callback');
        }
      }
    } else if (!hasProcessedCodeRef.current && !hasProcessedInSession) {
      // Only redirect if we haven't processed a code yet (handles direct navigation to /auth/callback)
      // Check both ref AND sessionStorage to prevent redirects after code processing
      navigate(fallback, { replace: true });
    }
  }, [dispatch, navigate, location.search]);

  useEffect(() => {
    // Don't redirect if business selection or account linking is required (wait for modal)
    if (businessSelection || isAccountLinkingModalOpen) {
      return;
    }
    
    // Only redirect once when authentication completes successfully
    // Also wait for user object to be populated to check wizardCompleted
    if (isAuthenticated && !isLoading && user) {
      const mode = sessionStorage.getItem('oauthMode');

      // Linking flow handles redirect in saga
      if (mode === 'link') return;

      // Prevent multiple redirects by marking as redirected
      const hasRedirected = sessionStorage.getItem('oauthRedirected');
      if (hasRedirected === 'true') return;
      
      sessionStorage.setItem('oauthRedirected', 'true');

      // Clear context and flags after reading them
      try { 
        sessionStorage.removeItem('oauthContext');
        sessionStorage.removeItem('oauthCodeProcessed'); // Clear for next OAuth flow
      } catch {}

      // Redirect based on role and wizard completion status
      // Only business owners need to complete the wizard, team members go straight to dashboard
      if (user.role === 'owner' && !user.wizardCompleted) {
        // New business owner needs to complete setup wizard
        navigate('/welcome', { replace: true });
      } else {
        // Team members or owners with completed wizard go to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, businessSelection, isAccountLinkingModalOpen, user]);

  // Handle authentication errors - redirect back to appropriate page
  useEffect(() => {
    if (authError && !isLoading) {
      const mode = sessionStorage.getItem('oauthMode');
      const context = sessionStorage.getItem('oauthContext');

      // Don't redirect if in linking mode (modal handles it)
      if (mode === 'link') {
        return;
      }

      // Don't redirect if modals are open (they will handle the flow)
      if (authError === 'business_selection_required') {
        return;
      }
      if (isAccountLinkingModalOpen) {
        return;
      }
      // Don't redirect if AccountLinkingRequiredModal is open (handles send email errors)
      if (accountLinkingRequired) {
        return;
      }

      const fallback = context === 'register' ? '/register' : '/login';
      try { sessionStorage.removeItem('oauthContext'); } catch {}

      navigate(fallback, { replace: true });
    }
  }, [authError, isLoading, navigate, isAccountLinkingModalOpen, accountLinkingRequired]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" color="info" />
    </div>
  );
}


