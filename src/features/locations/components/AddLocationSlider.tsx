import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, Plus, Info } from 'lucide-react';
import { PinVerificationIndicator } from '../../../shared/components/common/PinVerificationIndicator';
import { Label } from '../../../shared/components/ui/label';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { Pill } from '../../../shared/components/ui/pill';
import { ManageServicesSheet } from '../../../shared/components/common/ManageServicesSheet';
import AddressComposer from '../../../shared/components/address/AddressComposer';
import RemoteLocationToggle from '../../../shared/components/common/RemoteLocationToggle';
import TimezoneField from '../../../shared/components/common/TimezoneField';
import ContactInformationToggle from '../../../shared/components/common/ContactInformationToggle';
import WorkingHoursEditor from '../../../shared/components/common/WorkingHoursEditor';
import Open247Toggle from '../../../shared/components/common/Open247Toggle';
import { MapDialog } from '../../../shared/components/map';
import { maptilerGeocode } from '../../../shared/lib/maptiler';
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
import { isE164, sanitizePhoneToE164Draft } from '../../../shared/utils/validation';
import { getLocationLoadingSelector, getLocationErrorSelector } from '../selectors';
import { toast } from 'sonner';

interface AddLocationSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default timezone for new locations: use browser timezone so physical locations aren't saved as UTC
const getDefaultTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && typeof tz === 'string' ? tz : 'UTC';
  } catch {
    return 'UTC';
  }
};

const defaultValues: NewLocationPayload = {
  isRemote: false,
  name: '',
  address: '',
  email: '',
  phone: '',
  description: '',
  workingHours: defaultWorkingHours,
  timezone: getDefaultTimezone(),
  open247: false,
  teamMemberIds: [],
  serviceIds: [],
  addressComponents: undefined,
  addressManualMode: false,
  mapPinConfirmed: false,
};

