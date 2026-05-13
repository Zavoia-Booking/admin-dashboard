import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useController } from 'react-hook-form';
import { UserPlus, Mail, Phone, AlertCircle, UserCircle, UserRound, ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Spinner } from '../../../shared/components/ui/spinner';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import {
  emailError,
  isE164,
  sanitizePhoneToE164Draft,
} from '../../../shared/utils/validation';

export interface QuickCreateCustomerPayload {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface QuickCreateCustomerFormProps {
  onSubmit: (payload: QuickCreateCustomerPayload) => void | Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

const defaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

type FormValues = typeof defaultValues;

const QuickCreateCustomerForm: React.FC<QuickCreateCustomerFormProps> = ({
  onSubmit,
  onBack,
  loading = false,
}) => {
  const { t } = useTranslation('calendar');
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
  });

  const { field: firstNameField, fieldState: firstNameState } = useController<
    FormValues,
    'firstName'
  >({
    name: 'firstName',
    control,
    rules: {
      validate: (value) => {
        const v = (value ?? '').trim();
        if (!v) return t('page.appointments.customer.quickCreate.firstNameRequired');
        if (v.length < 2) return t('page.appointments.customer.quickCreate.firstNameMin');
        if (v.length > 50) return t('page.appointments.customer.quickCreate.firstNameMax');
        return true;
      },
    },
  });

  const { field: lastNameField, fieldState: lastNameState } = useController<
    FormValues,
    'lastName'
  >({
    name: 'lastName',
    control,
    rules: {
      maxLength: { value: 50, message: t('page.appointments.customer.quickCreate.lastNameMax') },
      validate: (value) => {
        const v = (value ?? '').trim();
        if (!v) return true;
        if (v.length === 1) return t('page.appointments.customer.quickCreate.lastNameMin');
        return true;
      },
    },
  });

  const { field: emailField, fieldState: emailState } = useController<FormValues, 'email'>({
    name: 'email',
    control,
    rules: {
      validate: (value) => {
        if (!value || value.trim().length === 0) return true;
        const error = emailError(value, t);
        return error === null ? true : error;
      },
    },
  });

  const { field: phoneField, fieldState: phoneState } = useController<FormValues, 'phone'>({
    name: 'phone',
    control,
    rules: {
      validate: {
        format: (value) =>
          !value ||
          value.trim().length === 0 ||
          isE164(value) ||
          t('page.appointments.customer.quickCreate.validPhone'),
      },
    },
  });

  const onFormSubmit = handleSubmit((data) => {
    onSubmit({
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
    });
  });

  return (
    <div className="rounded-lg border border-info-300 bg-info-100 p-4 mt-4 dark:bg-surface-hover/30 dark:border-border-strong space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-foreground-1">
        <UserPlus className="h-4 w-4" />
        {t("page.appointments.customer.quickCreate.title")}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="quick-create-firstName" className="text-base font-medium">
            {t("page.appointments.customer.quickCreate.firstName")}
          </Label>
          <div className="relative">
            <Input
              id="quick-create-firstName"
              type="text"
              placeholder={t("page.appointments.customer.quickCreate.firstNamePlaceholder")}
              value={firstNameField.value || ''}
              onChange={(e) => firstNameField.onChange(e.target.value)}
              maxLength={50}
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                firstNameState.error
                  ? 'border-destructive bg-error-bg focus-visible:ring-0'
                  : 'border-border-strong hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`}
              aria-invalid={!!firstNameState.error}
            />
            <UserCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
          <div className="h-5">
            {firstNameState.error && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{firstNameState.error.message}</span>
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-create-lastName" className="text-base font-medium">
            {t("page.appointments.customer.quickCreate.lastName")}
          </Label>
          <div className="relative">
            <Input
              id="quick-create-lastName"
              type="text"
              placeholder={t("page.appointments.customer.quickCreate.lastNamePlaceholder")}
              value={lastNameField.value || ''}
              onChange={(e) => lastNameField.onChange(e.target.value)}
              maxLength={50}
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                lastNameState.error
                  ? 'border-destructive bg-error-bg focus-visible:ring-0'
                  : 'border-border-strong hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`}
              aria-invalid={!!lastNameState.error}
            />
            <UserRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
          <div className="h-5">
            {lastNameState.error && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{lastNameState.error.message}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quick-create-email" className="text-base font-medium">
          {t("page.appointments.customer.quickCreate.email")}
        </Label>
        <div className="relative">
          <Input
            id="quick-create-email"
            type="email"
            placeholder={t("page.appointments.customer.quickCreate.emailPlaceholder")}
            value={emailField.value || ''}
            onChange={(e) => emailField.onChange(e.target.value)}
            className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
              emailState.error
                ? 'border-destructive bg-error-bg focus-visible:ring-0'
                : 'border-border-strong hover:border-border-strong focus:border-focus focus-visible:ring-focus'
            }`}
            autoComplete="email"
            aria-invalid={!!emailState.error}
          />
          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        </div>
        <div className="h-5">
          {emailState.error && (
            <p
              className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{emailState.error.message}</span>
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quick-create-phone" className="text-base font-medium">
          {t("page.appointments.customer.quickCreate.phone")}
        </Label>
        <div className="relative">
          <Input
            id="quick-create-phone"
            type="tel"
            placeholder={t("page.appointments.customer.quickCreate.phonePlaceholder")}
            value={phoneField.value || ''}
            onChange={(e) => {
              const sanitized = sanitizePhoneToE164Draft(e.target.value || '');
              phoneField.onChange(sanitized);
            }}
            className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
              phoneState.error
                ? 'border-destructive bg-error-bg focus-visible:ring-0'
                : 'border-border-strong hover:border-border-strong focus:border-focus focus-visible:ring-focus'
            }`}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={!!phoneState.error}
          />
          <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        </div>
        <div className="h-5">
          {phoneState.error && (
            <p
              className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{phoneState.error.message}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          rounded="full"
          onClick={onBack}
          className="gap-2 h-11 cursor-pointer w-32 md:w-42"
          disabled={loading}
        >
          {t("page.appointments.back")}
        </Button>
        <Button
          type="button"
          rounded="full"
          onClick={onFormSubmit}
          disabled={!isValid || loading}
          className="group gap-2 h-11 cursor-pointer w-72"
        >
          {loading ? (
            <Spinner size="sm" color="white" />
          ) : (
            <>
              {t("page.appointments.customer.quickCreate.create")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuickCreateCustomerForm;
