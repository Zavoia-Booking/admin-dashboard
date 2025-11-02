import {
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from "react";
import AddressComposer from "../../../shared/components/address/AddressComposer";
import WorkingHoursEditor from "../../../shared/components/common/WorkingHoursEditor";
import LocationNameField from "../../../shared/components/common/LocationNameField";
import LocationDescriptionField from "../../../shared/components/common/LocationDescriptionField";
import RemoteLocationToggle from "../../../shared/components/common/RemoteLocationToggle";
import TimezoneField from "../../../shared/components/common/TimezoneField";
import ContactInformationToggle from "../../../shared/components/common/ContactInformationToggle";
import Open247Toggle from "../../../shared/components/common/Open247Toggle";
import { Label } from "../../../shared/components/ui/label";
import type { WizardData } from "../../../shared/hooks/useSetupWizard";
import { useForm, useController } from "react-hook-form";
import type { WorkingHours } from "../../../shared/types/location";
import type { StepProps, StepHandle, WizardFieldPath } from "../types";
import { isE164, requiredEmailError, validateLocationName, validateDescription, sanitizePhoneToE164Draft } from "../../../shared/utils/validation";
import { makeWizardToggleHandler } from "../utils";
import { useDraftValidation } from "../../../shared/hooks/useDraftValidation";
import type { RootState } from "../../../app/providers/store";
import { useSelector } from "react-redux";

const StepLocation = forwardRef<StepHandle, StepProps>(
  ({ data, onValidityChange, updateData }, ref) => {
    // Initialize toggle state from draft data to avoid flash on load
    const [useBusinessContact, setUseBusinessContact] = useState<boolean>(() => {
      const draftToggleState = data.useBusinessContact;
      // If draft has explicit state, use it; otherwise default to true
      return typeof draftToggleState === 'boolean' ? draftToggleState : true;
    });

    const {
      control,
      watch,
      setValue,
      reset,
      resetField,
      trigger,
      formState: { errors, isValid: formIsValid },
    } = useForm<WizardData>({
      defaultValues: data,
      mode: "onChange",
    });

    const [isAddressValid, setIsAddressValid] = useState(true);
    const [addressComposerKey, setAddressComposerKey] = useState(0);
    const prevIsRemoteRef = useRef<boolean>(
      !!watch("location" satisfies WizardFieldPath)?.isRemote
    );

    const isRemote = watch("location.isRemote" satisfies WizardFieldPath) === true;
    const businessEmail = (watch("businessInfo.email" satisfies WizardFieldPath) as string) || "";
    const businessPhone = (watch("businessInfo.phone" satisfies WizardFieldPath) as string) || "";

    // Controlled name with validation
    const { field: nameField, fieldState: nameState } = useController<WizardData, "location.name">({
      name: "location.name",
      control,
      rules: {
        validate: (value) => {
          const error = validateLocationName(value);
          return error === null ? true : error;
        },
      },
    });

    // Controlled email & phone with dynamic validation based on toggle
    const { field: emailField, fieldState: emailState } = useController<WizardData, "location.email">({
      name: "location.email",
      control,
      rules: {
        validate: (value) => {
          if (useBusinessContact) return true; // Skip validation when using business contact
          const error = requiredEmailError("Email", value);
          return error === null ? true : error;
        },
      },
    });

    const { field: phoneField, fieldState: phoneState } = useController<WizardData, "location.phone">({
      name: "location.phone",
      control,
      rules: {
        validate: {
          required: (value) =>
            useBusinessContact ||
            (!!value && value.trim().length > 0) ||
            "Phone number is required",
          format: (value) =>
            useBusinessContact ||
            !value ||
            isE164(value) ||
            "Enter a valid phone number",
        },
      },
    });

    // Controlled location description with validation (optional field)
    const { field: descriptionField, fieldState: descriptionState } =
      useController<WizardData, "location.description">({
        name: "location.description",
        control,
        rules: {
          validate: (value) => {
            if (!value || !value.trim()) return true; // Optional field
            const error = validateDescription(value, 500);
            return error === null ? true : error;
          },
        },
      });

    // Controlled timezone with validation (required when remote)
    const { field: timezoneField, fieldState: timezoneState } =
      useController<WizardData, "location.timezone">({
        name: "location.timezone",
        control,
        rules: {
          required: "Timezone is required",
        },
      });

    // Trigger validation on draft load to show errors for invalid saved data
    const showDraftErrors = useDraftValidation({
      trigger,
      data,
      section: 'location',
    });

    // Notify parent when validity changes
    useEffect(() => {
      if (onValidityChange) {
        const valid =
          formIsValid &&
          Object.keys(errors).length === 0 &&
          (isRemote || isAddressValid);
        onValidityChange(valid);
      }
    }, [formIsValid, errors, isAddressValid, isRemote, onValidityChange]);

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        getFormData: () => {
          const formData = watch();
          // Ensure location contact fields are always present in the payload
          const location = formData.location || {};
          const result: Partial<WizardData> = {
            ...formData,
            location: {
              ...location,
              email: (emailField.value as string) || '',
              phone: (phoneField.value as string) || '',
            },
            useBusinessContact, // Include toggle state at top level
          };
          return result;
        },
        triggerValidation: async () => trigger(),
        isValid: () => {
          // Check if there are any errors
          if (Object.keys(errors).length > 0) return false;
          if (!isRemote && !isAddressValid) return false;
          return formIsValid;
        },
      }),
      [watch, trigger, errors, formIsValid, isAddressValid, isRemote, useBusinessContact, emailField, phoneField, timezoneField]
    );

    // Reset form ONLY once when wizard finishes loading (same pattern as business step)
    const isWizardLoading = useSelector((state: RootState) => state.setupWizard.isLoading);
    const hasInitialized = useRef(false);
    useEffect(() => {
      if (isWizardLoading || hasInitialized.current) return;
      reset(data);
      hasInitialized.current = true;
    }, [isWizardLoading, data, reset]);

    // Remount address composer when toggling to physical location
    useEffect(() => {
      const prev = prevIsRemoteRef.current;
      if (prev && !isRemote) {
        setAddressComposerKey((k) => k + 1);
      }
      prevIsRemoteRef.current = isRemote;
    }, [isRemote]);

    const currentWorkingHours = watch("location" satisfies WizardFieldPath)
      ?.workingHours as WorkingHours;
    const open247 = !!watch("location" satisfies WizardFieldPath)?.open247;

    const applyWorkingHours = (next: WorkingHours) => {
      const current = watch();
      const updatedData: Partial<WizardData> = {
        ...current,
        location: {
          ...current.location,
          workingHours: next,
        },
      };
      reset(updatedData);
    };

    const handleContactToggleChange = useCallback(
      (checked: boolean) => {
        setUseBusinessContact(checked);
        if (checked) {
          // Inherit from business info
          if (businessEmail)
            setValue("location.email" satisfies WizardFieldPath, businessEmail, {
              shouldValidate: true,
              shouldDirty: false,
            });
          if (businessPhone)
            setValue("location.phone" satisfies WizardFieldPath, businessPhone, {
              shouldValidate: true,
              shouldDirty: false,
            });
        } else {
          // Clear fields when toggling OFF
          setValue("location.email" satisfies WizardFieldPath, "", {
            shouldDirty: false,
            shouldValidate: true,
          });
          setValue("location.phone" satisfies WizardFieldPath, "", {
            shouldDirty: false,
            shouldValidate: true,
          });
        }
        // Toggle state will be saved via getFormData
      },
      [setValue, businessEmail, businessPhone]
    );

    return (
      <div className="space-y-6">
        <div className="space-y-6">
          {/* Remote Services Toggle */}
          <RemoteLocationToggle
            isRemote={isRemote}
            onChange={makeWizardToggleHandler({
              setValue,
              watch,
              updateData,
              section: 'location',
              field: 'isRemote',
              onToggleExtra: () => {
                // Clear location name, description, and address when toggling between remote/physical
                // Use resetField to clear both value and field state (touched, dirty, error)
                resetField("location.name" satisfies WizardFieldPath, { defaultValue: "" });
                resetField("location.description" satisfies WizardFieldPath, { defaultValue: "" });
                resetField("location.address" satisfies WizardFieldPath, { defaultValue: "" });
                resetField("location.addressComponents" satisfies WizardFieldPath, { defaultValue: undefined });
              },
            })}
          />

          {/* Physical Location */}
          {!isRemote && (
            <div className="space-y-4">
              <LocationNameField
                value={(nameField.value as string) || ""}
                onChange={(value) => nameField.onChange(value)}
                error={(nameState.isTouched || nameState.isDirty || showDraftErrors) ? (nameState.error?.message as unknown as string) : undefined}
                placeholder="e.g. Downtown Office"
                required
              />

              <div className="space-y-2">
                <Label
                  htmlFor="location.address"
                  className="text-base font-medium"
                >
                  Address *
                </Label>
                <AddressComposer
                  key={addressComposerKey}
                  value={watch("location.address" satisfies WizardFieldPath) as any}
                  onChange={(next) =>
                    setValue("location.address" satisfies WizardFieldPath, next, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  addressComponents={
                    watch("location.addressComponents" satisfies WizardFieldPath) as any
                  }
                  onAddressComponentsChange={(components) =>
                    setValue("location.addressComponents" satisfies WizardFieldPath, components, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  manualMode={watch("location.addressManualMode" satisfies WizardFieldPath) as any}
                  onManualModeChange={(isManual) =>
                    setValue("location.addressManualMode" satisfies WizardFieldPath, isManual, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
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
                localEmail={(emailField.value as string) || ""}
                localPhone={(phoneField.value as string) || ""}
                onEmailChange={(email) => {
                  emailField.onChange(email);
                }}
                onPhoneChange={(phone) => {
                  const sanitized = sanitizePhoneToE164Draft(phone || "");
                  phoneField.onChange(sanitized);
                }}
                emailError={!useBusinessContact && (emailState.isTouched || emailState.isDirty || showDraftErrors) ? (emailState.error?.message as unknown as string) : undefined}
                phoneError={!useBusinessContact && (phoneState.isTouched || phoneState.isDirty || showDraftErrors) ? (phoneState.error?.message as unknown as string) : undefined}
                title="Contact information"
                emailLabel="Location Email *"
                phoneLabel="Location Phone *"
                helperTextOn="Your business contact info will be used for this location."
                helperTextOff="Provide different contact details for this location."
              />

              <div className="pt-4">
                <LocationDescriptionField
                  value={(descriptionField.value as string) || ""}
                  onChange={(value) => descriptionField.onChange(value)}
                  error={(descriptionState.isTouched || descriptionState.isDirty || showDraftErrors) ? (descriptionState.error?.message as string) : undefined}
                  placeholder="Describe this location (e.g. Main office with parking)"
                />
              </div>

              <div className="space-y-4 pt-4">
                <Label className="text-base font-medium">Working Hours</Label>
                <Open247Toggle
                  open247={open247}
                  onChange={makeWizardToggleHandler({
                    setValue,
                    watch,
                    updateData,
                    section: 'location',
                    field: 'open247',
                  })}
                />
                <div
                  className={open247 ? "opacity-50 pointer-events-none" : ""}
                >
                  <WorkingHoursEditor
                    value={currentWorkingHours}
                    onChange={applyWorkingHours}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remote Location */}
          {isRemote && (
            <div className="space-y-4">
              <LocationNameField
                value={(nameField.value as string) || ""}
                onChange={(value) => nameField.onChange(value)}
                error={(nameState.isTouched || nameState.isDirty || showDraftErrors) ? (nameState.error?.message as unknown as string) : undefined}
                isRemote
                required
                placeholder="Online"
              />

              <TimezoneField
                value={(timezoneField.value as string) || ""}
                onChange={(tz) => timezoneField.onChange(tz)}
                error={
                  (timezoneState.isTouched || timezoneState.isDirty || showDraftErrors)
                    ? (timezoneState.error?.message as string)
                    : undefined
                }
                required
              />

              {/* Contact Information Toggle */}
              <ContactInformationToggle
                useInheritedContact={useBusinessContact}
                onToggleChange={handleContactToggleChange}
                inheritedEmail={businessEmail}
                inheritedPhone={businessPhone}
                inheritedLabel="the previous step"
                localEmail={(emailField.value as string) || ""}
                localPhone={(phoneField.value as string) || ""}
                onEmailChange={(email) => {
                  emailField.onChange(email);
                }}
                onPhoneChange={(phone) => {
                  const sanitized = sanitizePhoneToE164Draft(phone || "");
                  phoneField.onChange(sanitized);
                }}
                emailError={!useBusinessContact && (emailState.isTouched || emailState.isDirty || showDraftErrors) ? (emailState.error?.message as unknown as string) : undefined}
                phoneError={!useBusinessContact && (phoneState.isTouched || phoneState.isDirty || showDraftErrors) ? (phoneState.error?.message as unknown as string) : undefined}
                title="Contact information"
                emailLabel="Location Email *"
                phoneLabel="Location Phone *"
                helperTextOn="Business contact info will be used for this location."
                helperTextOff="Provide different contact details for this location."
              />

              <div className="space-y-2 pt-4">
                <Label className="text-base font-medium">Working Hours</Label>
                <Open247Toggle
                  open247={open247}
                  onChange={makeWizardToggleHandler({
                    setValue,
                    watch,
                    updateData,
                    section: 'location',
                    field: 'open247',
                  })}
                />
                <div
                  className={open247 ? "opacity-50 pointer-events-none" : ""}
                >
                  <WorkingHoursEditor
                    value={currentWorkingHours}
                    onChange={applyWorkingHours}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

StepLocation.displayName = "StepLocation";

export default StepLocation;