const AddLocationSlider: React.FC<AddLocationSliderProps> = ({
  isOpen,
  onClose
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation("locations");
  const currentUser = useSelector(selectCurrentUser);
  const locationError = useSelector(getLocationErrorSelector);
  const isLocationLoading = useSelector(getLocationLoadingSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const allServices = useSelector(getServicesListSelector);
  const businessCountryCode = currentUser?.business?.countryCode || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBusinessContact, setUseBusinessContact] = useState<boolean>(true);
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [isServicesSheetOpen, setIsServicesSheetOpen] = useState(false);
  const [addressComposerKey, setAddressComposerKey] = useState(0);
  const prevIsRemoteRef = useRef<boolean>(false);
  const justOpenedRef = useRef(false);
  const dataFetchedRef = useRef(false);

  // Map pin confirmation state
  const [isPinConfirmed, setIsPinConfirmed] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [adjustedCoordinates, setAdjustedCoordinates] = useState<[number, number] | null>(null);
  const [initialMapCenter, setInitialMapCenter] = useState<[number, number]>([0, 0]);
  const [searchedAddressData, setSearchedAddressData] = useState<any>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [_, setPinWasModified] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const isConfirmingFromMap = useRef(false);
  const originalAddressRef = useRef<string>("");

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

  // Get business contact info (if available from user/business)
  const businessEmail = currentUser?.email || "";
  const businessPhone = currentUser?.business?.phone || "";

  const applyWorkingHours = (next: WorkingHours) => {
    setValue('workingHours', next);
  };

  // Map handlers
  const handleMarkerDrag = (coordinates: [number, number]) => {
    setAdjustedCoordinates(coordinates);
  };

  const handleMapClick = (coordinates: [number, number]) => {
    setAdjustedCoordinates(coordinates);
  };

  const handleSearchSelect = (coordinates: [number, number], suggestion: any) => {
    setAdjustedCoordinates(coordinates);
    setSearchedAddressData({
      ...suggestion,
      coordinates: coordinates
    });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: coordinates,
        zoom: 16,
        essential: true
      });
    }
  };

  const handleMapLoad = (map: any) => {
    mapInstanceRef.current = map;
  };

  const handleVerifyPinClick = async () => {
    const addressComponents = watch('addressComponents') as any;
    const address = watch('address') as string;
    
    const hasCoordinates = addressComponents?.latitude != null && addressComponents?.longitude != null;
    const hasAddress = address && address.trim().length > 0;

    if (!hasAddress) {
      toast.error(t("addLocation.toasts.validAddressFirst"));
      return;
    }
    
    if (hasCoordinates) {
      setInitialMapCenter([
        addressComponents.longitude,
        addressComponents.latitude
      ]);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setIsMapOpen(true);
    } else {
      setIsGeocodingAddress(true);
      try {
        const geocodeResult = await maptilerGeocode(address);
        
        if (geocodeResult) {
          const geocodedCoords: [number, number] = [
            Number(geocodeResult.lon),
            Number(geocodeResult.lat)
          ];
          
          setInitialMapCenter(geocodedCoords);
          setAdjustedCoordinates(geocodedCoords);
          setIsMapOpen(true);
        } else {
          toast.error(t("addLocation.toasts.couldNotFindLocation"));
          setInitialMapCenter([0, 0]);
          setIsMapOpen(true);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast.error(t("addLocation.toasts.couldNotGeocode"));
        setInitialMapCenter([0, 0]);
        setIsMapOpen(true);
      } finally {
        setIsGeocodingAddress(false);
      }
    }
  };

  const handleConfirmPin = () => {
    const addressComponents = watch('addressComponents') as any;
    const currentAddress = watch('address') as string;
    
    isConfirmingFromMap.current = true;
    
    let finalCoordinates: [number, number];
    
    // CASE 1: User searched for a new address in the map
    if (searchedAddressData) {
      const displayName = searchedAddressData.displayName || currentAddress;
      finalCoordinates = searchedAddressData.coordinates || adjustedCoordinates;
      
      if (!finalCoordinates) {
        toast.error(t("addLocation.toasts.selectLocationOnMap"));
        return;
      }
      
      setValue('address', displayName, { shouldDirty: true, shouldTouch: true });
      setValue('addressComponents', {
        street: searchedAddressData.address || '',
        streetNumber: searchedAddressData.streetNumber || '',
        city: searchedAddressData.city || '',
        postalCode: searchedAddressData.postalCode || '',
        country: searchedAddressData.country || '',
        latitude: finalCoordinates[1],
        longitude: finalCoordinates[0],
      } as any, { shouldDirty: true, shouldTouch: true });
      
      setValue('addressManualMode', false, { shouldDirty: true });
      setAddressComposerKey(prev => prev + 1);
    } 
    // CASE 2: User only moved the pin
    else if (adjustedCoordinates) {
      setValue('addressComponents', {
        ...addressComponents,
        latitude: adjustedCoordinates[1],
        longitude: adjustedCoordinates[0],
      } as any, { shouldDirty: true, shouldTouch: true });
    } 
    // CASE 3: User just clicked confirm without changes
    else {
      let finalLat = addressComponents?.latitude;
      let finalLng = addressComponents?.longitude;
      
      if ((!finalLat || !finalLng) && initialMapCenter[0] !== 0 && initialMapCenter[1] !== 0) {
        finalLng = initialMapCenter[0];
        finalLat = initialMapCenter[1];
      }
      
      if (!finalLat || !finalLng) {
        toast.error(t("addLocation.toasts.selectLocationOrSearch"));
        return;
      }
      
      setValue('addressComponents', {
        ...addressComponents,
        latitude: finalLat,
        longitude: finalLng,
      } as any, { shouldDirty: true, shouldTouch: true });
    }

    // Set mapPinConfirmed at the top level
    setValue('mapPinConfirmed' as any, true, { shouldDirty: true, shouldTouch: true });
    setIsPinConfirmed(true);
    setPinWasModified(true);
    setIsMapOpen(false);
    setAdjustedCoordinates(null);
    setSearchedAddressData(null);
    setInitialMapCenter([0, 0]);
    mapInstanceRef.current = null;

    setTimeout(() => {
      isConfirmingFromMap.current = false;
    }, 100);

    toast.success(t("addLocation.toasts.pinConfirmed"));
  };

  // Controlled fields with validation
  const { field: nameField, fieldState: nameState } = useController<NewLocationPayload, "name">({
    name: "name",
    control,
    rules: {
      validate: (value) => {
        const v = (value ?? "").trim();
        if (!v) return t("addLocation.validation.nameRequired");
        if (v.length < 2) return t("addLocation.validation.nameMinLength");
        if (v.length > 70) return t("addLocation.validation.nameMaxLength");
        const NAME_PATTERN = /^[A-Za-zÀ-ÿ0-9\s\-'&.()]+$/;
        if (!NAME_PATTERN.test(v)) return t("addLocation.validation.nameInvalidChars");
        return true;
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
          return t("addLocation.validation.addressRequired");
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
        const v = (value ?? "").trim();
        if (!v) return t("addLocation.validation.emailRequired");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t("addLocation.validation.emailRequired");
        return true;
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
          t("addLocation.validation.phoneRequired"),
        format: (value) =>
          !value ||
          isE164(value) ||
          t("addLocation.validation.phoneInvalid"),
      },
    },
  });

  const { field: descriptionField, fieldState: descriptionState } = useController<NewLocationPayload, "description">({
    name: "description",
    control,
    rules: {
      validate: (value) => {
        if (!value || !value.trim()) return true;
        const v = value.trim();
        if (v.length > 500) return t("addLocation.validation.descriptionMaxLength", { max: 500 });
        if (/<script|<iframe|javascript:|onclick|onerror|onload/i.test(v)) return t("addLocation.validation.descriptionInvalidChars");
        return true;
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
          return t("addLocation.validation.timezoneRequired");
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
      setAddressComposerKey(prev => prev + 1); // Force AddressComposer to remount with fresh state
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
      dispatch(getServicesAction.request());
      dataFetchedRef.current = true;
    }
  }, [isOpen, dispatch]);

  // Pre-select all active team members when data is loaded
  useEffect(() => {
    if (isOpen && allTeamMembers.length > 0) {
      const activeTeamMembers = allTeamMembers.filter(
        (member: TeamMember) => member.roleStatus === 'active'
      );
      const activeTeamMemberIds = activeTeamMembers.map((member: TeamMember) => member.id);
      setValue('teamMemberIds', activeTeamMemberIds, { shouldDirty: false });
    }
  }, [isOpen, allTeamMembers, setValue]);

  // Pre-select all services when data is loaded
  useEffect(() => {
    if (isOpen && allServices.length > 0) {
      const allServiceIds = allServices.map((service) => service.id);
      setValue('serviceIds', allServiceIds, { shouldDirty: false });
    }
  }, [isOpen, allServices, setValue]);

  // Reset fetch flag when slider closes
  useEffect(() => {
    if (!isOpen) {
      dataFetchedRef.current = false;
    }
  }, [isOpen]);

  // Watch for errors and show toast
  useEffect(() => {
    if (locationError && isSubmitting) {
      toast.error(t("addLocation.toasts.createFailed"), {
        description: t("addLocation.toasts.createFailedDescription"),
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

  // Reset pin confirmation when address changes (user-initiated only)
  useEffect(() => {
    const addressValue = watch('address');
    
    if (!isConfirmingFromMap.current && originalAddressRef.current && addressValue !== originalAddressRef.current) {
      setIsPinConfirmed(false);
      setValue('mapPinConfirmed' as any, false);
    }
    
    // Store original address on first load
    if (!originalAddressRef.current && addressValue) {
      originalAddressRef.current = addressValue;
    }
  }, [watch('address'), setValue]);

  // Reset map state when slider closes
  useEffect(() => {
    if (!isOpen) {
      setIsMapOpen(false);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setInitialMapCenter([0, 0]);
      mapInstanceRef.current = null;
      setIsPinConfirmed(false);
      setPinWasModified(false);
      originalAddressRef.current = "";
    }
  }, [isOpen]);

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
    (isRemote || isAddressValid) &&
    (isRemote || isPinConfirmed); // Require pin confirmation for physical locations

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
    // Prevent double submission
    if (isSubmitting || isLocationLoading) {
      return;
    }
    const formData = watch();
    const addressComponents = formData.addressComponents as any;
    
    // mapPinConfirmed is at top level in formData
    const payload: NewLocationPayload = {
      ...formData,
      useBusinessContact, // Include the toggle state
      mapPinConfirmed: (formData as any).mapPinConfirmed ?? false, // Read from top level
      addressComponents: addressComponents ? {
        street: addressComponents.street,
        streetNumber: addressComponents.streetNumber,
        city: addressComponents.city,
        postalCode: addressComponents.postalCode,
        country: addressComponents.country,
        latitude: addressComponents.latitude,
        longitude: addressComponents.longitude,
      } : undefined,
    };
    setIsSubmitting(true);
    dispatch(createLocationAction.request({ location: payload }));
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
        title={t("addLocation.title")}
        subtitle={t("addLocation.subtitle")}
        icon={MapPin}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="add-location-form"
            cancelLabel={t("addLocation.buttons.cancel")}
            submitLabel={t("addLocation.buttons.create")}
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
                id="add-location-isRemote"
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
                    id="add-location-name"
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label={t("addLocation.form.nameLabel")}
                    placeholder={t("addLocation.form.namePlaceholder")}
                    required
                  />

                  <div className="space-y-2">
                    <Label
                      htmlFor="location.address"
                      className="text-base font-medium"
                    >
                      {t("addLocation.form.addressLabel")}
                    </Label>
                    {businessCountryCode && (
                      <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          {t("address.countryRestrictionInfo", { countryCode: businessCountryCode.toUpperCase() })}
                        </p>
                      </div>
                    )}
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
                      alwaysClearOnSwitch={true}
                      countryCodes={businessCountryCode ? [businessCountryCode] : undefined}
                    />
                    
                    {/* Map Pin Verification Indicator */}
                    {isAddressValid && addressValue && addressValue.trim().length > 0 && (
                      <PinVerificationIndicator
                        isPinConfirmed={isPinConfirmed}
                        isGeocodingAddress={isGeocodingAddress}
                        onVerifyClick={handleVerifyPinClick}
                      />
                    )}
                  </div>

                  {/* Contact Information Toggle */}
                  <ContactInformationToggle
                    id="add-location-contact-toggle"
                    useInheritedContact={useBusinessContact}
                    onToggleChange={handleContactToggleChange}
                    inheritedEmail={businessEmail}
                    inheritedPhone={businessPhone}
                    inheritedLabel={t("addLocation.form.inheritedLabel")}
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
                    title={t("addLocation.form.contactTitle")}
                    emailLabel={t("addLocation.form.emailLabel")}
                    phoneLabel={t("addLocation.form.phoneLabel")}
                    helperTextOn={t("addLocation.form.helperTextOn")}
                    helperTextOff={t("addLocation.form.helperTextOff")}
                  />

                  <div className="pt-4">
                    <TextareaField
                      id="add-location-description"
                      value={descriptionField.value || ""}
                      onChange={descriptionField.onChange}
                      error={descriptionState.error?.message}
                      label={t("addLocation.form.descriptionLabel")}
                      placeholder={t("addLocation.form.descriptionPlaceholder")}
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
                        {t("addLocation.form.teamMembersTitle")}
                      </h3>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {t("addLocation.form.teamMembersDescription")}
                      </p>
                    </div>

                    <div className="space-y-5">
                      {allTeamMembers.filter((member: TeamMember) => member.roleStatus === 'active').length === 0 ? (
                        <p className="text-sm text-foreground-3 dark:text-foreground-2">
                          {t("addLocation.form.noTeamMembers")}
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
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="text-lg font-semibold text-foreground-1">
                          {t("addLocation.form.servicesTitle")}
                        </h3>
                        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                          {t("addLocation.form.servicesDescription")}
                        </p>
                      </div>

                      {/* Stats badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {allServices.length > 0 && (
                          <Badge variant="filter" className="rounded-full px-3 py-1 flex items-center gap-1.5 cursor-default select-none">
                            <span className="font-semibold text-neutral-900 dark:text-foreground-1">{(watch('serviceIds') || []).length}</span>
                            <span className="text-neutral-900 dark:text-foreground-1">{t("addLocation.form.servicesEnabled", { total: allServices.length })}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      {allServices.length === 0 ? (
                        <p className="text-sm text-foreground-3 dark:text-foreground-2">
                          {t("addLocation.form.noServices")}
                        </p>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          rounded="full"
                          onClick={() => setIsServicesSheetOpen(true)}
                          className="!px-6 border-border-strong text-foreground-1 group"
                        >
                          <Plus className="h-3 w-3 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
                          <span>{t("addLocation.form.manageServices")}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-base font-medium">{t("addLocation.form.workingHoursLabel")}</Label>
                    <Open247Toggle
                      id="add-location-open247"
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
                    id="add-location-name-remote"
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label={t("addLocation.form.remoteNameLabel")}
                    isRemote
                    required
                    placeholder={t("addLocation.form.remoteNamePlaceholder")}
                  />

                  <TimezoneField
                    value={timezoneField.value || ""}
                    onChange={(tz) => timezoneField.onChange(tz)}
                    error={timezoneState.error?.message}
                    required
                  />

                  {/* Contact Information Toggle */}
                  <ContactInformationToggle
                    id="add-location-contact-toggle-remote"
                    useInheritedContact={useBusinessContact}
                    onToggleChange={handleContactToggleChange}
                    inheritedEmail={businessEmail}
                    inheritedPhone={businessPhone}
                    inheritedLabel={t("addLocation.form.inheritedLabel")}
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
                    title={t("addLocation.form.contactTitle")}
                    emailLabel={t("addLocation.form.emailLabel")}
                    phoneLabel={t("addLocation.form.phoneLabel")}
                    helperTextOn={t("addLocation.form.helperTextOnRemote")}
                    helperTextOff={t("addLocation.form.helperTextOffRemote")}
                  />

                  <div className="space-y-2 pt-4">
                    <Label className="text-base font-medium">{t("addLocation.form.workingHoursLabel")}</Label>
                    <Open247Toggle
                      id="add-location-open247-remote"
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

      {/* Map Pin Verification Dialog */}
      {isMapOpen && (() => {
        const hasValidCoords = initialMapCenter[0] !== 0 && initialMapCenter[1] !== 0;
        
        return (
          <MapDialog
            isOpen={isMapOpen}
            onClose={() => {
              setIsMapOpen(false);
              setAdjustedCoordinates(null);
              setSearchedAddressData(null);
              setInitialMapCenter([0, 0]);
              mapInstanceRef.current = null;
            }}
            title={t("addLocation.mapDialog.title")}
            description={t("addLocation.mapDialog.description")}
            accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}
            center={initialMapCenter}
            zoom={hasValidCoords ? 16 : 2}
            marker={hasValidCoords ? {
              coordinates: adjustedCoordinates || initialMapCenter,
              color: '#3b82f6',
              draggable: true,
            } : undefined}
            onMarkerDragEnd={handleMarkerDrag}
            onMapClick={handleMapClick}
            onMapLoad={handleMapLoad}
            clickToPlace={true}
            showSearch={true}
            onSearchSelect={handleSearchSelect}
            showAddressWarning={true}
            showControls
            mapHeight="500px"
            className="z-[70]"
            overlayClassName="z-[70]"
            countryCodes={businessCountryCode ? [businessCountryCode] : undefined}
            footerActions={
              <>
                <Button
                  variant="outline"
                  rounded="full"
                  onClick={() => {
                    setIsMapOpen(false);
                    setAdjustedCoordinates(null);
                    setSearchedAddressData(null);
                    setInitialMapCenter([0, 0]);
                    mapInstanceRef.current = null;
                  }}
                >
                  {t("addLocation.mapDialog.cancel")}
                </Button>
                <Button
                  onClick={handleConfirmPin}
                  className="gap-2"
                  rounded="full"
                >
                  <MapPin className="h-4 w-4" />
                  {t("addLocation.mapDialog.confirm")}
                </Button>
              </>
            }
          />
        );
      })()}

      {/* Services Selection Modal */}
      <ManageServicesSheet
        isOpen={isServicesSheetOpen}
        onClose={() => setIsServicesSheetOpen(false)}
        allServices={allServices.map(service => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          category: service.category,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        }))}
        initialSelectedIds={watch('serviceIds') || []}
        onSave={(selectedIds) => {
          setValue('serviceIds', selectedIds, { shouldDirty: true });
        }}
        title={t("addLocation.manageServicesSheet.title")}
        subtitle={t("addLocation.manageServicesSheet.subtitle")}
        expandAllCategories
      />
    </>
  );
};

export default AddLocationSlider; 