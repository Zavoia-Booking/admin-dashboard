import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Mail, Phone, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { InheritedEditPanel } from './InheritedEditPanel';

export interface ContactInformationToggleProps {
  // Whether the contact follows the inherited values
  useInheritedContact: boolean;
  /**
   * false = the user started editing an inherited value; the caller must keep the current values.
   * true = the user chose the revert action; the caller restores the inherited values.
   */
  onToggleChange: (checked: boolean) => void;

  // Inherited contact info (from parent/business)
  inheritedEmail?: string;
  inheritedPhone?: string;
  inheritedLabel?: string; // e.g., "business" or "previous step"

  // Local contact info
  localEmail: string;
  localPhone: string;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;

  // Validation errors
  emailError?: string;
  phoneError?: string;

  // Configuration
  className?: string;
  id?: string;

  // Optional visibility & labels
  showEmail?: boolean; // default: true
  showPhone?: boolean; // default: true
  title?: string; // default: "" (include * in the string if needed)
  emailLabel?: string; // default: "" (include * in the string if needed)
  phoneLabel?: string; // default: "" (include * in the string if needed)

  // Optional helper text overrides (used to tailor copy)
  helperTextOn?: string;
  helperTextOff?: string;

  // Label of the action that restores the inherited values
  revertLabel: string;
}

export interface ContactInputProps {
  id: string;
  kind: 'email' | 'phone';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

// Email or phone input with its icon and reserved error row; also used by the marketplace listing.
export const ContactInput: React.FC<ContactInputProps> = ({ id, kind, value, onChange, error, label }) => {
  const { t } = useTranslation('common');
  const isEmail = kind === 'email';
  const Icon = isEmail ? Mail : Phone;
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-base font-medium">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          type={isEmail ? 'email' : 'tel'}
          inputMode={isEmail ? undefined : 'tel'}
          placeholder={isEmail ? t('contactToggle.emailPlaceholder') : t('contactToggle.phonePlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`!pr-11 transition-[border-color,box-shadow] focus-visible:ring-1 focus-visible:ring-offset-0 ${
            error
              ? 'border-destructive bg-error-bg focus-visible:ring-error'
              : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
          }`}
          autoComplete="off"
          aria-invalid={!!error}
        />
        <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      </div>
      <div className="min-h-5">
        {error && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export const ContactInformationToggle: React.FC<ContactInformationToggleProps> = ({
  useInheritedContact,
  onToggleChange,
  inheritedEmail,
  inheritedPhone,
  inheritedLabel,
  localEmail,
  localPhone,
  onEmailChange,
  onPhoneChange,
  emailError,
  phoneError,
  className = '',
  id = 'contact-toggle',
  showEmail = true,
  showPhone = true,
  title = '',
  emailLabel = '',
  phoneLabel = '',
  helperTextOn,
  helperTextOff,
  revertLabel,
}) => {
  // Helper-text fallbacks are translated here so a caller that omits them never shows English.
  const { t } = useTranslation('common');
  // Each case gets a whole sentence rather than a noun interpolated into one
  // template: Romanian needs a definite noun after "Vom folosi" but an
  // indefinite one after "Introdu alt", so no single noun form fits both.
  const whatKey = showEmail && showPhone ? 'emailAndPhone' : showEmail ? 'email' : 'phone';

  const emailId = `${id}-email`;
  const phoneId = `${id}-phone`;
  const shownEmail = useInheritedContact ? (inheritedEmail ?? '') : localEmail;
  const shownPhone = useInheritedContact ? (inheritedPhone ?? '') : localPhone;

  const handleEmailChange = (v: string) => {
    if (useInheritedContact) {
      onToggleChange(false);
      // The other field leaves "inherited" too, so give it the inherited value it was showing.
      if (showPhone && localPhone !== (inheritedPhone ?? '')) onPhoneChange(inheritedPhone ?? '');
    }
    onEmailChange(v);
  };

  const handlePhoneChange = (v: string) => {
    if (useInheritedContact) {
      onToggleChange(false);
      // The other field leaves "inherited" too, so give it the inherited value it was showing.
      if (showEmail && localEmail !== (inheritedEmail ?? '')) onEmailChange(inheritedEmail ?? '');
    }
    onPhoneChange(v);
  };

  const singleInputId =
    showEmail && !showPhone && !emailLabel
      ? emailId
      : showPhone && !showEmail && !phoneLabel
        ? phoneId
        : undefined;

  return (
    <InheritedEditPanel
      id={id}
      className={cn(
        'rounded-lg border border-border bg-surface-active p-4 dark:border-border-strong dark:bg-surface',
        className,
      )}
      title={title}
      titleFor={singleInputId}
      helperText={
        useInheritedContact
          ? (helperTextOn ?? t(`contactToggle.helperOn.${whatKey}`, {
              source: inheritedLabel ?? t('contactToggle.previousStep'),
            }))
          : (helperTextOff ?? t(`contactToggle.helperOff.${whatKey}`))
      }
      isCustom={!useInheritedContact}
      revertLabel={revertLabel}
      onRevert={() => onToggleChange(true)}
      forceOpen={(showEmail && !!emailError) || (showPhone && !!phoneError)}
      summary={
        <div className="flex flex-col gap-2 text-sm">
          {showEmail && shownEmail && (
            <span className="inline-flex w-fit items-center gap-1.5 font-medium text-foreground-1">
              <Mail className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
              {shownEmail}
            </span>
          )}
          {showPhone && shownPhone && (
            <span className="inline-flex w-fit items-center gap-1.5 font-medium text-foreground-1">
              <Phone className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
              {shownPhone}
            </span>
          )}
        </div>
      }
    >
      <div className={`grid grid-cols-1 ${showEmail && showPhone ? 'md:grid-cols-2' : ''} gap-4`}>
        {showEmail && (
          <ContactInput
            id={emailId}
            kind="email"
            label={emailLabel}
            value={shownEmail}
            onChange={handleEmailChange}
            error={emailError}
          />
        )}
        {showPhone && (
          <ContactInput
            id={phoneId}
            kind="phone"
            label={phoneLabel}
            value={shownPhone}
            onChange={handlePhoneChange}
            error={phoneError}
          />
        )}
      </div>
    </InheritedEditPanel>
  );
};

export default ContactInformationToggle;
