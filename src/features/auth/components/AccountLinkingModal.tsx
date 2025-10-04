import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import { closeAccountLinkingModal, reauthForLinkAction } from "../actions";
import { Button } from "../../../shared/components/ui/button";
import CredentialsForm from "../../../shared/components/auth/CredentialsForm";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";

export default function AccountLinkingModal() {
  const dispatch = useDispatch();
  const open = useSelector((s: RootState) => (s as any).auth.isAccountLinkingModalOpen);
  const isLinking = useSelector((s: RootState) => (s as any).auth.linkingLoading) as boolean | undefined;
  const navigate = useNavigate();
  const location = useLocation();

  const handleCancel = useCallback(() => {
    dispatch(closeAccountLinkingModal());
    let returnTo: string | null = null;
    let context: string | null = null;
    try {
      returnTo = sessionStorage.getItem('oauthReturnTo');
      context = sessionStorage.getItem('oauthContext');
      sessionStorage.removeItem('oauthMode');
      sessionStorage.removeItem('oauthReturnTo');
      sessionStorage.removeItem('oauthLastCode');
      sessionStorage.removeItem('linkContext');
      sessionStorage.removeItem('oauthContext');
    } catch {}
    if (location.pathname === '/auth/callback') {
      const fallback = returnTo || (context === 'register' ? '/register' : '/login');
      navigate(fallback, { replace: true });
    }
  }, [dispatch, location.pathname, navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Link Google to your account</h2>
        <p className="text-sm text-gray-600 mb-4">
          To finish connecting Google, please confirm your account password. This helps us keep your account secure.
        </p>
        <div className="flex flex-col gap-3">
          <CredentialsForm
            onSubmit={({ email, password }) => {
              dispatch(reauthForLinkAction.request({ email, password }));
            }}
            submitLabel="Link account"
            isLoading={!!isLinking}
          />
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}


