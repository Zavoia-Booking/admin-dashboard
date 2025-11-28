import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Users } from 'lucide-react';
import { Label } from '../../../shared/components/ui/label';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { Pill } from '../../../shared/components/ui/pill';
import { MultiSelect } from '../../../shared/components/common/MultiSelect';
import AddressComposer from '../../../shared/components/address/AddressComposer';
import RemoteLocationToggle from '../../../shared/components/common/RemoteLocationToggle';
import TimezoneField from '../../../shared/components/common/TimezoneField';
import ContactInformationToggle from '../../../shared/components/common/ContactInformationToggle';
import WorkingHoursEditor from '../../../shared/components/common/WorkingHoursEditor';
import Open247Toggle from '../../../shared/components/common/Open247Toggle';
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog';
import { createLocationAction } from '../actions';
import type { NewLocationPayload } from '../types';
import type { WorkingHours } from '../../../shared/types/location';
import { useForm, useController } from 'react-hook-form';
import { defaultWorkingHours } from '../constants';
import { selectCurrentUser } from '../../auth/selectors';
import { selectTeamMembers } from '../../teamMembers/selectors';
import { listTeamMembersAction } from '../../teamMembers/actions';
import { getServicesListSelector } from '../../services/selectors';
import { getServicesAction } from '../../services/actions';
import type { TeamMember } from '../../../shared/types/team-member';
import { isE164, requiredEmailError, validateLocationName, validateDescription, sanitizePhoneToE164Draft } from '../../../shared/utils/validation';
import { getLocationLoadingSelector, getLocationErrorSelector } from '../selectors';
import { toast } from 'sonner';

interface AddLocationSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: NewLocationPayload = {
  isRemote: false,
  name: '',
  address: '',
  email: '',
  phone: '',
  description: '',
  workingHours: defaultWorkingHours,
  timezone: 'UTC',
  open247: false,
  teamMemberIds: [],
  serviceIds: [],
};

