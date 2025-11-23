import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin } from 'lucide-react';
import { Label } from '../../../shared/components/ui/label';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import AddressComposer from '../../../shared/components/address/AddressComposer';
import RemoteLocationToggle from '../../../shared/components/common/RemoteLocationToggle';
import TimezoneField from '../../../shared/components/common/TimezoneField';
import ContactInformationToggle from '../../../shared/components/common/ContactInformationToggle';
import WorkingHoursEditor from '../../../shared/components/common/WorkingHoursEditor';
import Open247Toggle from '../../../shared/components/common/Open247Toggle';
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog';
import { updateLocationAction } from '../actions';
import type { EditLocationType } from '../types';
import type { LocationType, WorkingHours } from '../../../shared/types/location';
import { useForm, useController } from 'react-hook-form';
import { defaultWorkingHours } from '../constants';
import { selectCurrentUser } from '../../auth/selectors';
import { isE164, requiredEmailError, validateLocationName, validateDescription, sanitizePhoneToE164Draft } from '../../../shared/utils/validation';
import { getLocationLoadingSelector, getLocationErrorSelector } from '../selectors';
import { toast } from 'sonner';
import { mapLocationForEdit } from '../utils';

interface EditLocationSliderProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationType | null;
}

const EditLocationSlider: React.FC<EditLocationSliderProps> = ({ 
  isOpen, 
  onClose,
  location 
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const locationError = useSelector(getLocationErrorSelector);
  const isLocationLoading = useSelector(getLocationLoadingSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBusinessContact, setUseBusinessContact] = useState<boolean>(false);
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [addressComposerKey, setAddressComposerKey] = useState(0);
  const prevIsRemoteRef = useRef<boolean>(false);
  const originalEmailRef = useRef<string>("");
  const originalPhoneRef = useRef<string>("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    resetField,
    trigger,
    formState,
  } = useForm<EditLocationType>({
    defaultValues: location ? {
      ...mapLocationForEdit(location),
      workingHours: location.workingHours || defaultWorkingHours,
      open247: location.open247 || false,
      addressComponents: (location as any).addressComponents,
      addressManualMode: (location as any).addressManualMode,
    } : {
      isRemote: false,
      open247: false,
      workingHours: defaultWorkingHours,
    },
    mode: "onChange",
  });

  const isRemote = watch('isRemote') ?? false;
  const currentWorkingHours = watch('workingHours') as WorkingHours || defaultWorkingHours;
  const open247 = watch('open247') ?? false;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get business contact info (if available from user/business)
  const businessEmail = currentUser?.email || "";
  const businessPhone = currentUser?.business?.phone || "";

  const applyWorkingHours = (next: WorkingHours) => {
    setValue('workingHours', next, { shouldDirty: true });
  };

  // Controlled fields with validation
  const { field: nameField, fieldState: nameState } = useController<EditLocationType, "name">({
    name: "name",
    control,
    rules: {
      validate: (value) => {
        const error = validateLocationName(value);
        return error === null ? true : error;
      },
    },
  });

  const { field: addressField } = useController<EditLocationType, "address">({
    name: "address",
    control,
    rules: {
      validate: (value) => {
        if (isRemote) return true; // Address not required for remote locations
        if (!value || value.trim().length === 0) {
          return "Address is required";
        }
        return true;
      },
    },
  });

  const { field: emailField, fieldState: emailState } = useController<EditLocationType, "email">({
    name: "email",
    control,
    rules: {
      validate: (value) => {
        // Always validate - whether using business contact or location-specific contact
        const error = requiredEmailError("Email", value);
        return error === null ? true : error;
      },
    },
  });

  const { field: phoneField, fieldState: phoneState } = useController<EditLocationType, "phone">({
    name: "phone",
    control,
    rules: {
      validate: {
        required: (value) =>
          (!!value && value.trim().length > 0) ||
          "Phone number is required",
        format: (value) =>
          !value ||
          isE164(value) ||
          "Enter a valid phone number",
      },
    },
  });

  const { field: descriptionField, fieldState: descriptionState } = useController<EditLocationType, "description">({
    name: "description",
    control,
    rules: {
      validate: (value) => {
        if (!value || !value.trim()) return true; // Optional field
        const error = validateDescription(value, 500);
        return error === null ? true : error;
      },
    },
  });

  const { field: timezoneField, fieldState: timezoneState } = useController<EditLocationType, "timezone">({
    name: "timezone",
    control,
    rules: {
      validate: (value) => {
        // Only require timezone when location is remote
        if (!isRemote) return true; // Skip validation for physical locations
        if (!value || value.trim().length === 0) {
          return "Timezone is required";
        }
        return true;
      },
    },
  });

  // Initialize form with location data when slider opens
  useEffect(() => {
    if (location && isOpen) {
      const mapped = mapLocationForEdit(location);
      
      // Store original contact values for restoration when toggling OFF
      originalEmailRef.current = location.email || "";
      originalPhoneRef.current = location.phone || "";
      
      // Determine if current email/phone matches business contact
      const emailMatchesBusiness = location.email === businessEmail;
      const phoneMatchesBusiness = location.phone === businessPhone;
      const shouldUseBusinessContact = emailMatchesBusiness && phoneMatchesBusiness && !!businessEmail && !!businessPhone;
      
      setUseBusinessContact(shouldUseBusinessContact);
      prevIsRemoteRef.current = location.isRemote;
      
      // Always reset to server data when opening to ensure we don't keep unsaved changes
      reset({
        ...mapped,
        workingHours: location.workingHours || defaultWorkingHours,
        open247: location.open247 || false,
        addressComponents: (location as any).addressComponents,
        addressManualMode: (location as any).addressManualMode,
      });
      
      // Force AddressComposer to remount with fresh data
      setAddressComposerKey(prev => prev + 1);
    }
  }, [location, isOpen, reset, businessEmail, businessPhone]);

  // Reset when slider closes
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setIsAddressValid(true);
      setAddressComposerKey(0);
    }
  }, [isOpen]);

  // Watch for errors and show toast
  useEffect(() => {
    if (locationError && isSubmitting) {
      toast.error("We couldn't update the location", {
        description: String(locationError),
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [locationError, isSubmitting]);

  // Watch for success and close form
  useEffect(() => {
    if (!isLocationLoading && isSubmitting && !locationError) {
      // Success - close form
      setShowConfirmDialog(false);
      onClose();
      setIsSubmitting(false);
    }
  }, [isLocationLoading, isSubmitting, locationError, onClose]);

  // Re-validate timezone when isRemote changes
  useEffect(() => {
    trigger("timezone");
  }, [isRemote, trigger]);

  // Remount address composer when toggling to physical location
  useEffect(() => {
    const prev = prevIsRemoteRef.current;
    if (prev && !isRemote) {
      setAddressComposerKey((k) => k + 1);
    }
    prevIsRemoteRef.current = isRemote;
  }, [isRemote]);

  const handleContactToggleChange = useCallback(
    (checked: boolean) => {
      setUseBusinessContact(checked);
      if (checked) {
        // Inherit from business info
        setValue("email", businessEmail, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("phone", businessPhone, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        // Restore original location-specific contact values
        setValue("email", originalEmailRef.current, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("phone", originalPhoneRef.current, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [setValue, businessEmail, businessPhone]
  );

  // Check if required fields are filled
  const nameValue = watch("name");
  const addressValue = watch("address");
  const emailValue = watch("email");
  const phoneValue = watch("phone");
  const timezoneValue = watch("timezone");
  
  const areRequiredFieldsFilled =
    nameValue &&
    nameValue.trim().length > 0 &&
    (isRemote || (addressValue && addressValue.trim().length > 0)) &&
    emailValue &&
    emailValue.trim().length > 0 &&
    phoneValue &&
    phoneValue.trim().length > 0 &&
    (isRemote ? (timezoneValue && timezoneValue.trim().length > 0) : true) &&
    (isRemote || isAddressValid);

  // Form should be disabled if:
  // - formState is not valid (has validation errors)
  // - Required fields are empty
  // - No changes were made to the form (not dirty)
  const isFormDisabled =
    !formState.isValid ||
    !areRequiredFieldsFilled ||
    !formState.isDirty;

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    if (!location) return;
    
    const formData = watch();
    const payload: EditLocationType = {
      ...formData,
      id: location.id, // Ensure we use the original location id
      useBusinessContact, // Include the toggle state
    };
    
    dispatch(updateLocationAction.request({ location: payload }));
    setIsSubmitting(true);
    setShowConfirmDialog(false);
    // Don't close form here - wait for success/error response
  };

  const handleCancel = () => {
    onClose();
  };

  if (!location) return null;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Location"
        subtitle="Update location information"
        icon={MapPin}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="edit-location-form"
            cancelLabel="Cancel"
            submitLabel="Update Location"
            disabled={isFormDisabled}
          />
        }
      >
        <form
          id="edit-location-form"
          onSubmit={handleSubmit(onSubmit)}
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            <div className="max-w-2xl mx-auto space-y-6 cursor-default">
              {/* Remote Location Toggle - First */}
              <RemoteLocationToggle
                isRemote={isRemote}
                onChange={(checked) => {
                  setValue('isRemote', checked, { shouldDirty: true });
                  // Clear description and address when toggling between remote/physical
                  if (checked !== location.isRemote) {
                    resetField("description", { defaultValue: location.description || "" });
                    resetField("address", { defaultValue: location.address || "" });
                    resetField("addressComponents", { defaultValue: undefined });
                  }
                }}
              />

              {/* Physical Location */}
              {!isRemote && (
                <div className="space-y-4">
                  <TextField
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label="Location Name"
                    placeholder="e.g. Downtown Office"
                    required
                    maxLength={70}
                    icon={MapPin}
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
                      value={addressField.value || ""}
                      onChange={(next) =>
                        setValue("address", next, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      addressComponents={watch("addressComponents")}
                      onAddressComponentsChange={(components) =>
                        setValue("addressComponents", components, {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      manualMode={watch("addressManualMode")}
                      onManualModeChange={(isManual) =>
                        setValue("addressManualMode", isManual, {
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
                    inheritedLabel="your business"
                    localEmail={emailField.value || ""}
                    localPhone={phoneField.value || ""}
                    onEmailChange={(email) => {
                      emailField.onChange(email);
                    }}
                    onPhoneChange={(phone) => {
                      const sanitized = sanitizePhoneToE164Draft(phone || "");
                      phoneField.onChange(sanitized);
                    }}
                    emailError={emailState.error?.message}
                    phoneError={phoneState.error?.message}
                    title="Contact information"
                    emailLabel="Location Email *"
                    phoneLabel="Location Phone *"
                    helperTextOn="Your business contact info will be used for this location."
                    helperTextOff="Provide different contact details for this location."
                  />

                  <div className="pt-4">
                    <TextareaField
                      value={descriptionField.value || ""}
                      onChange={descriptionField.onChange}
                      error={descriptionState.error?.message}
                      label="Description"
                      placeholder="Describe this location (e.g. Main office with parking)"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-base font-medium">Working Hours</Label>
                    <Open247Toggle
                      open247={open247}
                      onChange={(checked) => {
                        setValue('open247', checked, { shouldDirty: true });
                      }}
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
                  <TextField
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label="Online Location Name"
                    placeholder="e.g. Online Sessions"
                    required
                    maxLength={70}
                    icon={MapPin}
                    isRemote
                  />

                  <TimezoneField
                    value={timezoneField.value || ""}
                    onChange={(tz) => timezoneField.onChange(tz)}
                    error={timezoneState.error?.message}
                    required
                  />

                  {/* Contact Information Toggle */}
                  <ContactInformationToggle
                    useInheritedContact={useBusinessContact}
                    onToggleChange={handleContactToggleChange}
                    inheritedEmail={businessEmail}
                    inheritedPhone={businessPhone}
                    inheritedLabel="your business"
                    localEmail={emailField.value || ""}
                    localPhone={phoneField.value || ""}
                    onEmailChange={(email) => {
                      emailField.onChange(email);
                    }}
                    onPhoneChange={(phone) => {
                      const sanitized = sanitizePhoneToE164Draft(phone || "");
                      phoneField.onChange(sanitized);
                    }}
                    emailError={emailState.error?.message}
                    phoneError={phoneState.error?.message}
                    title="Contact information"
                    emailLabel="Location Email *"
                    phoneLabel="Location Phone *"
                    helperTextOn="Business contact info will be used for this location."
                    helperTextOff="Provide different contact details for this location."
                  />

                  <div className="pt-4">
                    <TextareaField
                      value={descriptionField.value || ""}
                      onChange={descriptionField.onChange}
                      error={descriptionState.error?.message}
                      label="Description"
                      placeholder="Describe this location (e.g. Link to Zoom, Google Meet, etc.)"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label className="text-base font-medium">Working Hours</Label>
                    <Open247Toggle
                      open247={open247}
                      onChange={(checked) => {
                        setValue('open247', checked, { shouldDirty: true });
                      }}
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
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmUpdate}
        onCancel={() => setShowConfirmDialog(false)}
        title="Update Location"
        description={`Are you sure you want to update the location "${watch('name') || 'Untitled'}"?`}
        confirmTitle="Update Location"
        cancelTitle="Cancel"
        showCloseButton={true}
      />
    </>
  );
};

export default EditLocationSlider;
