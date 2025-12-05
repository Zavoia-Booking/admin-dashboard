import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Users, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Label } from '../../../shared/components/ui/label';
import { Button } from '../../../shared/components/ui/button';
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
import { MapDialog } from '../../../shared/components/map';
import { locationIqGeocode } from '../../../shared/lib/locationiq';
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
  addressComponents: undefined,
  addressManualMode: false,
  mapPinConfirmed: false,
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
        const geocodeResult = await locationIqGeocode(address);
        
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

    toast.success('Location pin confirmed');
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
                      alwaysClearOnSwitch={true}
                    />
                    
                    {/* Map Pin Verification Indicator */}
                    {isAddressValid && addressValue && addressValue.trim().length > 0 && (
                      <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                        isPinConfirmed 
                          ? 'bg-success-bg/50 border-success-border' 
                          : 'bg-warning-bg/50 border-warning-border'
                      }`}>
                        <div className="flex-shrink-0">
                          {isPinConfirmed ? (
                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${
                            isPinConfirmed ? 'text-success' : 'text-warning'
                          }`}>
                            {isPinConfirmed ? 'Location pin confirmed' : 'Location pin verification required'}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isPinConfirmed 
                              ? 'Your location pin has been verified on the map.'
                              : 'Please confirm the exact location of your pin on the map.'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant={isPinConfirmed ? "outline" : "default"}
                          size="sm"
                          rounded="full"
                          onClick={handleVerifyPinClick}
                          disabled={isGeocodingAddress}
                          className="flex-shrink-0"
                        >
                          {isGeocodingAddress ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-2" />
                              {isPinConfirmed ? 'Move Pin' : 'Verify Pin on Map'}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
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
            apiKey={import.meta.env.VITE_MAPTILER_API_KEY || ''}
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

export default AddLocationSlider; 