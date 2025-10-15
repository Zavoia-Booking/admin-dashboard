import React, { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import AddressComposer from '../../../shared/components/common/AddressComposer';
import { Switch } from '../../../shared/components/ui/switch';
import WorkingHoursEditor from '../../../shared/components/common/WorkingHoursEditor';
import { TimezoneSelect, DetectTimezoneButton } from '../../../shared/components/common/TimezoneSelect';
import { Wifi, Phone, AlertCircle, Mail, MapPin, Monitor } from 'lucide-react';
import type { WizardData } from '../../../shared/hooks/useSetupWizard';
import { useForm } from 'react-hook-form';
import type { WorkingHours } from '../../../shared/types/location';
import type { StepProps, StepHandle } from '../types';
import { isE164, sanitizePhoneToE164Draft } from '../../auth/validation';

const StepLocation = forwardRef<StepHandle, StepProps>(({ data, onValidityChange }, ref) => {
  const { register, watch, setValue, reset, trigger, formState: { errors, isValid: formIsValid } } = useForm<WizardData>({
    defaultValues: data,
    mode: 'onChange'
  });

  // Register timezone field for validation
  useEffect(() => {
    register('location.timezone' as any, {
      required: 'Timezone is required',
    });
  }, [register]);

  const descriptionValue = watch('location.description') || '';
  const descriptionLength = descriptionValue.length;
  const maxDescriptionLength = 500;
  const isRemote = !!(watch('location') as any)?.isRemote;
  const businessEmail = (watch('businessInfo.email' as any) as string) || '';
  const businessPhone = (watch('businessInfo.phone' as any) as string) || '';
  const useBusinessContact = (watch('location.useBusinessContact' as any) as boolean) ?? true;

  // Notify parent when validity changes
  useEffect(() => {
    if (onValidityChange) {
      const valid = formIsValid && Object.keys(errors).length === 0;
      onValidityChange(valid);
    }
  }, [formIsValid, errors, onValidityChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getFormData: () => watch(),
    triggerValidation: async () => trigger(),
    isValid: () => {
      // Check if there are any errors
      if (Object.keys(errors).length > 0) return false;
      return formIsValid;
    },
  }), [watch, trigger, errors, formIsValid]);

  // Sync form with external data changes (from Redux) and trigger validation
  useEffect(() => {
    reset(data);
    // Trigger validation after reset to catch invalid saved data
    setTimeout(() => {
      trigger();
      
      // Additional manual validation for email if needed
      const email = (data as any)?.location?.email;
      const emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;
      if (email && !emailPattern.test(email)) {
        setValue('location.email' as any, email, { shouldValidate: true });
      }
      
      // Additional manual validation for phone if needed
      const phone = (data as any)?.location?.phone;
      if (phone && !isE164(phone)) {
        setValue('location.phone' as any, phone, { shouldValidate: true });
      }
    }, 0);
  }, [data, reset, trigger, setValue]);

  const currentWorkingHours = (watch('location') as any)?.workingHours as WorkingHours;

  // address compose handled by AddressComposer

  const applyWorkingHours = (next: WorkingHours) => {
    const current = watch();
    reset({
      ...current,
      location: {
        ...(current as any).location,
        workingHours: next,
      },
    } as any);
  };

  const handleLocationPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhoneToE164Draft(e.target.value);
    setValue('location.phone' as any, sanitized, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  }, [setValue]);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Remote Services Toggle */}
          <div className={`${isRemote ? 'rounded-lg border border-blue-200 bg-blue-50 p-4' : 'bg-accent/20 border border-accent/30 rounded-lg p-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Wifi className={`h-5 w-5 mt-0.5 ${isRemote ? 'text-blue-600' : 'text-primary'}`} />
              <div>
                <Label htmlFor="isRemote" className="text-sm font-medium">
                  I offer remote/online services
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRemote
                    ? "Meetings happen outside Bookaroo. Add your Zoom/Meet/Teams link or instructions, and choose the correct timezone so clients join at the right time."
                    : 'Turn on if you take sessions via Zoom, Google Meet, Teams, etc.'}
                </p>
              </div>
            </div>
            <Switch
              id="isRemote"
              checked={!!(watch('location') as any)?.isRemote}
              onCheckedChange={(checked) => setValue('location.isRemote' as any, checked, { shouldDirty: true, shouldTouch: true })}
              className={`!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer ${((watch('location') as any)?.isRemote) ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        </div>

        {/* Physical Location */}
        {!((watch('location') as any)?.isRemote) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location.name" className="text-sm font-medium">
                Location Name *
              </Label>
              <div className="relative">
                <Input 
                  id="location.name" 
                  placeholder="Main Location" 
                  maxLength={70}
                  className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${(errors.location as any)?.name ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'}`}
                  {...register('location.name' as any, {
                    required: 'Location name is required',
                    minLength: { value: 2, message: 'Location name must be at least 2 characters' },
                  })}
                />
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="h-5">
                {(errors.location as any)?.name && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String((errors.location as any).name.message)}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location.address" className="text-sm font-medium">
                Address *
              </Label>
              <AddressComposer
                value={watch('location.address' as any) as any}
                onChange={(next) => setValue('location.address' as any, next, { shouldDirty: true, shouldTouch: true })}
                addressComponents={watch('location.addressComponents' as any) as any}
                onAddressComponentsChange={(components) => setValue('location.addressComponents' as any, components, { shouldDirty: true, shouldTouch: true })}
              />
            </div>

            {/* Contact source toggle */}
            <div className={`${useBusinessContact ? 'rounded-lg border border-blue-200 bg-blue-50 p-4' : 'bg-accent/20 border border-accent/30 rounded-lg p-4'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Contact information</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {useBusinessContact ? (
                        <span className="flex flex-col gap-1.5">
                          {businessEmail && (
                            <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium w-fit">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {businessEmail}
                            </span>
                          )}
                          {businessPhone && (
                            <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium w-fit">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {businessPhone}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>Set location-specific contact details</span>
                      )}
                    </p>
                </div>
                <Switch
                  checked={!!useBusinessContact}
                  onCheckedChange={(checked) => {
                    setValue('location.useBusinessContact' as any, checked, { shouldDirty: true, shouldTouch: true });
                    if (checked) {
                      // Inherit from business info
                      if (businessEmail) setValue('location.email' as any, businessEmail, { shouldValidate: true, shouldDirty: true });
                      if (businessPhone) setValue('location.phone' as any, businessPhone, { shouldValidate: true, shouldDirty: true });
                    } else {
                      // Prefill overrides from business info only if empty
                      const currEmail = (watch('location.email' as any) as string) || '';
                      const currPhone = (watch('location.phone' as any) as string) || '';
                      if (!currEmail && businessEmail) setValue('location.email' as any, businessEmail, { shouldDirty: true });
                      if (!currPhone && businessPhone) setValue('location.phone' as any, businessPhone, { shouldDirty: true });
                    }
                  }}
                  className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
                />
              </div>

              {!useBusinessContact && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location.email" className="text-sm font-medium">Location Email *</Label>
                      <div className="relative">
                        <Input 
                          id="location.email" 
                          type="email" 
                          placeholder="frontdesk@business.com" 
                          className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${(errors.location as any)?.email ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'}`}
                          autoComplete="email"
                          {...register('location.email' as any, {
                            required: !useBusinessContact ? 'Email is required' : false,
                            pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' },
                          })}
                        />
                        <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="h-5">
                        {(errors.location as any)?.email && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{String((errors.location as any).email.message)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location.phone" className="text-sm font-medium">Location Phone *</Label>
                      <div className="relative">
                        <Input 
                          id="location.phone" 
                          type="tel" 
                          placeholder="+1 555 123 4567" 
                          className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${(errors.location as any)?.phone ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'}`}
                          autoComplete="tel"
                          inputMode="tel"
                          {...register('location.phone' as any, {
                            required: !useBusinessContact ? 'Phone number is required' : false,
                            validate: (value: string) => {
                              if (!useBusinessContact && value) {
                                return isE164(value) || 'Enter a valid phone number';
                              }
                              if (!useBusinessContact && !value) {
                                return 'Phone number is required';
                              }
                              return true;
                            },
                          })}
                          onChange={handleLocationPhoneChange}
                        />
                        <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="h-5">
                        {(errors.location as any)?.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{String((errors.location as any).phone.message)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location.description" className="text-sm font-medium">Description</Label>
                <span className={`text-xs ${descriptionLength > maxDescriptionLength ? 'text-red-500' : 'text-gray-500'}`}>
                  {descriptionLength}/{maxDescriptionLength}
                </span>
              </div>
              <Textarea 
                id="location.description" 
                placeholder="Describe this location (optional)" 
                rows={3} 
                maxLength={maxDescriptionLength}
                className="resize-none border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0" 
                {...register('location.description' as any)} 
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Working Hours</Label>
              <WorkingHoursEditor value={currentWorkingHours} onChange={applyWorkingHours} />
            </div>

          </div>
        )}

        {((watch('location') as any)?.isRemote) && (
          <div className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="location.name" className="text-sm font-medium">Online Location Name *</Label>
              <div className="relative">
                <Input 
                  id="location.name" 
                  placeholder="Online" 
                  maxLength={70}
                  className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${(errors.location as any)?.name ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'}`}
                  {...register('location.name' as any, {
                    required: 'Location name is required',
                    minLength: { value: 2, message: 'Location name must be at least 2 characters' },
                  })}
                />
                <Monitor className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="h-5">
                {(errors.location as any)?.name && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String((errors.location as any).name.message)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location.timezone" className="text-sm font-medium">Timezone *</Label>
              <p className="text-xs text-muted-foreground">
                We’ll use this to show accurate appointment times.
              </p>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <TimezoneSelect
                    value={watch('location.timezone' as any) || ''}
                    onChange={(tz) => setValue('location.timezone' as any, tz, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
                    error={!!(errors.location as any)?.timezone}
                    placeholder="Select timezone..."
                  />
                </div>
                <DetectTimezoneButton
                  onDetect={(tz) => setValue('location.timezone' as any, tz, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
                  className="shrink-0"
                />
              </div>
              <div className="h-5">
                {(errors.location as any)?.timezone && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String((errors.location as any).timezone.message)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Contact source toggle */}
            <div className={`${useBusinessContact ? 'rounded-lg border border-blue-200 bg-blue-50 p-4' : 'bg-accent/20 border border-accent/30 rounded-lg p-4'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Contact information</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {useBusinessContact ? (
                        <span className="flex flex-col gap-1.5">
                          {businessEmail && (
                            <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium w-fit">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {businessEmail}
                            </span>
                          )}
                          {businessPhone && (
                            <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium w-fit">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {businessPhone}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>Set location-specific contact details</span>
                      )}
                    </p>
                </div>
                <Switch
                  checked={!!useBusinessContact}
                  onCheckedChange={(checked) => {
                    setValue('location.useBusinessContact' as any, checked, { shouldDirty: true, shouldTouch: true });
                    if (checked) {
                      // Inherit from business info
                      if (businessEmail) setValue('location.email' as any, businessEmail, { shouldValidate: true, shouldDirty: true });
                      if (businessPhone) setValue('location.phone' as any, businessPhone, { shouldValidate: true, shouldDirty: true });
                    } else {
                      // Prefill overrides from business info only if empty
                      const currEmail = (watch('location.email' as any) as string) || '';
                      const currPhone = (watch('location.phone' as any) as string) || '';
                      if (!currEmail && businessEmail) setValue('location.email' as any, businessEmail, { shouldDirty: true });
                      if (!currPhone && businessPhone) setValue('location.phone' as any, businessPhone, { shouldDirty: true });
                    }
                  }}
                  className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
                />
              </div>

              {!useBusinessContact && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location.email" className="text-sm font-medium">Location Email *</Label>
                      <div className="relative">
                        <Input 
                          id="location.email" 
                          type="email" 
                          placeholder="support@business.com" 
                          className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${(errors.location as any)?.email ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'}`}
                          autoComplete="email"
                          {...register('location.email' as any, {
                            required: !useBusinessContact ? 'Email is required' : false,
                            pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' },
                          })}
                        />
                        <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="h-5">
                        {(errors.location as any)?.email && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{String((errors.location as any).email.message)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location.phone" className="text-sm font-medium">Location Phone *</Label>
                      <div className="relative">
                        <Input 
                          id="location.phone" 
                          type="tel" 
                          placeholder="+1 555 123 4567" 
                          className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${(errors.location as any)?.phone ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'}`}
                          autoComplete="tel"
                          inputMode="tel"
                          {...register('location.phone' as any, {
                            required: !useBusinessContact ? 'Phone number is required' : false,
                            validate: (value: string) => {
                              if (!useBusinessContact && value) {
                                return isE164(value) || 'Enter a valid phone number';
                              }
                              if (!useBusinessContact && !value) {
                                return 'Phone number is required';
                              }
                              return true;
                            },
                          })}
                          onChange={handleLocationPhoneChange}
                        />
                        <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="h-5">
                        {(errors.location as any)?.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{String((errors.location as any).phone.message)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Working Hours</Label>
              <WorkingHoursEditor value={currentWorkingHours} onChange={applyWorkingHours} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

StepLocation.displayName = 'StepLocation';

export default StepLocation; 