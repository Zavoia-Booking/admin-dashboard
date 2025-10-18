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
  required?: boolean;
  className?: string;
  id?: string;
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
  required = false,
  className = '',
  id = 'contact-toggle',
}) => {
  return (
    <div
      className={`${
        useInheritedContact
          ? 'rounded-lg border border-blue-200 bg-blue-50 p-4'
          : 'bg-accent/80 border border-accent/30 rounded-lg p-4'
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <Label className="text-sm font-medium">Contact information</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {useInheritedContact
              ? `We'll use the email and phone number from ${inheritedLabel}`
              : 'Enter different contact details for this location'}
          </p>
          {useInheritedContact && (inheritedEmail || inheritedPhone) && (
            <p className="text-xs pt-4">
              <span className="flex flex-col gap-1.5">
                {inheritedEmail && (
                  <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium w-fit">
                    <Mail className="h-3 w-3 text-gray-400" />
                    {inheritedEmail}
                  </span>
                )}
                {inheritedPhone && (
                  <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium w-fit pt-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {inheritedPhone}
                  </span>
                )}
              </span>
            </p>
          )}
        </div>
        <Switch
          id={id}
          checked={useInheritedContact}
          onCheckedChange={onToggleChange}
          className="self-start mt-0.5 !h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
        />
      </div>

      {!useInheritedContact && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="location-email" className="text-sm font-medium">
                Location Email {required && '*'}
              </Label>
              <div className="relative">
                <Input
                  id="location-email"
                  type="email"
                  placeholder="frontdesk@business.com"
                  value={localEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                    emailError
                      ? 'border-destructive bg-red-50 focus-visible:ring-red-400'
                      : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'
                  }`}
                  autoComplete="email"
                  aria-invalid={!!emailError}
                />
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="location-phone" className="text-sm font-medium">
                Location Phone {required && '*'}
              </Label>
              <div className="relative">
                <Input
                  id="location-phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={localPhone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                    phoneError
                      ? 'border-destructive bg-red-50 focus-visible:ring-red-400'
                      : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'
                  }`}
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={!!phoneError}
                />
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInformationToggle;

