import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertCircle, User, X } from "lucide-react";
import type { RootState } from "../../../app/providers/store";
import { appleProfileAction, closeAppleStep } from "../actions";
import { Input } from "../../../shared/components/ui/input";
import { Spinner } from "../../../shared/components/ui/spinner";
import { cn } from "../../../shared/lib/utils";
import { personNameRules, sanitizeName } from "../../../shared/utils/validation";
import {
  modalScrim,
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
} from "../../../shared/components/ui/modal-tokens";

type FormValues = { firstName: string; lastName: string };

/**
 * Sign in with Apple, new owner whose Apple ID shared no usable name
 * (409 apple_profile_required): ask for it, with the register form's rules,
 * then POST /auth/apple/profile.
 */
export default function AppleProfileModal() {
  const { t, i18n } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const dispatch = useDispatch();
  const step = useSelector((s: RootState) => s.auth.appleProfileStep);
  const loading = useSelector((s: RootState) => !!s.auth.appleStepLoading);
  const stepError = useSelector((s: RootState) => s.auth.appleStepError);
  const expired = stepError?.code === 'apple_step_expired';

  const { register, handleSubmit, setValue, reset, trigger, formState: { errors, isValid } } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { firstName: '', lastName: '' },
  });
  const firstNameField = register('firstName', personNameRules('firstName', t));
  const lastNameField = register('lastName', personNameRules('lastName', t));

  // A new step starts with an empty form.
  useEffect(() => {
    if (step?.txId) reset({ firstName: '', lastName: '' });
  }, [step?.txId, reset]);

  // Re-resolve visible validation messages after a language switch.
  useEffect(() => {
    const fields = Object.keys(errors) as (keyof FormValues)[];
    if (fields.length > 0) trigger(fields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  if (!step) return null;

  const close = () => dispatch(closeAppleStep());
  const onSubmit = (values: FormValues) => {
    dispatch(appleProfileAction.request({ firstName: values.firstName.trim(), lastName: values.lastName.trim() }));
  };

  const fieldClass = (hasError: boolean) => cn(
    "!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0",
    hasError
      ? "border-destructive bg-error-bg focus-visible:ring-error"
      : "border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus",
  );

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open && !loading) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={modalScrim} />
        <DialogPrimitive.Content className={cn(modalPanel, "text-left")}>
          <div className={cn(modalEyebrow, "pr-8")}>{t('appleProfile.eyebrow')}</div>
          <DialogPrimitive.Title className={cn(modalTitleCompact, "pr-8")}>
            {t('appleProfile.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>
            <p className={cn(modalBody, "mt-3")}>{t('appleProfile.description')}</p>
          </DialogPrimitive.Description>

          {stepError && (
            <p
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-error-bg px-3 py-2.5 text-[13px] text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{expired ? t('appleProfile.errors.expired') : stepError.message}</span>
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-3">
            <div className="space-y-2">
              <label htmlFor="apple-firstName" className="text-sm font-medium text-foreground-1">
                {t('register.firstName')}
              </label>
              <div className="relative">
                <Input
                  id="apple-firstName"
                  placeholder={t('register.firstNamePlaceholder')}
                  autoComplete="given-name"
                  disabled={loading || expired}
                  aria-invalid={!!errors.firstName}
                  className={fieldClass(!!errors.firstName)}
                  {...firstNameField}
                  onChange={(e) => setValue('firstName', sanitizeName(e.target.value), { shouldValidate: true, shouldDirty: true })}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
              <div className="min-h-5">
                {errors.firstName && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{String(errors.firstName.message)}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="apple-lastName" className="text-sm font-medium text-foreground-1">
                {t('register.lastName')}
              </label>
              <div className="relative">
                <Input
                  id="apple-lastName"
                  placeholder={t('register.lastNamePlaceholder')}
                  autoComplete="family-name"
                  disabled={loading || expired}
                  aria-invalid={!!errors.lastName}
                  className={fieldClass(!!errors.lastName)}
                  {...lastNameField}
                  onChange={(e) => setValue('lastName', sanitizeName(e.target.value), { shouldValidate: true, shouldDirty: true })}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
              <div className="min-h-5">
                {errors.lastName && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{String(errors.lastName.message)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className={cn("mt-4", modalFooterRowRight)}>
              <button type="button" onClick={close} disabled={loading} className={modalCancel}>
                {t('appleProfile.cancel')}
              </button>
              <button type="submit" disabled={loading || expired || !isValid} className={modalPrimary}>
                {loading ? <Spinner size="sm" color="white" /> : t('appleProfile.submit')}
              </button>
            </div>
          </form>

          {/* Rendered last so the first field is focused first; kept top-right via absolute. */}
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
