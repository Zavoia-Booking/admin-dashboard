import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { apiClient } from "../../../shared/lib/http";

type AcceptInvitationResponse = {
  message: string;
  businessId: number;
  businessName: string;
};

export default function AcceptTeamInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link. No token provided.');
      return;
    }

    const acceptInvitation = async () => {
      try {
        const { data } = await apiClient().post<AcceptInvitationResponse>(
          '/auth/accept-team-invitation',
          { token }
        );

        setStatus('success');
        setMessage(data.message);
        setBusinessName(data.businessName);
      } catch (error: any) {
        setStatus('error');
        
        let errorMessage = 'Failed to accept invitation. Please try again.';
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

    acceptInvitation();
  }, [searchParams, navigate]);

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
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
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Accepting Invitation...'}
            {status === 'success' && 'Invitation Accepted!'}
            {status === 'error' && 'Invitation Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we process your invitation.'}
            {status === 'success' && `You have been added to ${businessName}`}
            {status === 'error' && 'We encountered an issue processing your invitation.'}
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
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
              >
                Go to Login
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

