import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertCircle, X } from "lucide-react";
import type { RootState } from "../../../app/providers/store";
import { appleLinkSendCodeAction, appleLinkVerifyAction, closeAppleStep } from "../actions";
import CredentialsForm from "../../../shared/components/auth/CredentialsForm";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Spinner } from "../../../shared/components/ui/spinner";
import { cn } from "../../../shared/lib/utils";
import {
  modalScrim,
  modalPanelLarge,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalCancel,
  modalPrimary,
  modalGhost,
} from "../../../shared/components/ui/modal-tokens";

const CODE_PATTERN = /^\d{6}$/;

/** The 6-digit code field; keyed by the parent so each step / new code starts empty. */
function AppleLinkCodeForm({
  sentTo,
  loading,
  finished,
  onSubmit,
  onResend,
}: {
  sentTo: string;
  loading: boolean;
  finished: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
}) {
  const { t } = useTranslation('auth');
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = CODE_PATTERN.test(code);

  return (
    <form
      className="mt-6 space-y-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid && !loading && !finished) onSubmit(code);
      }}
    >
      <p className={cn(modalBody, "mt-0 [&_strong]:font-semibold")}>
        <Trans i18nKey="appleLink.codeSent" t={t} values={{ email: sentTo }} components={{ strong: <strong /> }} />
      </p>
      <Label htmlFor="apple-link-code" className="pt-2 text-[13px] font-medium text-neutral-700 dark:text-foreground-2">
        {t('appleLink.codeLabel')}
      </Label>
      <Input
        id="apple-link-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        value={code}
        placeholder={t('appleLink.codePlaceholder')}
        disabled={loading || finished}
        aria-invalid={touched && !valid}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className={cn(
          "h-11 bg-surface text-base tracking-[0.3em]",
          touched && !valid ? "border-destructive bg-error-bg" : "border-neutral-300",
        )}
      />
      <div className="min-h-5">
        {touched && !valid && (
          <p className="flex items-center gap-1.5 text-[13px] text-destructive" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{t('appleLink.codeInvalid')}</span>
          </p>
        )}
      </div>
      <button type="submit" disabled={loading || finished} className={cn(modalPrimary, "w-full")}>
        {loading ? <Spinner size="sm" color="white" /> : t('appleLink.submit')}
      </button>
      <div className="flex justify-center">
        <button type="button" onClick={onResend} disabled={loading || finished} className={modalGhost}>
          {t('appleLink.resendCode')}
        </button>
      </div>
    </form>
  );
}

/**
 * Sign in with Apple when Apple's email already has a Zavoia account that is
 * not connected to this Apple ID (409 account_exists_unlinked_apple): prove the
 * account is yours with its password, or — for accounts without one — a
 * 6-digit code emailed to it. The verify answer continues like any sign-in.
 */
export default function AppleLinkModal() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const dispatch = useDispatch();
  const step = useSelector((s: RootState) => s.auth.appleLinkStep);
  const loading = useSelector((s: RootState) => !!s.auth.appleStepLoading);
  const stepError = useSelector((s: RootState) => s.auth.appleStepError);

  if (!step) return null;

  const usesPassword = step.proofs.includes('password');
  // Five wrong tries or too many codes end the step: only Cancel is left.
  const finished = stepError?.code === 'apple_step_expired' || stepError?.code === 'apple_code_limit';

  const close = () => dispatch(closeAppleStep());
  const sendCode = () => dispatch(appleLinkSendCodeAction.request());

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open && !loading) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={modalScrim} />
        <DialogPrimitive.Content className={cn(modalPanelLarge, "text-left")}>
          <div className={cn(modalEyebrow, "pr-8")}>{t('appleLink.eyebrow')}</div>
          <DialogPrimitive.Title className={cn(modalTitleCompact, "pr-8")}>
            {t('appleLink.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>
            <p className={cn(modalBody, "mt-3 [&_strong]:font-semibold")}>
              <Trans i18nKey="appleLink.description" t={t} values={{ email: step.email }} components={{ strong: <strong /> }} />
            </p>
          </DialogPrimitive.Description>

          {stepError && (
            <p
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-error-bg px-3 py-2.5 text-[13px] text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{stepError.message}</span>
            </p>
          )}

          {usesPassword ? (
            <CredentialsForm
              className="mt-6"
              onSubmit={({ password }) => {
                if (!finished) dispatch(appleLinkVerifyAction.request({ password }));
              }}
              defaultEmail={step.email}
              emailReadOnly
              autoFocusField="password"
              submitLabel={t('appleLink.submit')}
              isLoading={loading || finished}
            />
          ) : step.codeSentTo ? (
            <AppleLinkCodeForm
              key={`${step.txId}:${step.codeSentTo}`}
              sentTo={step.codeSentTo}
              loading={loading}
              finished={finished}
              onSubmit={(code) => dispatch(appleLinkVerifyAction.request({ code }))}
              onResend={sendCode}
            />
          ) : (
            <div className="mt-6 space-y-4">
              <p className={cn(modalBody, "mt-0 [&_strong]:font-semibold")}>
                <Trans i18nKey="appleLink.codeIntro" t={t} values={{ email: step.email }} components={{ strong: <strong /> }} />
              </p>
              <button type="button" onClick={sendCode} disabled={loading || finished} className={cn(modalPrimary, "w-full")}>
                {loading ? <Spinner size="sm" color="white" /> : t('appleLink.sendCode')}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={close}
            disabled={loading}
            className={cn(modalCancel, "mt-3 w-full")}
          >
            {t('appleLink.cancel')}
          </button>

          {/* Rendered last so a content control is focused first; kept top-right via absolute. */}
          <button
            type="button"
            onClick={close}
            disabled={loading}
            aria-label={tc('aria.close')}
            className={cn(
              "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg",
              "text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800",
              "dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
              "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
