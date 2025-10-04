import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import { closeAccountLinkingModal, reauthForLinkAction } from "../actions";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 px-6 py-4 md:px-8 md:py-6">
          <CardTitle className="text-xl md:text-2xl text-center">Link Google to your account</CardTitle>
          <CardDescription className="text-center text-sm">
            To finish connecting Google, please confirm your account password. This helps keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-6 md:px-8">
          <CredentialsForm
            onSubmit={({ email, password }) => {
              dispatch(reauthForLinkAction.request({ email, password }));
            }}
            submitLabel="Link account"
            isLoading={!!isLinking}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0 md:pt-6 px-6 md:px-8 pb-4 md:pb-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            disabled={!!isLinking}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


