import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, Info } from 'lucide-react';
import { PinVerificationIndicator } from '../../../shared/components/common/PinVerificationIndicator';
import { Label } from '../../../shared/components/ui/label';
import { Button } from '../../../shared/components/ui/button';
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
import { DeleteConfirmDialog } from '../../../shared/components/common/DeleteConfirmDialog';
import { MapDialog } from '../../../shared/components/map';
import { maptilerGeocode } from '../../../shared/lib/maptiler';
import { AssignmentsCard } from '../../../shared/components/common/AssignmentsCard';
import type { DeleteResponse } from '../../../shared/types/delete-response';
import { updateLocationAction, deleteLocationAction } from '../actions';
import type { EditLocationType } from '../types';
import type { LocationType, WorkingHours } from '../../../shared/types/location';
import { useForm, useController } from 'react-hook-form';
import { defaultWorkingHours } from '../constants';
import { selectCurrentUser } from '../../auth/selectors';
import { isE164, sanitizePhoneToE164Draft } from '../../../shared/utils/validation';
import { getLocationLoadingSelector, getLocationErrorSelector, getIsDeletingSelector, getDeleteResponseSelector } from '../selectors';
import { toast } from 'sonner';
import { mapLocationForEdit } from '../utils';

// Fallback map center when geocoding fails – Bucharest [lng, lat]; user can move the pin
const FALLBACK_MAP_CENTER: [number, number] = [26.1025, 44.4268];

