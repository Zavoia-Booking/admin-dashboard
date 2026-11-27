import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, Info } from 'lucide-react';
import { PinVerificationIndicator } from '../../../shared/components/common/PinVerificationIndicator';
import { Label } from '../../../shared/components/ui/label';
import { Button } from '../../../shared/components/ui/button';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import AddressComposer from '../../../shared/components/address/AddressComposer';
import ContactInformationToggle from '../../../shared/components/common/ContactInformationToggle';
import WorkingHoursEditor from '../../../shared/components/common/WorkingHoursEditor';
import Open247Toggle from '../../../shared/components/common/Open247Toggle';
import { DeleteConfirmDialog } from '../../../shared/components/common/DeleteConfirmDialog';
import { MapDialog } from '../../../shared/components/map';
import { locateTypedAddress } from '../../../shared/lib/maptiler';
import { AssignmentsCard } from '../../../shared/components/common/AssignmentsCard';
import { useDiscardChanges } from '../../../shared/hooks/useDiscardChanges';
import { useLocationPinState, pinKey, hasRealCoords, pinMapZoom } from '../../../shared/hooks/useLocationPinState';
import type { DeleteResponse } from '../../../shared/types/delete-response';
import { updateLocationAction, deleteLocationAction, setLocationHoursConflictOffer } from '../actions';
import type { EditLocationType } from '../types';
import type { LocationType, WorkingHours } from '../../../shared/types/location';
import { useForm, useController } from 'react-hook-form';
import { defaultWorkingHours } from '../constants';
import { selectCurrentUser } from '../../auth/selectors';
import { isE164, sanitizePhoneToE164Draft } from '../../../shared/utils/validation';
import { getLocationUpdateStatusSelector, getIsDeletingSelector, getDeleteResponseSelector, getLocationHoursConflictOfferSelector } from '../selectors';
import { LocationHoursConflictDialog } from './LocationHoursConflictDialog';
import { toast } from 'sonner';
import { mapLocationForEdit } from '../utils';