const AddLocationSlider: React.FC<AddLocationSliderProps> = ({
  isOpen,
  onClose
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const locationError = useSelector(getLocationErrorSelector);
  const isLocationLoading = useSelector(getLocationLoadingSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const allServices = useSelector(getServicesListSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBusinessContact, setUseBusinessContact] = useState<boolean>(true);
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [addressComposerKey, setAddressComposerKey] = useState(0);
  const prevIsRemoteRef = useRef<boolean>(false);
  const justOpenedRef = useRef(false);
  const dataFetchedRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    resetField,
    trigger,
  } = useForm<NewLocationPayload>({
    defaultValues,
    mode: "onChange",
  });

  const isRemote = watch('isRemote');
  const currentWorkingHours = watch('workingHours') as WorkingHours;
  const open247 = !!watch('open247');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get business contact info (if available from user/business)
  const businessEmail = currentUser?.email || "";
  const businessPhone = currentUser?.business?.phone || "";

  const applyWorkingHours = (next: WorkingHours) => {
    setValue('workingHours', next);
  };

  // Controlled fields with validation
  const { field: nameField, fieldState: nameState } = useController<NewLocationPayload, "name">({
    name: "name",
    control,
    rules: {
      validate: (value) => {
        const error = validateLocationName(value);
        return error === null ? true : error;
      },
    },
  });

  const { field: addressField, fieldState: addressState } = useController<NewLocationPayload, "address">({
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

  const { field: emailField, fieldState: emailState } = useController<NewLocationPayload, "email">({
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

  const { field: phoneField, fieldState: phoneState } = useController<NewLocationPayload, "phone">({
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

  const { field: descriptionField, fieldState: descriptionState } = useController<NewLocationPayload, "description">({
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

  const { field: timezoneField, fieldState: timezoneState } = useController<NewLocationPayload, "timezone">({
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

  useEffect(() => {
    if (!isOpen) {
      reset(defaultValues);
      setUseBusinessContact(true);
      setIsAddressValid(true);
      setAddressComposerKey(0);
      prevIsRemoteRef.current = false;
      // Do NOT reset isSubmitting here - keep it true during closing animation
      // to prevent button from being re-enabled
    }
  }, [isOpen, reset]);

  // When slider opens, reset submission state for a fresh form
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
      justOpenedRef.current = true;
      // Clear the flag after a brief delay to allow effects to run
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 0);
    }
  }, [isOpen]);

  // Populate business contact info when slider opens (separate effect to avoid conflicts)
  useEffect(() => {
    if (isOpen && useBusinessContact) {
      setValue("email", businessEmail, { shouldValidate: false, shouldDirty: false });
      setValue("phone", businessPhone, { shouldValidate: false, shouldDirty: false });
    }
  }, [isOpen, useBusinessContact, businessEmail, businessPhone, setValue]);

  // Fetch team members and services when slider opens, and pre-select all
  useEffect(() => {
    if (isOpen && !dataFetchedRef.current) {
      dispatch(listTeamMembersAction.request());
      dispatch(getServicesAction.request({ reset: true }));
      dataFetchedRef.current = true;
    }
  }, [isOpen, dispatch]);

  // Pre-select all active team members and all services when data is loaded
  useEffect(() => {
    if (isOpen && allTeamMembers.length > 0 && allServices.length > 0) {
      const activeTeamMembers = allTeamMembers.filter(
        (member: TeamMember) => member.roleStatus === 'active'
      );
      const activeTeamMemberIds = activeTeamMembers.map((member: TeamMember) => member.id);
      const allServiceIds = allServices.map((service) => service.id);

      setValue('teamMemberIds', activeTeamMemberIds, { shouldDirty: false });
      setValue('serviceIds', allServiceIds, { shouldDirty: false });
    }
  }, [isOpen, allTeamMembers, allServices, setValue]);

  // Reset fetch flag when slider closes
  useEffect(() => {
    if (!isOpen) {
      dataFetchedRef.current = false;
    }
  }, [isOpen]);

  // Watch for errors and show toast
  useEffect(() => {
    if (locationError && isSubmitting) {
      toast.error("We couldn't create the location", {
        description: "Please check your information and try again.",
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [locationError, isSubmitting]);

  // Watch for success and close form
  useEffect(() => {
    // Don't close if slider just opened (prevents race condition with isSubmitting reset)
    if (!isLocationLoading && isSubmitting && !locationError && !justOpenedRef.current) {
      // Success - close form and reset
      // Don't set isSubmitting to false here - let it stay true until slider closes
      setShowConfirmDialog(false);
      onClose();
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
        // Always inherit from business info (even if empty)
        setValue("email", businessEmail, {
          shouldValidate: true,
          shouldDirty: false,
        });
        setValue("phone", businessPhone, {
          shouldValidate: true,
          shouldDirty: false,
        });
      } else {
        // Clear fields when toggling OFF (don't validate immediately)
        setValue("email", "", {
          shouldDirty: false,
          shouldValidate: false,
          shouldTouch: false,
        });
        setValue("phone", "", {
          shouldDirty: false,
          shouldValidate: false,
          shouldTouch: false,
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

  // Only check for actual validation errors (not untouched optional fields)
  const hasValidationErrors =
    !!nameState.error ||
    !!emailState.error ||
    !!phoneState.error ||
    !!descriptionState.error ||
    (!isRemote && !!addressState.error) ||
    (isRemote && !!timezoneState.error);

  const isFormDisabled = hasValidationErrors || !areRequiredFieldsFilled;

  const onSubmit = () => {
    // Prevent opening dialog if already submitting or loading
    if (isSubmitting || isLocationLoading) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = () => {
    // Guard against double-clicks on Confirm button
    if (isSubmitting || isLocationLoading) {
      return;
    }
    const formData = watch();
    const payload: NewLocationPayload = {
      ...formData,
      useBusinessContact, // Include the toggle state
    };
    setIsSubmitting(true);
    dispatch(createLocationAction.request({ location: payload }));
    setShowConfirmDialog(false);
    // Don't close form here - wait for success/error response
  };

  const handleCancel = () => {
    onClose();
    reset(defaultValues);
  };

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title="Add New Location"
        subtitle="Create a new location for your business"
        icon={MapPin}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="add-location-form"
            cancelLabel="Cancel"
            submitLabel="Create Location"
            disabled={isFormDisabled || isSubmitting || isLocationLoading}
            isLoading={isSubmitting || isLocationLoading}
          />
        }
      >
        <form
          id="add-location-form"
          onSubmit={handleSubmit(onSubmit)}
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            <div className="max-w-2xl mx-auto space-y-6 cursor-default">
              {/* Remote Location Toggle - First */}
              <RemoteLocationToggle
                isRemote={isRemote}
                onChange={(checked) => {
                  setValue('isRemote', checked);
                  // Clear description and address when toggling between remote/physical
                  resetField("description", { defaultValue: "" });
                  resetField("address", { defaultValue: "" });
                  resetField("addressComponents", { defaultValue: undefined });
                }}
              />

              {/* Physical Location */}
              {!isRemote && (
                <div className="space-y-4">
                  <TextField
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
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
                      placeholder="Describe this location (e.g. Main office with parking)"
                    />
                  </div>


                  {/* Divider */}
                  <div className="flex items-end gap-2 mb-6 pt-4">
                    <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                  </div>

                  {/* Team Members Section */}
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground-1">
                        Team Members
                      </h3>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        Select which team members can work at this location. All active team members are selected by default.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {allTeamMembers.filter((member: TeamMember) => member.roleStatus === 'active').length === 0 ? (
                        <p className="text-sm text-foreground-3 dark:text-foreground-2">
                          No active team members available.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {allTeamMembers
                            .filter((member: TeamMember) => member.roleStatus === 'active')
                            .map((member: TeamMember) => {
                              const teamMemberIds = watch('teamMemberIds') || [];
                              const isSelected = teamMemberIds.includes(member.id);

                              return (
                                <Pill
                                  key={member.id}
                                  selected={isSelected}
                                  icon={Users}
                                  className="w-auto justify-start items-start transition-none active:scale-100"
                                  showCheckmark={true}
                                  onClick={() => {
                                    const newIds = isSelected
                                      ? teamMemberIds.filter((id) => id !== member.id)
                                      : [...teamMemberIds, member.id];
                                    setValue('teamMemberIds', newIds, { shouldDirty: true });
                                  }}
                                >
                                  <div className="flex flex-col text-left">
                                    <div className="flex items-center">
                                      {`${member.firstName} ${member.lastName}`}
                                    </div>
                                    {member.email && (
                                      <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">
                                        {member.email}
                                      </div>
                                    )}
                                  </div>
                                </Pill>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-end gap-2 mb-6">
                    <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                  </div>

                  {/* Services Section */}
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground-1">
                        Services
                      </h3>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        Select which services are available at this location. All services are selected by default.
                      </p>
                    </div>

                    <div className="max-w-md">
                      {allServices.length === 0 ? (
                        <p className="text-sm text-foreground-3 dark:text-foreground-2">
                          No services available. Create services first to assign them to this location.
                        </p>
                      ) : (
                        <MultiSelect
                          value={(watch('serviceIds') || []).map(String)}
                          onChange={(newSelectedIds) => {
                            const serviceIds = watch('serviceIds') || [];
                            // Find newly selected items and toggle them
                            const currentIds = new Set(serviceIds.map(String));
                            const newIds = [...serviceIds];

                            newSelectedIds.forEach((id) => {
                              if (!currentIds.has(String(id))) {
                                newIds.push(Number(id));
                              }
                            });

                            // Find removed items
                            const finalIds = newIds.filter(id =>
                              newSelectedIds.includes(String(id))
                            );

                            setValue('serviceIds', finalIds, { shouldDirty: true });
                          }}
                          options={allServices.map(service => ({
                            id: String(service.id),
                            name: service.name,
                          }))}
                          placeholder="+ Add Services"
                          searchPlaceholder="Search services..."
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-base font-medium">Working Hours</Label>
                    <Open247Toggle
                      open247={open247}
                      onChange={(checked) => {
                        setValue('open247', checked);
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
                    isRemote
                    required
                    placeholder="Online"
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

                  <div className="space-y-2 pt-4">
                    <Label className="text-base font-medium">Working Hours</Label>
                    <Open247Toggle
                      open247={open247}
                      onChange={(checked) => {
                        setValue('open247', checked);
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
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirmDialog(false)}
        title="Create Location"
        description={`Are you sure you want to create the location "${watch('name') || 'Untitled'}"?`}
        confirmTitle="Create Location"
        cancelTitle="Cancel"
        showCloseButton={true}
      />
    </>
  );
};

export default AddLocationSlider; 