import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Spinner } from "../../../shared/components/ui/spinner";
import { apiClient } from "../../../shared/lib/http";
import { setTokensAction, setAuthUserAction } from "../actions";
import type { AuthUser } from "../types";
import { InfoPage } from "../../../shared/components/common/InfoPage";
import { useTranslation } from "react-i18next";

type LinkBusinessAccountResponse = {
  message: string;
  accessToken: string;
  csrfToken: string | null;
  refreshToken?: string | null;
  user: AuthUser;
};

export default function LinkBusinessAccountPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage(t('linkBusiness.errorDescription'));
      return;
    }

    const linkAccount = async () => {
      try {
        const { data } = await apiClient().post<LinkBusinessAccountResponse>(
          '/auth/link-business-account',
          { token }
        );

        dispatch(setTokensAction({ 
          accessToken: data.accessToken, 
          csrfToken: data.csrfToken ?? null,
          refreshToken: data.refreshToken ?? null
        }));
        dispatch(setAuthUserAction({ user: data.user }));

        setStatus('success');
      } catch {
        setStatus('error');
        setErrorMessage(t('linkBusiness.errorDescription'));
      }
    };

    linkAccount();
  }, [searchParams, dispatch, t]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted to-background gap-4">
        <Spinner size="lg" color="info" />
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground-1">{t('linkBusiness.loadingTitle')}</p>
          <p className="text-sm text-foreground-3">{t('linkBusiness.loadingDescription')}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <InfoPage
        title={t('linkBusiness.successTitle')}
        description={`${t('linkBusiness.successDescription')} ${t('linkBusiness.successBody')}`}
        buttons={[
          {
            label: t('linkBusiness.setupBusiness'),
            onClick: () => navigate('/welcome', { replace: true }),
          },
        ]}
      />
    );
  }

  return (
    <InfoPage
      title={t('linkBusiness.errorTitle')}
      description={errorMessage}
      buttons={[
        {
          label: t('linkBusiness.goToLogin'),
          onClick: () => navigate('/login', { replace: true }),
        },
      ]}
    />
  );
}