const isInvalidCenter = (c: [number, number]) => c[0] === 0 && c[1] === 0;

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
  const navigate = useNavigate();
  const { t } = useTranslation("locations");
  const currentUser = useSelector(selectCurrentUser);
  const locationError = useSelector(getLocationErrorSelector);
  const isLocationLoading = useSelector(getLocationLoadingSelector);
  const isDeleting = useSelector(getIsDeletingSelector);
  const deleteResponseFromState = useSelector(getDeleteResponseSelector);
  const businessCountryCode = currentUser?.business?.countryCode || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBusinessContact, setUseBusinessContact] = useState<boolean>(false);
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [addressComposerKey, setAddressComposerKey] = useState(0);
  const prevIsRemoteRef = useRef<boolean>(false);
  const originalEmailRef = useRef<string>("");
  const originalPhoneRef = useRef<string>("");
  const justOpenedRef = useRef(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState<DeleteResponse | null>(null);
  const [hasAttemptedDelete, setHasAttemptedDelete] = useState(false);

  // Map pin confirmation state
  const [isPinConfirmed, setIsPinConfirmed] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [adjustedCoordinates, setAdjustedCoordinates] = useState<[number, number] | null>(null);
  const [initialMapCenter, setInitialMapCenter] = useState<[number, number]>([0, 0]);
  const [searchedAddressData, setSearchedAddressData] = useState<any>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [pinWasModified, setPinWasModified] = useState(false); // Track if pin was just modified
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
    formState,
  } = useForm<EditLocationType>({
    defaultValues: location ? {
      ...mapLocationForEdit(location),
      workingHours: location.workingHours || defaultWorkingHours,
      open247: location.open247 || false,
      addressComponents: (location as any).addressComponents,
      addressManualMode: (location as any).addressManualMode,
      mapPinConfirmed: location.mapPinConfirmed || false,
    } : {
      isRemote: false,
      open247: false,
      workingHours: defaultWorkingHours,
      mapPinConfirmed: false,
    },
    mode: "onChange",
  });

  const isRemote = watch('isRemote') ?? false;
  const currentWorkingHours = watch('workingHours') as WorkingHours || defaultWorkingHours;
  const open247 = watch('open247') ?? false;

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

  const { field: addressField } = useController<EditLocationType, "address">({
    name: "address",
    control,
    rules: {
      validate: (value) => {
        if (isRemote) return true;
        if (!value || value.trim().length === 0) {
          return t("addLocation.validation.addressRequired");
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
        const v = (value ?? "").trim();
        if (!v) return t("addLocation.validation.emailRequired");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t("addLocation.validation.emailRequired");
        return true;
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
          t("addLocation.validation.phoneRequired"),
        format: (value) =>
          !value ||
          isE164(value) ||
          t("addLocation.validation.phoneInvalid"),
      },
    },
  });

  const { field: descriptionField, fieldState: descriptionState } = useController<EditLocationType, "description">({
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
      toast.error(t("editLocation.toasts.validAddressFirst"));
      return;
    }

    const lng = Number(addressComponents?.longitude);
    const lat = Number(addressComponents?.latitude);
    const coordsAreValid = hasCoordinates && !(lng === 0 && lat === 0);

    if (coordsAreValid) {
      setInitialMapCenter([lng, lat]);
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
          toast.error(t("editLocation.toasts.couldNotFindLocation"));
          setInitialMapCenter(FALLBACK_MAP_CENTER);
          setAdjustedCoordinates(FALLBACK_MAP_CENTER);
          setIsMapOpen(true);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast.error(t("editLocation.toasts.couldNotGeocode"));
        setInitialMapCenter(FALLBACK_MAP_CENTER);
        setAdjustedCoordinates(FALLBACK_MAP_CENTER);
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
        toast.error(t("editLocation.toasts.selectLocationOnMap"));
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
        toast.error(t("editLocation.toasts.selectLocationOrSearch"));
        return;
      }

      setValue('addressComponents', {
        ...addressComponents,
        latitude: finalLat,
        longitude: finalLng,
      } as any, { shouldDirty: true, shouldTouch: true });
    }

    // Set mapPinConfirmed at the top level (not in addressComponents)
    setValue('mapPinConfirmed' as any, true, { shouldDirty: true, shouldTouch: true });
    setIsPinConfirmed(true);
    setPinWasModified(true); // Mark that pin was modified in this session
    setIsMapOpen(false);
    setAdjustedCoordinates(null);
    setSearchedAddressData(null);
    setInitialMapCenter([0, 0]);
    mapInstanceRef.current = null;

    setTimeout(() => {
      isConfirmingFromMap.current = false;
    }, 100);

    // Re-run validation so formState.isValid updates and Update button can enable
    void trigger();

    toast.success(t("editLocation.toasts.pinConfirmed"));
  };

  const { field: timezoneField, fieldState: timezoneState } = useController<EditLocationType, "timezone">({
    name: "timezone",
    control,
    rules: {
      validate: (value) => {
        if (!isRemote) return true;
        if (!value || value.trim().length === 0) {
          return t("addLocation.validation.timezoneRequired");
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
      setIsAddressValid(true);
      setAddressComposerKey(0);
      setPinWasModified(false); // Reset pin modified flag
      // Do NOT reset isSubmitting here - keep it true during closing animation
      // to prevent button from being re-enabled
      // Reset delete state when closing
      setShowDeleteDialog(false);
      setDeleteResponse(null);
      setHasAttemptedDelete(false);
    }
  }, [isOpen]);

  // Initialize pin confirmation status from server data (top-level mapPinConfirmed)
  useEffect(() => {
    if (location && isOpen) {
      // Read from top-level mapPinConfirmed field from server
      const isPinCurrentlyConfirmed = (location as any).mapPinConfirmed === true;
      setIsPinConfirmed(isPinCurrentlyConfirmed);
      originalAddressRef.current = location.address || "";
    }
  }, [location, isOpen]);

  // Track pin confirmation status changes from form (top-level field)
  useEffect(() => {
    const currentMapPinConfirmed = watch('mapPinConfirmed' as any);
    if (currentMapPinConfirmed !== undefined) {
      setIsPinConfirmed(currentMapPinConfirmed);
    }
  }, [watch('mapPinConfirmed' as any)]);

  // Reset pin confirmation when address changes (user-initiated only)
  useEffect(() => {
    const addressValue = watch('address');

    if (!isConfirmingFromMap.current && originalAddressRef.current && addressValue !== originalAddressRef.current) {
      setIsPinConfirmed(false);
      setValue('mapPinConfirmed' as any, false);
    }
  }, [watch('address')]);

  // Reset map state when slider closes
  useEffect(() => {
    if (!isOpen) {
      setIsMapOpen(false);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setInitialMapCenter([0, 0]);
      mapInstanceRef.current = null;
    }
  }, [isOpen]);

  // When slider opens, reset submission state for a fresh form
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
      setDeleteResponse(null);
      setHasAttemptedDelete(false);
      setPinWasModified(false); // Reset pin modified flag
      justOpenedRef.current = true;
      // Clear the flag after a brief delay to allow effects to run
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 0);
    }
  }, [isOpen]);

  // Handle delete response from Redux state
  useEffect(() => {
    if (deleteResponseFromState && hasAttemptedDelete && !isDeleting) {
      if (deleteResponseFromState.canDelete === false) {
        // Cannot delete - update dialog to show blocking info
        setDeleteResponse(deleteResponseFromState as DeleteResponse);
      } else {
        // Successfully deleted - close dialog
        setShowDeleteDialog(false);
        setDeleteResponse(null);
        setHasAttemptedDelete(false);
        onClose();
      }
    }
  }, [deleteResponseFromState, hasAttemptedDelete, isDeleting, onClose]);

  // Watch for errors and show toast
  useEffect(() => {
    if (locationError && isSubmitting) {
      toast.error(t("editLocation.toasts.updateFailed"), {
        description: t("editLocation.toasts.updateFailedDescription"),
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [locationError, isSubmitting]);

  // Watch for success and close slider
  useEffect(() => {
    if (!isLocationLoading && isSubmitting && !locationError && !justOpenedRef.current) {
      onClose();
    }
  }, [isLocationLoading, isSubmitting, locationError, onClose]);

  // Re-validate timezone and address when isRemote changes (rules depend on isRemote)
  useEffect(() => {
    trigger("timezone");
    trigger("address");
  }, [isRemote, trigger]);

  // When toggling to physical: remount address composer. When switching back to remote: clear address data.
  useEffect(() => {
    const prev = prevIsRemoteRef.current;
    if (prev && !isRemote) {
      setAddressComposerKey((k) => k + 1);
    }
    if (!prev && isRemote) {
      // Switching back to remote: clear address data so user must re-enter and confirm pin if they go physical again
      setValue('address', '', { shouldDirty: true });
      setValue('addressComponents', undefined as any, { shouldDirty: true });
      setValue('addressManualMode', false, { shouldDirty: true });
      setValue('mapPinConfirmed' as any, false, { shouldDirty: true });
      setIsPinConfirmed(false);
      setPinWasModified(false);
      originalAddressRef.current = '';
      setAddressComposerKey((k) => k + 1);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setInitialMapCenter([0, 0]);
      mapInstanceRef.current = null;
      void trigger('address');
    }
    prevIsRemoteRef.current = isRemote;
  }, [isRemote, setValue, trigger]);

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
    (isRemote || isAddressValid) &&
    (isRemote || isPinConfirmed); // Require pin confirmation for physical locations

  // When remote: only count changes to remote-relevant fields (address/pin don't apply).
  // When physical: count any form dirty or pin confirmation.
  const REMOTE_RELEVANT_FIELDS = ['name', 'email', 'phone', 'timezone', 'description', 'workingHours', 'open247', 'isRemote'] as const;
  const dirtyFieldsObj = formState.dirtyFields as Partial<Record<string, unknown>> | undefined;
  const hasRemoteRelevantDirty = dirtyFieldsObj && REMOTE_RELEVANT_FIELDS.some((f) => dirtyFieldsObj[f]);
  const hasRelevantChanges = isRemote ? hasRemoteRelevantDirty : (formState.isDirty || pinWasModified);

  // Form should be disabled if:
  // - formState is not valid (has validation errors)
  // - Required fields are empty
  // - No relevant changes (for remote: only remote-relevant fields; for physical: any dirty or pin)
  const isFormDisabled =
    !formState.isValid ||
    !areRequiredFieldsFilled ||
    !hasRelevantChanges;

  const onSubmit = () => {
    // Prevent double submission
    if (isSubmitting || isLocationLoading || !location) {
      return;
    }

    const formData = watch();
    const addressComponents = formData.addressComponents as any;

    // mapPinConfirmed is at top level in formData
    const payload = {
      ...formData,
      id: location.id, // Ensure we use the original location id
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
    } as EditLocationType;

    setIsSubmitting(true);
    dispatch(updateLocationAction.request({ location: payload }));
    // Don't close form here - wait for success/error response
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDeleteClick = () => {
    // Show confirmation dialog first with optimistic state
    setDeleteResponse({
      canDelete: true,
      message: '',
    });
    setShowDeleteDialog(true);
    setHasAttemptedDelete(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteResponse?.canDelete || !location) return;
    // User confirmed - now make the backend call
    setHasAttemptedDelete(true);
    dispatch(deleteLocationAction.request({ id: location.id }));
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    if (!open) {
      setShowDeleteDialog(false);
      setDeleteResponse(null);
      setHasAttemptedDelete(false);
    }
  };

  if (!location) return null;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={location ? t("editLocation.title", { name: location.name }) : t("editLocation.titleFallback")}
        subtitle={t("editLocation.subtitle")}
        icon={MapPin}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="edit-location-form"
            cancelLabel={t("editLocation.buttons.cancel")}
            submitLabel={t("editLocation.buttons.update")}
            disabled={isFormDisabled || isSubmitting || isLocationLoading}
            isLoading={isSubmitting || isLocationLoading}
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
                id="edit-location-isRemote"
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
                    id="edit-location-name"
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label={t("editLocation.form.nameLabel")}
                    placeholder={t("editLocation.form.namePlaceholder")}
                    required
                    maxLength={70}
                    icon={MapPin}
                  />

                  <div className="space-y-2">
                    <Label
                      htmlFor="location.address"
                      className="text-base font-medium"
                    >
                      {t("editLocation.form.addressLabel")}
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
                      preserveInitialData={true}
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
                    id="edit-location-contact-toggle"
                    useInheritedContact={useBusinessContact}
                    onToggleChange={handleContactToggleChange}
                    inheritedEmail={businessEmail}
                    inheritedPhone={businessPhone}
                    inheritedLabel={t("editLocation.form.inheritedLabel")}
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
                    title={t("editLocation.form.contactTitle")}
                    emailLabel={t("editLocation.form.emailLabel")}
                    phoneLabel={t("editLocation.form.phoneLabel")}
                    helperTextOn={t("editLocation.form.helperTextOn")}
                    helperTextOff={t("editLocation.form.helperTextOff")}
                  />

                  <div className="pt-4">
                    <TextareaField
                      id="edit-location-description"
                      value={descriptionField.value || ""}
                      onChange={descriptionField.onChange}
                      error={descriptionState.error?.message}
                      label={t("editLocation.form.descriptionLabel")}
                      placeholder={t("editLocation.form.descriptionPlaceholder")}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-base font-medium">{t("editLocation.form.workingHoursLabel")}</Label>
                    <Open247Toggle
                      id="edit-location-open247"
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
                    id="edit-location-name-remote"
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label={t("editLocation.form.remoteNameLabel")}
                    placeholder={t("editLocation.form.remoteNamePlaceholder")}
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
                    id="edit-location-contact-toggle-remote"
                    useInheritedContact={useBusinessContact}
                    onToggleChange={handleContactToggleChange}
                    inheritedEmail={businessEmail}
                    inheritedPhone={businessPhone}
                    inheritedLabel={t("editLocation.form.inheritedLabel")}
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
                    title={t("editLocation.form.contactTitle")}
                    emailLabel={t("editLocation.form.emailLabel")}
                    phoneLabel={t("editLocation.form.phoneLabel")}
                    helperTextOn={t("editLocation.form.helperTextOnRemote")}
                    helperTextOff={t("editLocation.form.helperTextOffRemote")}
                  />

                  <div className="pt-4">
                    <TextareaField
                      id="edit-location-description-remote"
                      value={descriptionField.value || ""}
                      onChange={descriptionField.onChange}
                      error={descriptionState.error?.message}
                      label={t("editLocation.form.descriptionLabel")}
                      placeholder={t("editLocation.form.descriptionPlaceholderRemote")}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label className="text-base font-medium">{t("editLocation.form.workingHoursLabel")}</Label>
                    <Open247Toggle
                      id="edit-location-open247-remote"
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

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Assignments Section */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t("editLocation.assignments.title")}
                  </h3>
                </div>

                <AssignmentsCard
                  stats={[
                    { label: t("editLocation.assignments.services"), value: location.servicesCount || 0 },
                    { label: t("editLocation.assignments.teamMembers"), value: location.teamMembersCount || 0 },
                  ]}
                  description={t("editLocation.assignments.description")}
                  buttonLabel={t("editLocation.assignments.goToAssignments")}
                  onButtonClick={() => {
                    navigate(`/assignments?tab=locations&locationId=${location.id}`);
                  }}
                />
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Remove Location */}
              <div className="space-y-4 rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-foreground-1">
                    {t("editLocation.removeLocation.title")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("editLocation.removeLocation.description")}
                  </p>
                </div>

                <div className="flex flex-col gap-3 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={handleDeleteClick}
                    className="w-1/2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isDeleting}
                  >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("editLocation.removeLocation.removing")}
                          </>
                        ) : (
                          t("editLocation.removeLocation.button")
                        )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </BaseSlider>

      {/* Delete Confirmation Dialog */}
      {location && (
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={handleCloseDeleteDialog}
          resourceType="location"
          resourceName={location.name}
          deleteResponse={deleteResponse}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          className="z-[80]"
          overlayClassName="z-[80]"
          secondaryActions={[
            {
              label: t("editLocation.assignments.goToAssignments"),
              onClick: () => {
                handleCloseDeleteDialog(false);
                navigate(`/assignments?tab=locations&locationId=${location.id}`);
              }
            },
          ]}
        />
      )}

      {/* Map Pin Verification Dialog – never pass [0,0] to map (ocean); use Bucharest fallback */}
      {isMapOpen && (() => {
        const safeCenter: [number, number] = isInvalidCenter(initialMapCenter) ? FALLBACK_MAP_CENTER : initialMapCenter;
        const hasValidCoords = !isInvalidCenter(safeCenter);

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
            title={t("editLocation.mapDialog.title")}
            description={t("editLocation.mapDialog.description")}
            accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}
            center={safeCenter}
            zoom={hasValidCoords ? 16 : 2}
            marker={hasValidCoords ? {
              coordinates: adjustedCoordinates || safeCenter,
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
                  {t("editLocation.mapDialog.cancel")}
                </Button>
                <Button
                  onClick={handleConfirmPin}
                  className="gap-2"
                  rounded="full"
                >
                  <MapPin className="h-4 w-4" />
                  {t("editLocation.mapDialog.confirm")}
                </Button>
              </>
            }
          />
        );
      })()}
    </>
  );
};

export default EditLocationSlider;
