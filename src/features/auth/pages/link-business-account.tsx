import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { Spinner } from "../../../shared/components/ui/spinner";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { GoogleSignInButton } from "../../../shared/components/auth/GoogleSignInButton";
import { validateBusinessLinkTokenApi, completeBusinessLinkApi } from "../api";
import { setTokensAction, setAuthUserAction } from "../actions";
import type { BusinessLinkTokenValidation } from "../types";
import { useTranslation, Trans } from "react-i18next";
import { cn } from "../../../shared/lib/utils";
import {
  modalBody,
  modalEyebrow,
  modalPanel,
  modalPrimary,
  modalTitleCompact,
} from "../../../shared/components/ui/modal-tokens";

type FormValues = {
  password: string;
};

type Status =
  | { kind: 'validating' }
  | { kind: 'confirm'; info: BusinessLinkTokenValidation }
  | { kind: 'success' }
  | { kind: 'error' };

/** Page backdrop — every state renders the same panel on it so the surface stays
 * put and only its contents swap between steps. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-6 dark:bg-background sm:px-6">
      {children}
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="link-business-account-title"
      className={cn(
        modalPanel,
        "relative inset-auto left-auto top-auto mx-auto -translate-x-0 -translate-y-0",
      )}
    >
      {children}
    </section>
  );
}

function Eyebrow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className={cn(modalEyebrow, "mb-5 flex items-center gap-2")}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

function LinkBusinessSuccessCard({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation('auth');
  return (
    <Panel>
      <Eyebrow icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}>
        {t('linkBusiness.securityEyebrow')}
      </Eyebrow>
      <h1 id="link-business-account-title" className={modalTitleCompact}>
        {t('linkBusiness.successTitle')}
      </h1>
      <p className={cn(modalBody, "mt-3")}>
        {`${t('linkBusiness.successDescription')} ${t('linkBusiness.successBody')}`}
      </p>
      <footer className="mt-7 border-t border-neutral-200 pt-5 dark:border-border-subtle">
        <Button
          className={cn(modalPrimary, "h-auto w-full")}
          rounded="full"
          type="button"
          onClick={onContinue}
        >
          <span>{t('linkBusiness.setupBusiness')}</span>
        </Button>
      </footer>
    </Panel>
  );
}

function LinkBusinessConfirmCard({
  info,
  submitting,
  submitError,
  onSubmit,
}: {
  info: BusinessLinkTokenValidation;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
}) {
  const { t } = useTranslation('auth');
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { password: '' },
  });

  return (
    <Panel>
      <header className="text-left">
        <Eyebrow icon={<Lock className="h-3.5 w-3.5" aria-hidden="true" />}>
          {t('linkBusiness.securityEyebrow')}
        </Eyebrow>
        <h1 id="link-business-account-title" className={modalTitleCompact}>
          {t('linkBusiness.confirmTitle')}
        </h1>
        <div className={cn(modalBody, "mt-3")}>
          <Trans
            i18nKey={info.hasPassword ? 'linkBusiness.confirmDescription' : 'linkBusiness.googleOnlyDescription'}
            t={t}
            values={{ email: info.email }}
            components={{ strong: <strong /> }}
          />
        </div>
      </header>
      {info.hasPassword ? (
        <form className="mt-7" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-neutral-700 dark:text-foreground-2">
              {t('linkBusiness.passwordLabel')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t('linkBusiness.passwordPlaceholder')}
              disabled={submitting}
              aria-invalid={!!errors.password}
              autoComplete="current-password"
              autoFocus
              className={cn(
                "h-11 bg-surface text-sm",
                errors.password
                  ? 'border-destructive bg-error-bg focus-visible:ring-error'
                  : 'border-neutral-300 hover:border-neutral-400 focus-visible:border-focus',
              )}
              {...register('password', {
                required: t('linkBusiness.passwordRequired'),
              })}
            />
            <div className="min-h-5">
              {errors.password && (
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{String(errors.password.message)}</span>
                </p>
              )}
            </div>
          </div>
          {submitError && (
            <p
              className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-error-bg px-3 py-2.5 text-[13px] text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </p>
          )}
          <footer className="mt-7 border-t border-neutral-200 pt-5 dark:border-border-subtle">
            <Button
              className={cn(modalPrimary, "h-auto w-full")}
              rounded="full"
              type="submit"
              disabled={submitting}
            >
              {submitting ? <Spinner size="sm" color="white" /> : <span>{t('linkBusiness.confirmSubmit')}</span>}
            </Button>
            {info.googleLinked && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-neutral-200 dark:bg-border-subtle" />
                  <span className="text-[12px] text-neutral-500 dark:text-foreground-3">{t('linkBusiness.or')}</span>
                  <div className="h-px flex-1 bg-neutral-200 dark:bg-border-subtle" />
                </div>
                <GoogleSignInButton context="register" disabled={submitting} className="h-11 rounded-full text-sm" />
              </div>
            )}
          </footer>
        </form>
      ) : (
        <div className="mt-7 border-t border-neutral-200 pt-5 dark:border-border-subtle">
          <GoogleSignInButton context="register" className="h-11 rounded-full text-sm" />
        </div>
      )}
    </Panel>
  );
}

export default function LinkBusinessAccountPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<Status>(
    () => (searchParams.get('token') ? { kind: 'validating' } : { kind: 'error' }),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;

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
      <Shell>
        <Panel>
          <Eyebrow icon={<Lock className="h-3.5 w-3.5" aria-hidden="true" />}>
            {t('linkBusiness.securityEyebrow')}
          </Eyebrow>
          <h1 id="link-business-account-title" className={modalTitleCompact}>
            {t('linkBusiness.checkingTitle')}
          </h1>
          <p className={cn(modalBody, "mt-3")}>{t('linkBusiness.checkingDescription')}</p>
          <div className="mt-8 flex justify-center">
            <Spinner size="lg" />
          </div>
        </Panel>
      </Shell>
    );
  }

  if (status.kind === 'success') {
    return (
      <Shell>
        <LinkBusinessSuccessCard onContinue={() => navigate('/welcome', { replace: true })} />
      </Shell>
    );
  }

  if (status.kind === 'error') {
    return (
      <Shell>
        <Panel>
          <Eyebrow icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}>
            {t('linkBusiness.securityEyebrow')}
          </Eyebrow>
          <h1 id="link-business-account-title" className={modalTitleCompact}>
            {t('linkBusiness.errorTitle')}
          </h1>
          <p className={cn(modalBody, "mt-3")}>{t('linkBusiness.errorDescription')}</p>
          <footer className="mt-7 border-t border-neutral-200 pt-5 dark:border-border-subtle">
            <Button
              className={cn(modalPrimary, "h-auto w-full")}
              rounded="full"
              type="button"
              onClick={() => navigate('/login', { replace: true })}
            >
              <span>{t('linkBusiness.goToLogin')}</span>
            </Button>
          </footer>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell>
      <LinkBusinessConfirmCard
        info={status.info}
        submitting={submitting}
        submitError={submitError}
        onSubmit={onSubmit}
      />
    </Shell>
  );
}
