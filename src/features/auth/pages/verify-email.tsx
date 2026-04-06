import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import axios from 'axios';
import config from '../../../app/config/env';

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
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorCode, setErrorCode] = useState<string>('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorCode('noToken');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.get<VerifyEmailResponse>(`${config.API_URL}/auth/verify-email`, {
          params: { token }
        });

        if (response.data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          // Map API error codes to translation keys
          if (response.data.message?.includes('already')) {
            setErrorCode('alreadyVerified');
          } else if (response.data.message?.includes('invalid') || response.data.message?.includes('expired')) {
            setErrorCode('invalidToken');
          } else {
            setErrorCode('generic');
          }
        }
      } catch (err: any) {
        setStatus('error');
        const message = err?.response?.data?.message || err?.message || '';

        if (message.includes('invalid') || message.includes('expired')) {
          setErrorCode('invalidToken');
        } else if (message.includes('already')) {
          setErrorCode('alreadyVerified');
        } else {
          setErrorCode('generic');
        }
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-lg shadow-xl border-0">
        <div className="p-8 sm:p-12">
          {status === 'loading' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg"></div>
                  <Loader2 className="relative h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('verifyEmail.loading.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  {t('verifyEmail.loading.description')}
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg"></div>
                  <CheckCircle2 className="relative h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('verifyEmail.success.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  {t('verifyEmail.success.description')}
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full py-3 text-base font-semibold"
                >
                  {t('verifyEmail.success.button')}
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"></div>
                  <AlertCircle className="relative h-16 w-16 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('verifyEmail.error.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  {t(`verifyEmail.error.${errorCode}`)}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    If you didn't receive a verification email, check your spam folder or try signing up again.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleGoToDashboard}
                  variant="outline"
                  className="w-full py-3 text-base font-semibold"
                >
                  {t('verifyEmail.error.button')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
