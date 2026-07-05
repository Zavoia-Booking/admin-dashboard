import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { AlertCircle, Lock } from "lucide-react";
import { Spinner } from "../../../shared/components/ui/spinner";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { GoogleSignInButton } from "../../../shared/components/auth/GoogleSignInButton";
import { validateBusinessLinkTokenApi, completeBusinessLinkApi } from "../api";
import { setTokensAction, setAuthUserAction } from "../actions";
import type { BusinessLinkTokenValidation } from "../types";
import { InfoPage } from "../../../shared/components/common/InfoPage";
import { useTranslation, Trans } from "react-i18next";

type FormValues = {
  password: string;
};

type Status =
  | { kind: 'validating' }
  | { kind: 'confirm'; info: BusinessLinkTokenValidation }
  | { kind: 'success' }
  | { kind: 'error' };

export default function LinkBusinessAccountPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<Status>({ kind: 'validating' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (!token) {
      setStatus({ kind: 'error' });
      return;
    }

    let cancelled = false;
    validateBusinessLinkTokenApi(token)
      .then((info) => { if (!cancelled) setStatus({ kind: 'confirm', info }); })
      .catch(() => { if (!cancelled) setStatus({ kind: 'error' }); });
    return () => { cancelled = true; };
  }, [token]);

  const onSubmit = async (values: FormValues) => {
    if (!token) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const data = await completeBusinessLinkApi({ token, password: values.password });
      dispatch(setTokensAction({
        accessToken: data.accessToken,
        csrfToken: data.csrfToken ?? null,
        refreshToken: data.refreshToken ?? null,
      }));
      dispatch(setAuthUserAction({ user: data.user }));
      setStatus({ kind: 'success' });
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      const code = err?.response?.data?.code;
      if (httpStatus === 401) {
        setSubmitError(t('linkBusiness.wrongPassword'));
      } else if (code === 'google_login_required' && status.kind === 'confirm') {
        // Passwordless (Google-only) account - only the Google path can confirm it.
        setStatus({ kind: 'confirm', info: { ...status.info, hasPassword: false, googleLinked: true } });
      } else {
        setStatus({ kind: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status.kind === 'validating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted to-background gap-4">
        <Spinner size="lg" color="info" />
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground-1">{t('linkBusiness.checkingTitle')}</p>
          <p className="text-sm text-foreground-3">{t('linkBusiness.checkingDescription')}</p>
        </div>
      </div>
    );
  }

  if (status.kind === 'success') {
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

  if (status.kind === 'error') {
    return (
      <InfoPage
        title={t('linkBusiness.errorTitle')}
        description={t('linkBusiness.errorDescription')}
        buttons={[
          {
            label: t('linkBusiness.goToLogin'),
            onClick: () => navigate('/login', { replace: true }),
          },
        ]}
      />
    );
  }

  const { info } = status;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted to-background px-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="space-y-2 px-6 py-6 md:px-8 md:py-8 items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl text-center">{t('linkBusiness.confirmTitle')}</CardTitle>
          <CardDescription className="text-center text-sm">
            <Trans
              i18nKey={info.hasPassword ? 'linkBusiness.confirmDescription' : 'linkBusiness.googleOnlyDescription'}
              t={t}
              values={{ email: info.email }}
              components={{ strong: <strong /> }}
            />
          </CardDescription>
        </CardHeader>
        {info.hasPassword ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="flex flex-col gap-3 px-6 md:px-8">
              <div className="space-y-2">
                <label htmlFor="password" className="text-base font-medium text-foreground-1">
                  {t('linkBusiness.passwordLabel')}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('linkBusiness.passwordPlaceholder')}
                  disabled={submitting}
                  aria-invalid={!!errors.password}
                  autoComplete="current-password"
                  className={`transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                    errors.password
                      ? 'border-destructive bg-error-bg focus-visible:ring-error'
                      : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                  }`}
                  {...register('password', {
                    required: t('linkBusiness.passwordRequired'),
                  })}
                />
                <div className="h-5">
                  {errors.password && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{String(errors.password.message)}</span>
                    </p>
                  )}
                </div>
              </div>
              {submitError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-4 w-4" />
                  <span>{submitError}</span>
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2 px-6 md:px-8 pb-6 md:pb-8">
              <Button
                className="w-full h-10 md:h-12"
                rounded="full"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <Spinner size="sm" color="info" />
                    <span>{t('linkBusiness.confirming')}</span>
                  </div>
                ) : (
                  t('linkBusiness.confirmSubmit')
                )}
              </Button>
              {info.googleLinked && (
                <>
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-foreground-3">{t('linkBusiness.or')}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <GoogleSignInButton context="register" disabled={submitting} />
                </>
              )}
            </CardFooter>
          </form>
        ) : (
          <CardFooter className="flex flex-col gap-3 pt-2 px-6 md:px-8 pb-6 md:pb-8">
            <GoogleSignInButton context="register" />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