// Where the map looks when the address could not be located – Bucharest [lng, lat]; it opens there without a pin
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
  const updateStatus = useSelector(getLocationUpdateStatusSelector);
  const isSaving = updateStatus === 'pending';
  const isDeleting = useSelector(getIsDeletingSelector);
  const deleteResponseFromState = useSelector(getDeleteResponseSelector);
  const hoursConflictOffer = useSelector(getLocationHoursConflictOfferSelector);
  const businessCountryCode = currentUser?.business?.countryCode || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBusinessContact, setUseBusinessContact] = useState<boolean>(false);
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [addressComposerKey, setAddressComposerKey] = useState(0);
  const originalUseBusinessContactRef = useRef(false);
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
  const [mapZoom, setMapZoom] = useState(16);
  const [mapFoundLevel, setMapFoundLevel] = useState<'address' | 'street' | 'town' | undefined>(undefined);
  const { isConfirmed: isPinKeyConfirmed, markConfirmed: markPinConfirmed, reset: resetPins, version: pinVersion, setHint: setPinHint, hintFor: pinHintFor, notePlace: notePinPlace, placeChanged: pinPlaceChanged } = useLocationPinState();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
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
      open247: false,
      workingHours: defaultWorkingHours,
      mapPinConfirmed: false,
    },
    mode: "onChange",
  });

  const currentWorkingHours = watch('workingHours') as WorkingHours || defaultWorkingHours;
  const open247 = watch('open247') ?? false;

  // Get business contact info (if available from user/business)
  const businessEmail = currentUser?.business?.email || currentUser?.email || "";
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
        if (v.length > 50) return t("addLocation.validation.nameMaxLength");
        const NAME_PATTERN = /^[\p{L}0-9\s\-'’&.()]+$/u;
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
    const level = suggestion?.precision === 'street' ? 'street' as const : undefined;
    setMapFoundLevel(level);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: coordinates, zoom: pinMapZoom(level), essential: true });
    }
  };

  const handleMapLoad = (map: any) => {
    mapInstanceRef.current = map;
  };

  const handleVerifyPinClick = async () => {
    const addressComponents = watch('addressComponents') as any;
    const address = watch('address') as string;

    const hasCoordinates = hasRealCoords(addressComponents?.latitude, addressComponents?.longitude);
    const hasAddress = address && address.trim().length > 0;

    if (!hasAddress) {
      toast.error(t("editLocation.toasts.validAddressFirst"));
      return;
    }

    const lng = Number(addressComponents?.longitude);
    const lat = Number(addressComponents?.latitude);
    const openOnStoredPin = () => {
      const level = isPinKeyConfirmed(pinKey(address, lat, lng)) ? null : pinHintFor(lat, lng);
      setMapZoom(pinMapZoom(level));
      setMapFoundLevel(level ?? undefined);
      setInitialMapCenter([lng, lat]);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setIsMapOpen(true);
    };
    // No pin is placed for the owner: Confirm must never save a spot nobody chose
    const openWithoutPin = () => {
      setInitialMapCenter([0, 0]);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setMapZoom(16);
      setMapFoundLevel(undefined);
      setIsMapOpen(true);
    };

    // The stored pin is reused unless the street or town was changed after it was set
    if (hasCoordinates && !pinPlaceChanged(lat, lng, addressComponents?.street, addressComponents?.city)) {
      openOnStoredPin();
    } else {
      setIsGeocodingAddress(true);
      try {
        const geocodeResult = await locateTypedAddress({
          street: addressComponents?.street ?? '',
          streetNumber: addressComponents?.streetNumber ?? '',
          city: addressComponents?.city ?? '',
          postalCode: addressComponents?.postalCode ?? '',
        }, businessCountryCode);

        if (geocodeResult) {
          const geocodedCoords: [number, number] = geocodeResult.lngLat;
          setMapZoom(pinMapZoom(geocodeResult.level));
          setMapFoundLevel(geocodeResult.level);

          setInitialMapCenter(geocodedCoords);
          setAdjustedCoordinates(geocodedCoords);
          setIsMapOpen(true);
        } else {
          toast.error(t("editLocation.toasts.couldNotFindLocation"));
          if (hasCoordinates) openOnStoredPin();
          else openWithoutPin();
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast.error(t("editLocation.toasts.couldNotGeocode"));
        if (hasCoordinates) openOnStoredPin();
        else openWithoutPin();
      } finally {
        setIsGeocodingAddress(false);
      }
    }
  };

  const handleConfirmPin = () => {
    const addressComponents = watch('addressComponents') as any;
    const currentAddress = watch('address') as string;

    let finalCoordinates: [number, number];

    // CASE 1: User searched for a new address in the map
    if (searchedAddressData) {
      const displayName = searchedAddressData.displayName || currentAddress;
      // The pick also set adjustedCoordinates; a pin moved after it wins.
      finalCoordinates = adjustedCoordinates || searchedAddressData.coordinates;

      if (!finalCoordinates) {
        toast.error(t("editLocation.toasts.selectLocationOnMap"));
        return;
      }

      markPinConfirmed(pinKey(displayName, finalCoordinates[1], finalCoordinates[0]));
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
      markPinConfirmed(pinKey(currentAddress, adjustedCoordinates[1], adjustedCoordinates[0]));
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

      markPinConfirmed(pinKey(currentAddress, finalLat, finalLng));
      setValue('addressComponents', {
        ...addressComponents,
        latitude: finalLat,
        longitude: finalLng,
      } as any, { shouldDirty: true, shouldTouch: true });
    }

    // The pin now belongs to this street + town
    const pinned = getValues('addressComponents') as any;
    notePinPlace(pinned?.latitude, pinned?.longitude, pinned?.street, pinned?.city);

    // Set mapPinConfirmed at the top level (not in addressComponents)
    setValue('mapPinConfirmed' as any, true, { shouldDirty: true, shouldTouch: true });
    setIsPinConfirmed(true);
    setPinWasModified(true); // Mark that pin was modified in this session
    setIsMapOpen(false);
    setAdjustedCoordinates(null);
    setSearchedAddressData(null);
    setInitialMapCenter([0, 0]);
    setMapZoom(16);
    setMapFoundLevel(undefined);
    mapInstanceRef.current = null;

    // Re-run validation so formState.isValid updates and Update button can enable
    void trigger();

    toast.success(t("editLocation.toasts.pinConfirmed"));
  };

  // Initialize form with location data when slider opens
  useEffect(() => {
    if (location && isOpen) {
      const mapped = mapLocationForEdit(location);

      const savedUseBusinessContact = !!location.useBusinessContact;
      originalUseBusinessContactRef.current = savedUseBusinessContact;
      setUseBusinessContact(savedUseBusinessContact);

      // Always reset to server data when opening to ensure we don't keep unsaved changes
      reset({
        ...mapped,
        // A linked location shows and saves the business contact it follows.
        ...(savedUseBusinessContact && businessEmail && businessPhone ? { email: businessEmail, phone: businessPhone } : {}),
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
      dispatch(setLocationHoursConflictOffer(null));
    }
  }, [isOpen]);

  // Initialize pin confirmation status from server data (top-level mapPinConfirmed)
  useEffect(() => {
    if (location && isOpen) {
      resetPins();
      const c = (location as any).addressComponents;
      notePinPlace(c?.latitude, c?.longitude, c?.street, c?.city);
      if ((location as any).mapPinConfirmed === true) {
        markPinConfirmed(pinKey(location.address, c?.latitude, c?.longitude));
      }
    }
  }, [location, isOpen, resetPins, markPinConfirmed, notePinPlace]);

  const watchedAddress = watch('address');
  const watchedComponents = watch('addressComponents') as any;
  useEffect(() => {
    // read fresh values: the open effect above calls reset() in the same commit
    const c = getValues('addressComponents') as any;
    const ok = isPinKeyConfirmed(pinKey(getValues('address'), c?.latitude, c?.longitude));
    setIsPinConfirmed(ok);
    if (((getValues('mapPinConfirmed' as any) as boolean | undefined) ?? false) !== ok) setValue('mapPinConfirmed' as any, ok);
  }, [watchedAddress, watchedComponents?.latitude, watchedComponents?.longitude, pinVersion, getValues, setValue, isPinKeyConfirmed]);

  // Reset map state when slider closes
  useEffect(() => {
    if (!isOpen) {
      setIsMapOpen(false);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setInitialMapCenter([0, 0]);
      setMapZoom(16);
      setMapFoundLevel(undefined);
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

  useEffect(() => {
    if (!isOpen || !isSubmitting || justOpenedRef.current) return;
    if (updateStatus === 'failure') setIsSubmitting(false);
    if (updateStatus === 'success') onClose();
  }, [isOpen, isSubmitting, onClose, updateStatus]);

  // A 409 offer ends this submit; the form stays open with the edits.
  useEffect(() => {
    if (hoursConflictOffer && isSubmitting) setIsSubmitting(false);
  }, [hoursConflictOffer, isSubmitting]);

  const handleSaveHoursAnyway = () => {
    if (!hoursConflictOffer) return;
    dispatch(setLocationHoursConflictOffer(null));
    setIsSubmitting(true);
    dispatch(updateLocationAction.request({ location: { ...hoursConflictOffer.payload, overrideConflicts: true } }));
  };

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
      }
    },
    [setValue, businessEmail, businessPhone]
  );

  // Check if required fields are filled
  const nameValue = watch("name");
  const addressValue = watch("address");
  const emailValue = watch("email");
  const phoneValue = watch("phone");

  const areRequiredFieldsFilled =
    nameValue &&
    nameValue.trim().length > 0 &&
    addressValue &&
    addressValue.trim().length > 0 &&
    emailValue &&
    emailValue.trim().length > 0 &&
    phoneValue &&
    phoneValue.trim().length > 0 &&
    isAddressValid &&
    isPinConfirmed; // Require pin confirmation

  const hasRelevantChanges = formState.isDirty || pinWasModified || useBusinessContact !== originalUseBusinessContactRef.current;
  const { canClose, requestClose, requestAction, dialogProps } = useDiscardChanges({
    isOpen,
    isDirty: () => hasRelevantChanges || useBusinessContact !== originalUseBusinessContactRef.current,
    isSaving: isSubmitting || isSaving || isDeleting,
    onClose,
  });

  // Form should be disabled if:
  // - formState is not valid (has validation errors)
  // - Required fields are empty
  // - No changes (any dirty field or pin confirmation)
  const isFormDisabled =
    !formState.isValid ||
    !areRequiredFieldsFilled ||
    !hasRelevantChanges;

  const onSubmit = () => {
    // Prevent double submission
    if (isSubmitting || isSaving || !location) {
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

  const requestNavigation = (destination: string) => {
    requestAction(() => navigate(destination));
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
        onBeforeClose={canClose}
        title={location ? t("editLocation.title", { name: location.name }) : t("editLocation.titleFallback")}
        subtitle={t("editLocation.subtitle")}
        icon={MapPin}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={requestClose}
            formId="edit-location-form"
            cancelLabel={t("editLocation.buttons.cancel")}
            submitLabel={t("editLocation.buttons.update")}
            disabled={isFormDisabled || isSubmitting || isSaving}
            isLoading={isSubmitting || isSaving}
          />
        }
      >
        <form
          id="edit-location-form"
          onSubmit={handleSubmit(onSubmit)}
          className="cursor-default"
        >
          {/* BaseSlider owns scrolling so collapsing hours cannot leave a second scroll offset. */}
          <div className="p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            <div className="max-w-2xl mx-auto space-y-6 cursor-default">
              <div className="space-y-4">
                  <TextField
                    id="edit-location-name"
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label={t("editLocation.form.nameLabel")}
                    placeholder={t("editLocation.form.namePlaceholder")}
                    required
                    maxLength={50}
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
                      onSuggestionPicked={(s) => { setPinHint(s.lat, s.lng, s.precision ?? 'address'); notePinPlace(s.lat, s.lng, s.address, s.city); }}
                      countryCodes={businessCountryCode ? [businessCountryCode] : undefined}
                    />

                    {/* Map pin status; a confirmed pin stays visible while a part of the address is still missing */}
                    {(isAddressValid || isPinConfirmed) && addressValue && addressValue.trim().length > 0 && (
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
                    revertLabel={t("editLocation.form.useBusinessContact")}
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
                  onButtonClick={() => requestNavigation(`/assignments?tab=locations&locationId=${location.id}`)}
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

      <LocationHoursConflictDialog
        offer={hoursConflictOffer}
        locationId={location?.id ?? null}
        fallbackTimezone={location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
        onCancel={() => dispatch(setLocationHoursConflictOffer(null))}
        onSaveAnyway={handleSaveHoursAnyway}
      />

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
            ...(deleteResponse?.websiteGalleryImagesCount
              ? [{
                  label: t("editLocation.removeLocation.goToWebsiteGallery"),
                  onClick: () => {
                    handleCloseDeleteDialog(false);
                    requestNavigation("/website");
                  },
                }]
              : []),
            ...(deleteResponse &&
            ((deleteResponse.activeUsersCount ?? 0) > 0 ||
              (deleteResponse.pendingUsersCount ?? 0) > 0 ||
              (deleteResponse.servicesCount ?? 0) > 0)
              ? [{
                  label: t("editLocation.assignments.goToAssignments"),
                  onClick: () => {
                    handleCloseDeleteDialog(false);
                    requestNavigation(`/assignments?tab=locations&locationId=${location.id}`);
                  },
                }]
              : []),
          ]}
        />
      )}

      {/* Map Pin Verification Dialog – never pass [0,0] to map (ocean); the view falls back to Bucharest, without a pin.
          Kept mounted (isOpen-driven) so vaul can play its exit animation:
          unmounting it mid-tap lets the browser's synthesized post-touch
          click fall through to the outer slider's overlay on touch devices,
          dismissing the whole slider. */}
      {(() => {
        const hasValidCoords = !isInvalidCenter(initialMapCenter);
        const safeCenter: [number, number] = hasValidCoords ? initialMapCenter : FALLBACK_MAP_CENTER;

        return (
          <MapDialog
            isOpen={isMapOpen}
            onClose={() => {
              setIsMapOpen(false);
              setAdjustedCoordinates(null);
              setSearchedAddressData(null);
              setInitialMapCenter([0, 0]);
              setMapZoom(16);
              setMapFoundLevel(undefined);
              mapInstanceRef.current = null;
            }}
            title={t("editLocation.mapDialog.title")}
            description={t("editLocation.mapDialog.description")}
            accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}
            center={safeCenter}
            zoom={hasValidCoords ? mapZoom : 2}
            foundLevel={hasValidCoords ? mapFoundLevel : undefined}
            // No pin until the owner clicks or searches when nothing was located; kept while closing so the exit animation doesn't change
            marker={hasValidCoords || adjustedCoordinates || !isMapOpen ? {
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
            className="z-[90]"
            overlayClassName="z-[85]"
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
                    setMapZoom(16);
                    setMapFoundLevel(undefined);
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
      <ConfirmDialog {...dialogProps} />
    </>
  );
};

export default EditLocationSlider;
