import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Mail, Phone, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

export interface ContactInformationToggleProps {
  // Toggle state
  useInheritedContact: boolean;
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
  autoFocusOnToggle?: boolean;
}

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
  autoFocusOnToggle = false,
}) => {
  // Most visible strings are supplied already-translated by the caller, but the
  // badge had no prop and the helper-text fallbacks were English templates, so
  // anything the caller omitted silently rendered in English. Translate them here
  // instead, so a new caller can't reintroduce that.
  const { t } = useTranslation('common');
  // Each case gets a whole sentence rather than a noun interpolated into one
  // template: Romanian needs a definite noun after "Vom folosi" but an
  // indefinite one after "Introdu alt", so no single noun form fits both.
  const whatKey = showEmail && showPhone ? 'emailAndPhone' : showEmail ? 'email' : 'phone';

  return (
    <div
      className={`${
        useInheritedContact
          ? 'rounded-lg border border-info-300 bg-info-100 dark:border-border dark:bg-surface p-4'
          : 'bg-surface-active dark:bg-surface dark:border-border-strong border border-border rounded-lg p-4'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <Label htmlFor={id} className={`text-base font-medium cursor-pointer ${useInheritedContact ? 'text-neutral-900 dark:text-foreground-1' : ''}`}>{title}</Label>
        <Switch
          id={id}
          checked={useInheritedContact}
          onCheckedChange={onToggleChange}
          className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
        />
      </div>
      <p className={`text-sm ${useInheritedContact ? 'text-neutral-900 dark:text-foreground-2' : 'text-foreground-3 dark:text-foreground-2'}`}>
        {useInheritedContact
          ? (helperTextOn ?? t(`contactToggle.helperOn.${whatKey}`, {
              source: inheritedLabel ?? t('contactToggle.previousStep'),
            }))
          : (helperTextOff ?? t(`contactToggle.helperOff.${whatKey}`))}
      </p>
      {useInheritedContact && (inheritedEmail || inheritedPhone) && (
        <div className="text-sm pt-4">
          <div className="flex flex-col gap-1.5">
            {showEmail && inheritedEmail && (
              <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-foreground-1 font-medium w-fit">
                <Mail className="h-4 w-4 text-neutral-900 dark:text-foreground-2" />
                {inheritedEmail}
              </span>
            )}
            {showPhone && inheritedPhone && (
              <span className="inline-flex items-center gap-1.5 text-neutral-900 dark:text-foreground-1 font-medium w-fit pt-2">
                <Phone className="h-4 w-4 text-neutral-900 dark:text-foreground-2" />
                {inheritedPhone}
              </span>
            )}
          </div>
        </div>
      )}

      {!useInheritedContact && (
        <div className="mt-4 pt-4 border-t border-border relative">
          <div className={`grid grid-cols-1 ${showEmail && showPhone ? 'md:grid-cols-2' : ''} gap-4`}>
            {/* Email Field */}
            {showEmail && (
              <div className="space-y-2">
                {emailLabel && (
                  <Label htmlFor="location-email" className="text-base font-medium">
                    {emailLabel}
                  </Label>
                )}
                <div className="relative">
                  <Input
                    id="location-email"
                    type="email"
                    placeholder="e.g. contact@yourbusiness.com"
                    value={localEmail}
                    onChange={(e) => onEmailChange(e.target.value)}
                    autoFocus={autoFocusOnToggle}
                    className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                      emailError
                        ? 'border-destructive bg-error-bg focus-visible:ring-error'
                        : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                    }`}
                    autoComplete="off"
                    aria-invalid={!!emailError}
                  />
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                </div>
                <div className="min-h-5">
                  {emailError && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Phone Field */}
            {showPhone && (
              <div className="space-y-2">
                {phoneLabel && (
                  <Label htmlFor="location-phone" className="text-base font-medium">
                    {phoneLabel}
                  </Label>
                )}
                <div className="relative">
                  <Input
                    id="location-phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={localPhone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                      phoneError
                        ? 'border-destructive bg-error-bg focus-visible:ring-error'
                        : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                    }`}
                    autoComplete="off"
                    inputMode="tel"
                    aria-invalid={!!phoneError}
                  />
                  <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                </div>
                <div className="min-h-5">
                  {phoneError && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-1 right-0 pointer-events-none">
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 shrink-0"
            >
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-neutral-900">
                {t('contactToggle.customBadge')}
              </span>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInformationToggle;

