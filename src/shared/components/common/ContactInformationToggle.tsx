import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Mail, Phone, AlertCircle } from 'lucide-react';

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
}

export const ContactInformationToggle: React.FC<ContactInformationToggleProps> = ({
  useInheritedContact,
  onToggleChange,
  inheritedEmail,
  inheritedPhone,
  inheritedLabel = 'the previous step',
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
}) => {
  const inheritedWhat = showEmail && showPhone
    ? 'email and phone number'
    : showEmail
      ? 'email'
      : 'phone number';

  return (
    <div
      className={`${
        useInheritedContact
          ? 'rounded-lg border border-info-300 bg-info-100 p-4'
          : 'bg-surface-active dark:bg-neutral-900 border border-border rounded-lg p-4'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <Label htmlFor={id} className={`text-base font-medium cursor-pointer ${useInheritedContact ? 'text-neutral-900' : ''}`}>{title}</Label>
        <Switch
          id={id}
          checked={useInheritedContact}
          onCheckedChange={onToggleChange}
          className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
        />
      </div>
      <p className={`text-sm ${useInheritedContact ? 'text-neutral-900' : 'text-foreground-3 dark:text-foreground-2'}`}>
        {useInheritedContact
          ? (helperTextOn ?? `We'll use the ${inheritedWhat} from ${inheritedLabel}`)
          : (helperTextOff ?? `Enter different ${inheritedWhat} for this location`)}
      </p>
      {useInheritedContact && (inheritedEmail || inheritedPhone) && (
        <div className="text-sm pt-4">
          <div className="flex flex-col gap-1.5">
            {showEmail && inheritedEmail && (
              <span className="inline-flex items-center gap-1.5 text-neutral-900 font-medium w-fit">
                <Mail className="h-4 w-4 text-neutral-900" />
                {inheritedEmail}
              </span>
            )}
            {showPhone && inheritedPhone && (
              <span className="inline-flex items-center gap-1.5 text-neutral-900 font-medium w-fit pt-2">
                <Phone className="h-4 w-4 text-neutral-900" />
                {inheritedPhone}
              </span>
            )}
          </div>
        </div>
      )}

      {!useInheritedContact && (
        <div className="mt-4 pt-4 border-t border-border">
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
                    className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                      emailError
                        ? 'border-destructive bg-error-bg focus-visible:ring-error'
                        : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                    }`}
                    autoComplete="email"
                    aria-invalid={!!emailError}
                  />
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                </div>
                <div className="h-5">
                  {emailError && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                      <AlertCircle className="h-3.5 w-3.5" />
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
                    autoComplete="tel"
                    inputMode="tel"
                    aria-invalid={!!phoneError}
                  />
                  <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                </div>
                <div className="h-5">
                  {phoneError && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{phoneError}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInformationToggle;

