import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import axios from 'axios';

interface VerifyEmailResponse {
  message: string;
  success: boolean;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
        const response = await axios.get<VerifyEmailResponse>(`${API_BASE_URL}/auth/verify-email`, {
          params: { token }
        });

        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
        } else {
          setStatus('error');
          setError(response.data.message || 'Email verification failed');
        }
      } catch (err: any) {
        setStatus('error');
        setError(err?.response?.data?.message || err?.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Verifying your email...
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleGoToLogin}
                  className="w-full"
                >
                  Go back to the application
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {error}
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleGoToLogin}
                  variant="outline"
                  className="w-full"
                >
                  Go back to the application
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
