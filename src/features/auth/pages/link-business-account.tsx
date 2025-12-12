import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { CheckCircle2, XCircle, AlertCircle, Link as LinkIcon } from "lucide-react";
import { apiClient } from "../../../shared/lib/http";
import { setTokensAction, setAuthUserAction } from "../actions";
import type { AuthUser } from "../types";

type LinkBusinessAccountResponse = {
  message: string;
  accessToken: string;
  csrfToken: string | null;
  refreshToken?: string | null; // For native apps
  user: AuthUser;
};

export default function LinkBusinessAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid link. No token provided.');
      return;
    }

    const linkAccount = async () => {
      try {
        const { data } = await apiClient().post<LinkBusinessAccountResponse>(
          '/auth/link-business-account',
          { token }
        );

        // Auto-login the user with the returned tokens + refresh token for native apps
        dispatch(setTokensAction({ 
          accessToken: data.accessToken, 
          csrfToken: data.csrfToken ?? null,
          refreshToken: data.refreshToken ?? null
        }));
        dispatch(setAuthUserAction({ user: data.user }));

        setStatus('success');
        setMessage(data.message || 'Your accounts have been successfully linked!');
      } catch (error: any) {
        setStatus('error');
        
        let errorMessage = 'Failed to link accounts. Please try again.';
        if (error?.response?.data?.message) {
          const backendMessage = error.response.data.message;
          errorMessage = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        setMessage(errorMessage);
      }
    };

    linkAccount();
  }, [searchParams, dispatch]);

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  const handleSetupBusiness = () => {
    navigate('/welcome', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Spinner size="lg" color="info" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
                <LinkIcon className="h-6 w-6" />
                Linking Accounts...
              </>
            )}
            {status === 'success' && 'Accounts Linked!'}
            {status === 'error' && 'Linking Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we link your accounts.'}
            {status === 'success' && 'Welcome to your business owner account!'}
            {status === 'error' && 'We encountered an issue linking your accounts.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              status === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {status === 'error' && <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              <p className="text-sm">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Your accounts are now connected. Let's set up your business profile.
              </p>
              <Button 
                onClick={handleSetupBusiness} 
                className="w-full"
              >
                Set up my business
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
                variant="default"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

