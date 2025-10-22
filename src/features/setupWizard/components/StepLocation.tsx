import { useEffect, useCallback, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import AddressComposer from '../../../shared/components/address/AddressComposer';
import WorkingHoursEditor from '../../../shared/components/common/WorkingHoursEditor';
import LocationNameField from '../../../shared/components/common/LocationNameField';
import LocationDescriptionField from '../../../shared/components/common/LocationDescriptionField';
import RemoteLocationToggle from '../../../shared/components/common/RemoteLocationToggle';
import TimezoneField from '../../../shared/components/common/TimezoneField';
import ContactInformationToggle from '../../../shared/components/common/ContactInformationToggle';
import Open247Toggle from '../../../shared/components/common/Open247Toggle';
import { Label } from '../../../shared/components/ui/label';
import type { WizardData } from '../../../shared/hooks/useSetupWizard';
import { useForm, useController } from 'react-hook-form';
import type { WorkingHours } from '../../../shared/types/location';
import type { StepProps, StepHandle } from '../types';
import { isE164 } from '../../../shared/utils/validation';

const StepLocation = forwardRef<StepHandle, StepProps>(({ data, onValidityChange, updateData }, ref) => {
  const { control, register, watch, setValue, reset, trigger, formState: { errors, isValid: formIsValid } } = useForm<WizardData>({
    defaultValues: data,
    mode: 'onChange'
  });

  const [isAddressValid, setIsAddressValid] = useState(true);
  const [addressComposerKey, setAddressComposerKey] = useState(0);
  const prevIsRemoteRef = useRef<boolean>(!!(watch('location') as any)?.isRemote);

  const isRemote = watch('location.isRemote' as any) === true;
  const businessEmail = (watch('businessInfo.email' as any) as string) || '';
  const businessPhone = (watch('businessInfo.phone' as any) as string) || '';
  const useBusinessContact = (watch('location.useBusinessContact' as any) as boolean) ?? true;

  // Register static fields for validation
  useEffect(() => {
    register('location.timezone' as any, {
      required: 'Timezone is required',
    });
  }, [register]);

  // Controlled name with validation
  const { field: nameField, fieldState: nameState } = useController<any>({
    name: 'location.name' as any,
    control,
    rules: {
      required: 'Location name is required',
      minLength: { value: 2, message: 'Location name must be at least 2 characters' },
    },
  });

  // Controlled email & phone with dynamic validation based on toggle
  const { field: emailField, fieldState: emailState } = useController<any>({
    name: 'location.email' as any,
    control,
    rules: {
      validate: {
        required: (value: string) => useBusinessContact || (!!value && value.trim().length > 0) || 'Email is required',
        pattern: (value: string) => useBusinessContact || !value || /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value) || 'Enter a valid email',
      },
    },
  });

  const { field: phoneField, fieldState: phoneState } = useController<any>({
    name: 'location.phone' as any,
    control,
    rules: {
      validate: {
        required: (value: string) => useBusinessContact || (!!value && value.trim().length > 0) || 'Phone number is required',
        format: (value: string) => useBusinessContact || !value || isE164(value) || 'Enter a valid phone number',
      },
    },
  });

  // Notify parent when validity changes
  useEffect(() => {
    if (onValidityChange) {
      const valid = formIsValid && Object.keys(errors).length === 0 && (isRemote || isAddressValid);
      onValidityChange(valid);
    }
  }, [formIsValid, errors, isAddressValid, isRemote, onValidityChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getFormData: () => watch(),
    triggerValidation: async () => trigger(),
    isValid: () => {
      // Check if there are any errors
      if (Object.keys(errors).length > 0) return false;
      if (!isRemote && !isAddressValid) return false;
      return formIsValid;
    },
  }), [watch, trigger, errors, formIsValid, isAddressValid, isRemote]);

  // Sync form with external data changes (from Redux) and trigger validation
  useEffect(() => {
    reset(data);
    // Trigger validation after reset to catch invalid saved data
    setTimeout(() => {
      trigger();
    }, 0);
  }, [data, reset, trigger]);

  // When toggling from remote back to physical, rehydrate from draft and remount composer
  useEffect(() => {
    const prev = prevIsRemoteRef.current;
    if (prev && !isRemote) {
      reset(data);
      setAddressComposerKey((k) => k + 1);
    }
    prevIsRemoteRef.current = isRemote;
  }, [isRemote, reset, data]);

  // Re-trigger validation when useBusinessContact changes (affects required fields)
  useEffect(() => {
    trigger(['location.email', 'location.phone']);
  }, [useBusinessContact, trigger]);

  const currentWorkingHours = (watch('location') as any)?.workingHours as WorkingHours;
  const open247 = !!(watch('location') as any)?.open247;

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


  const handleContactToggleChange = useCallback((checked: boolean) => {
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
  }, [setValue, businessEmail, businessPhone, watch]);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Remote Services Toggle */}
        <RemoteLocationToggle
          isRemote={isRemote}
          onChange={(checked) => {
            setValue('location.isRemote' as any, checked, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
            // Immediately sync to parent Redux to prevent reset from overwriting
            if (updateData) {
              const currentLocation = watch('location') as any;
              updateData({ location: { ...currentLocation, isRemote: checked } } as any);
            }
          }}
        />

        {/* Physical Location */}
        {!isRemote && (
          <div className="space-y-4">
            <LocationNameField
              value={(nameField.value as string) || ''}
              onChange={(value) => nameField.onChange(value)}
              error={(nameState.error?.message as unknown as string)}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="location.address" className="text-base font-medium">
                Address *
              </Label>
              <AddressComposer
                key={addressComposerKey}
                value={watch('location.address' as any) as any}
                onChange={(next) => setValue('location.address' as any, next, { shouldDirty: true, shouldTouch: true })}
                addressComponents={watch('location.addressComponents' as any) as any}
                onAddressComponentsChange={(components) => setValue('location.addressComponents' as any, components, { shouldDirty: true, shouldTouch: true })}
                onValidityChange={(isValid) => setIsAddressValid(isValid)}
              />
            </div>

            {/* Contact Information Toggle */}
            <ContactInformationToggle
              useInheritedContact={useBusinessContact}
              onToggleChange={handleContactToggleChange}
              inheritedEmail={businessEmail}
              inheritedPhone={businessPhone}
              inheritedLabel="the previous step"
              localEmail={(emailField.value as string) || ''}
              localPhone={(phoneField.value as string) || ''}
              onEmailChange={(email) => {
                emailField.onChange(email);
              }}
              onPhoneChange={(phone) => {
                const sanitized = (phone || '').replace(/\s+/g, ' ').trim();
                phoneField.onChange(sanitized);
              }}
              emailError={emailState.error?.message as unknown as string}
              phoneError={phoneState.error?.message as unknown as string}
              required={!useBusinessContact}
            />

            <div className="pt-4">
              <LocationDescriptionField
                value={(watch('location.description' as any) as string) || ''}
                onChange={(value) => setValue('location.description' as any, value, { shouldDirty: true, shouldTouch: true })}
              />
            </div>

            <div className="space-y-4 pt-4">
              <Label className="text-base font-medium">Working Hours</Label>
              <Open247Toggle
                open247={open247}
                onChange={(checked) => {
                  setValue('location.open247' as any, checked, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                  if (updateData) {
                    const currentLocation = watch('location') as any;
                    updateData({ location: { ...currentLocation, open247: checked } } as any);
                  }
                }}
              />
              <div className={open247 ? 'opacity-50 pointer-events-none' : ''}>
                <WorkingHoursEditor value={currentWorkingHours} onChange={applyWorkingHours} />
              </div>
            </div>
          </div>
        )}

        {/* Remote Location */}
        {isRemote && (
          <div className="space-y-4">
            <LocationNameField
              value={(nameField.value as string) || ''}
              onChange={(value) => nameField.onChange(value)}
              error={(nameState.error?.message as unknown as string)}
              isRemote
              required
                  placeholder="Online" 
            />

            <TimezoneField
              value={(watch('location.timezone' as any) as string) || ''}
                    onChange={(tz) => setValue('location.timezone' as any, tz, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
              error={(errors.location as any)?.timezone?.message}
              required
            />

            {/* Contact Information Toggle */}
            <ContactInformationToggle
              useInheritedContact={useBusinessContact}
              onToggleChange={handleContactToggleChange}
              inheritedEmail={businessEmail}
              inheritedPhone={businessPhone}
              inheritedLabel="the previous step"
              localEmail={(emailField.value as string) || ''}
              localPhone={(phoneField.value as string) || ''}
              onEmailChange={(email) => {
                emailField.onChange(email);
              }}
              onPhoneChange={(phone) => {
                const sanitized = (phone || '').replace(/\s+/g, ' ').trim();
                phoneField.onChange(sanitized);
              }}
              emailError={emailState.error?.message as unknown as string}
              phoneError={phoneState.error?.message as unknown as string}
              required={!useBusinessContact}
            />

            <div className="space-y-2 pt-4">
              <Label className="text-base font-medium">Working Hours</Label>
              <Open247Toggle
                open247={open247}
                onChange={(checked) => {
                  setValue('location.open247' as any, checked, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                  if (updateData) {
                    const currentLocation = watch('location') as any;
                    updateData({ location: { ...currentLocation, open247: checked } } as any);
                  }
                }}
              />
              <div className={open247 ? 'opacity-50 pointer-events-none' : ''}>
                <WorkingHoursEditor value={currentWorkingHours} onChange={applyWorkingHours} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

StepLocation.displayName = 'StepLocation';

export default StepLocation; 
