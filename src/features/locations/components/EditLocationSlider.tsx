import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../shared/components/ui/alert-dialog';
import { AssignmentsCard } from '../../../shared/components/common/AssignmentsCard';
import type { DeleteResponse } from '../../../shared/types/delete-response';
import { updateLocationAction, deleteLocationAction } from '../actions';
import type { EditLocationType } from '../types';
import type { LocationType, WorkingHours } from '../../../shared/types/location';
import { useForm, useController } from 'react-hook-form';
import { defaultWorkingHours } from '../constants';
import { selectCurrentUser } from '../../auth/selectors';
import { isE164, requiredEmailError, validateLocationName, validateDescription, sanitizePhoneToE164Draft } from '../../../shared/utils/validation';
import { getLocationLoadingSelector, getLocationErrorSelector, getIsDeletingSelector, getDeleteResponseSelector } from '../selectors';
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
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const locationError = useSelector(getLocationErrorSelector);
  const isLocationLoading = useSelector(getLocationLoadingSelector);
  const isDeleting = useSelector(getIsDeletingSelector);
  const deleteResponseFromState = useSelector(getDeleteResponseSelector);
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
      toast.error('Please enter a valid address first');
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
          toast.error('Could not find location on map. Please search for the correct address in the map.');
          setInitialMapCenter([0, 0]);
          setIsMapOpen(true);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast.error('Could not geocode address. Please adjust the pin manually.');
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
        toast.error('Please select a location on the map');
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
        toast.error('Please select a location on the map or search for an address');
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

    toast.success('Location pin confirmed');
  };

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
      toast.error("We couldn't update the location", {
        description: "Please check your information and try again.",
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [locationError, isSubmitting]);

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
    (isRemote || isAddressValid) &&
    (isRemote || isPinConfirmed); // Require pin confirmation for physical locations

  // Form should be disabled if:
  // - formState is not valid (has validation errors)
  // - Required fields are empty
  // - No changes were made to the form (not dirty) AND pin was not modified
  const isFormDisabled =
    !formState.isValid ||
    !areRequiredFieldsFilled ||
    (!formState.isDirty && !pinWasModified);

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
        title={location ? `Edit ${location.name}` : "Edit Location"}
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
                      preserveInitialData={true}
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
                      id="edit-location-description"
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
                    id="edit-location-contact-toggle-remote"
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
                      id="edit-location-description-remote"
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
                    Assignments
                  </h3>
                </div>

                <AssignmentsCard
                  stats={[
                    { label: 'Services', value: location.servicesCount || 0 },
                    { label: 'Team Members', value: location.teamMembersCount || 0 },
                  ]}
                  description="Manage which services and team members are assigned to this location. View and modify all assignments in the dedicated Assignments section."
                  buttonLabel="Go to Assignments"
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
                    Remove Location
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    This will permanently remove this location from your locations list. This action cannot be undone.
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
                        Removing...
                      </>
                    ) : (
                      'Remove Location'
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
              label: 'Go to Assignments',
              onClick: () => {
                handleCloseDeleteDialog(false);
                navigate(`/assignments?tab=locations&locationId=${location.id}`);
              }
            },
          ]}
        />
      )}

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
            title="Verify Location Pin"
            description="Adjust the pin to your exact location. You can drag the pin, click on the map, or search for a new address."
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
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPin}
                  className="gap-2"
                  rounded="full"
                >
                  <MapPin className="h-4 w-4" />
                  Confirm Location
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
