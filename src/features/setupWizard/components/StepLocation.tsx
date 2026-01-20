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
import TextField from "../../../shared/components/forms/fields/TextField";
import TextareaField from "../../../shared/components/forms/fields/TextareaField";
import RemoteLocationToggle from "../../../shared/components/common/RemoteLocationToggle";
import TimezoneField from "../../../shared/components/common/TimezoneField";
import ContactInformationToggle from "../../../shared/components/common/ContactInformationToggle";
import Open247Toggle from "../../../shared/components/common/Open247Toggle";
import { Label } from "../../../shared/components/ui/label";
import { Button } from "../../../shared/components/ui/button";
import { MapDialog } from "../../../shared/components/map";
import { maptilerGeocode } from "../../../shared/lib/maptiler";
import type { WizardData } from "../../../shared/hooks/useSetupWizard";
import { useForm, useController } from "react-hook-form";
import type { WorkingHours } from "../../../shared/types/location";
import type { StepProps, StepHandle, WizardFieldPath } from "../types";
import { isE164, requiredEmailError, validateLocationName, validateDescription, sanitizePhoneToE164Draft } from "../../../shared/utils/validation";
import { makeWizardToggleHandler } from "../utils";
import { useFieldDraftValidation } from "../../../shared/hooks/useDraftValidation";
import type { RootState } from "../../../app/providers/store";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { PinVerificationIndicator } from "../../../shared/components/common/PinVerificationIndicator";

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
      getValues,
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

    // Map pin confirmation state
    const [isPinConfirmed, setIsPinConfirmed] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [adjustedCoordinates, setAdjustedCoordinates] = useState<[number, number] | null>(null);
    const [initialMapCenter, setInitialMapCenter] = useState<[number, number]>([0, 0]);
    const [searchedAddressData, setSearchedAddressData] = useState<any>(null);
    const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
    const mapInstanceRef = useRef<any>(null);
    const isConfirmingFromMap = useRef(false); // Flag to prevent reset during map confirmation

    const isRemote = watch("location.isRemote" satisfies WizardFieldPath) === true;
    const businessEmail = (watch("businessInfo.email" satisfies WizardFieldPath) as string) || "";
    const businessPhone = (watch("businessInfo.phone" satisfies WizardFieldPath) as string) || "";
    
    // Sync isPinConfirmed state with form data and ensure mapPinConfirmed field exists
    const addressComponents = watch("location.addressComponents" satisfies WizardFieldPath) as any;
    useEffect(() => {
      if (addressComponents?.mapPinConfirmed) {
        setIsPinConfirmed(true);
      }
    }, [addressComponents?.mapPinConfirmed]);
    
    // Initialize mapPinConfirmed field if addressComponents exist but field is missing
    useEffect(() => {
      if (addressComponents && typeof addressComponents.mapPinConfirmed !== 'boolean') {
        setValue("location.addressComponents" satisfies WizardFieldPath, {
          ...addressComponents,
          mapPinConfirmed: false,
        } as any, {
          shouldDirty: false, // Don't mark as dirty, this is just initialization
        });
      }
    }, [addressComponents, setValue]);

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

    // Controlled timezone with validation (required only when remote)
    const { field: timezoneField, fieldState: timezoneState } =
      useController<WizardData, "location.timezone">({
        name: "location.timezone",
        control,
        rules: {
          validate: (value) => {
            // Get current isRemote value from form (not closure) to handle toggle changes
            const currentIsRemote = getValues("location.isRemote" satisfies WizardFieldPath) === true;
            // Only require timezone when location is remote
            if (!currentIsRemote) return true; // Skip validation for physical locations
            if (!value || value.trim().length === 0) {
              return "Timezone is required";
            }
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
      // Store coordinates in the suggestion data for later use
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
      const addressComponents = watch("location.addressComponents" satisfies WizardFieldPath) as any;
      const address = watch("location.address" satisfies WizardFieldPath) as string;
      
      // Check if we have coordinates
      const hasCoordinates = addressComponents?.latitude != null && addressComponents?.longitude != null;
      const hasAddress = address && address.trim().length > 0;

      if (!hasAddress) {
        toast.error('Please enter a valid address first');
        return;
      }
      
      if (hasCoordinates) {
        // Location has coordinates, use them
        setInitialMapCenter([
          addressComponents.longitude,
          addressComponents.latitude
        ]);
        setAdjustedCoordinates(null);
        setSearchedAddressData(null);
        setIsMapOpen(true);
      } else {
        // Location doesn't have coordinates - geocode the address first
        setIsGeocodingAddress(true);
        try {
          const geocodeResult = await maptilerGeocode(address);
          
          if (geocodeResult) {
            // Successfully geocoded - use these coordinates as initial position
            const geocodedCoords: [number, number] = [
              Number(geocodeResult.lon),
              Number(geocodeResult.lat)
            ];
            
            setInitialMapCenter(geocodedCoords);
            setAdjustedCoordinates(geocodedCoords); // Set as adjusted so user can confirm
            setIsMapOpen(true);
          } else {
            // Geocoding failed - show error
            toast.error('Could not find location on map. Please search for the correct address in the map.');
            // Still open map but with default center
            setInitialMapCenter([0, 0]); // Will need to search
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
      const addressComponents = watch("location.addressComponents" satisfies WizardFieldPath) as any;
      const currentAddress = watch("location.address" satisfies WizardFieldPath) as string;
      
      // Set flag to prevent address change effect from resetting pin confirmation
      isConfirmingFromMap.current = true;
      
      // CASE 1: User searched for a new address in the map → Override entire address
      if (searchedAddressData) {
        const displayName = searchedAddressData.displayName || currentAddress;
        const finalCoordinates = searchedAddressData.coordinates || adjustedCoordinates;
        
        if (!finalCoordinates) {
          toast.error('Please select a location on the map');
          return;
        }
        
        // Override entire address with new searched address
        setValue("location.address" satisfies WizardFieldPath, displayName, {
          shouldDirty: true,
          shouldTouch: true,
        });

        setValue("location.addressComponents" satisfies WizardFieldPath, {
          street: searchedAddressData.address || '',
          streetNumber: searchedAddressData.streetNumber || '',
          city: searchedAddressData.city || '',
          postalCode: searchedAddressData.postalCode || '',
          country: searchedAddressData.country || '',
          latitude: finalCoordinates[1],
          longitude: finalCoordinates[0],
          mapPinConfirmed: true,
        } as any, {
          shouldDirty: true,
          shouldTouch: true,
        });
        
        // Ensure manual mode is off for search-selected addresses
        setValue("location.addressManualMode" satisfies WizardFieldPath, false, {
          shouldDirty: true,
        });
        
        // Force remount of AddressComposer to reflect new address
        setAddressComposerKey(prev => prev + 1);
      } 
      // CASE 2: User only moved the pin → Override only lat/long
      else if (adjustedCoordinates) {
        setValue("location.addressComponents" satisfies WizardFieldPath, {
          ...addressComponents,
          latitude: adjustedCoordinates[1],
          longitude: adjustedCoordinates[0],
          mapPinConfirmed: true,
        } as any, {
          shouldDirty: true,
          shouldTouch: true,
        });
      } 
      // CASE 3: User just clicked confirm without changes → Set mapPinConfirmed to true
      else {
        // Get existing coordinates or use initialMapCenter
        let finalLat = addressComponents?.latitude;
        let finalLng = addressComponents?.longitude;
        
        // If no coordinates yet, use initialMapCenter (from geocoding)
        if ((!finalLat || !finalLng) && initialMapCenter[0] !== 0 && initialMapCenter[1] !== 0) {
          finalLng = initialMapCenter[0];
          finalLat = initialMapCenter[1];
        }
        
        if (!finalLat || !finalLng) {
          toast.error('Please select a location on the map or search for an address');
          return;
        }
        
        setValue("location.addressComponents" satisfies WizardFieldPath, {
          ...addressComponents,
          latitude: finalLat,
          longitude: finalLng,
          mapPinConfirmed: true,
        } as any, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      // Mark as confirmed and close map
      setIsPinConfirmed(true);
      setIsMapOpen(false);
      setAdjustedCoordinates(null);
      setSearchedAddressData(null);
      setInitialMapCenter([0, 0]);
      mapInstanceRef.current = null;

      // Persist the updated data immediately
      const updatedFormData = getValues();
      updateData?.(updatedFormData);

      // Reset flag after a short delay to allow effects to process
      setTimeout(() => {
        isConfirmingFromMap.current = false;
      }, 100);

      toast.success('Location pin confirmed');
    };

    // Per-field draft validation - only show errors for fields that actually have draft data
    const nameHasDraft = useFieldDraftValidation({
      fieldName: 'name',
      trigger,
      data,
      section: 'location',
    });
    const emailHasDraft = useFieldDraftValidation({
      fieldName: 'email',
      trigger,
      data,
      section: 'location',
    });
    const phoneHasDraft = useFieldDraftValidation({
      fieldName: 'phone',
      trigger,
      data,
      section: 'location',
    });
    const descriptionHasDraft = useFieldDraftValidation({
      fieldName: 'description',
      trigger,
      data,
      section: 'location',
    });
    const timezoneHasDraft = useFieldDraftValidation({
      fieldName: 'timezone',
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
          (isRemote || (isAddressValid && isPinConfirmed));
        onValidityChange(valid);
      }
    }, [formIsValid, errors, isAddressValid, isRemote, isPinConfirmed, onValidityChange]);

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        getFormData: () => {
          const formData = watch();
          // Ensure location contact fields are always present in the payload
          const location = formData.location || {};
          
          // Ensure mapPinConfirmed field exists in addressComponents
          const addressComps = location.addressComponents as any;
          if (addressComps && typeof addressComps.mapPinConfirmed !== 'boolean') {
            addressComps.mapPinConfirmed = false;
          }
          
          const result: Partial<WizardData> = {
            ...formData,
            location: {
              ...location,
              email: (emailField.value as string) || '',
              phone: (phoneField.value as string) || '',
              addressComponents: addressComps,
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
          if (!isRemote && !isPinConfirmed) return false;
          return formIsValid;
        },
      }),
      [watch, trigger, errors, formIsValid, isAddressValid, isRemote, isPinConfirmed, useBusinessContact, emailField, phoneField, timezoneField]
    );

    // Reset form ONLY once when wizard finishes loading (same pattern as business step)
    const isWizardLoading = useSelector((state: RootState) => state.setupWizard.isLoading);
    const hasInitialized = useRef(false);
    useEffect(() => {
      if (isWizardLoading || hasInitialized.current) return;
      reset(data);
      hasInitialized.current = true;
    }, [isWizardLoading, data, reset]);

    // Re-validate timezone when isRemote changes (to clear errors when switching to physical)
    useEffect(() => {
      if (isWizardLoading) return;
      trigger("location.timezone" satisfies WizardFieldPath);
    }, [isRemote, isWizardLoading, trigger]);

    // Remount address composer when toggling to physical location
    useEffect(() => {
      const prev = prevIsRemoteRef.current;
      if (prev && !isRemote) {
        setAddressComposerKey((k) => k + 1);
        setIsPinConfirmed(false); // Reset pin confirmation when switching to physical
      }
      prevIsRemoteRef.current = isRemote;
    }, [isRemote]);

    // Reset pin confirmation when address changes (but not during map confirmation)
    const addressValue = watch("location.address" satisfies WizardFieldPath) as string;
    const prevAddressRef = useRef<string | undefined>(undefined);
    
    useEffect(() => {
      // Skip reset if we're confirming from map (programmatic change)
      if (isConfirmingFromMap.current) {
        prevAddressRef.current = addressValue;
        return;
      }
      
      // Only reset if address actually changed (not just initial load or mapPinConfirmed change)
      if (!isRemote && addressValue && prevAddressRef.current && prevAddressRef.current !== addressValue) {
        setIsPinConfirmed(false);
        // Also reset mapPinConfirmed in form data
        const currentComponents = getValues("location.addressComponents" satisfies WizardFieldPath) as any;
        if (currentComponents?.mapPinConfirmed) {
          setValue("location.addressComponents" satisfies WizardFieldPath, {
            ...currentComponents,
            mapPinConfirmed: false,
          } as any, {
            shouldDirty: true,
          });
        }
      }
      prevAddressRef.current = addressValue;
    }, [addressValue, isRemote, setValue, getValues]);

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
                // Clear description and address when toggling between remote/physical
                // Keep name field - it works for both modes and better UX to preserve user input
                // Use resetField to clear both value and field state (touched, dirty, error)
                resetField("location.description" satisfies WizardFieldPath, { defaultValue: "" });
                resetField("location.address" satisfies WizardFieldPath, { defaultValue: "" });
                resetField("location.addressComponents" satisfies WizardFieldPath, { defaultValue: undefined });
              },
            })}
          />

          {/* Physical Location */}
          {!isRemote && (
            <div className="space-y-4">
              <TextField
                value={(nameField.value as string) || ""}
                onChange={(value) => nameField.onChange(value)}
                error={(nameState.isTouched || nameState.isDirty || nameHasDraft) ? (nameState.error?.message as unknown as string) : undefined}
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

              {/* Pin Verification Indicator */}
              {isAddressValid && watch("location.address" satisfies WizardFieldPath) && (
                <PinVerificationIndicator
                  isPinConfirmed={isPinConfirmed}
                  isGeocodingAddress={isGeocodingAddress}
                  onVerifyClick={handleVerifyPinClick}
                />
              )}

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
                emailError={!useBusinessContact && (emailState.isTouched || emailState.isDirty || emailHasDraft) ? (emailState.error?.message as unknown as string) : undefined}
                phoneError={!useBusinessContact && (phoneState.isTouched || phoneState.isDirty || phoneHasDraft) ? (phoneState.error?.message as unknown as string) : undefined}
                title="Contact information"
                emailLabel="Location Email *"
                phoneLabel="Location Phone *"
                helperTextOn="Your business contact info will be used for this location."
                helperTextOff="Provide different contact details for this location."
              />

              <div className="pt-4">
                <TextareaField
                  value={(descriptionField.value as string) || ""}
                  onChange={(value) => descriptionField.onChange(value)}
                  error={(descriptionState.isTouched || descriptionState.isDirty || descriptionHasDraft) ? (descriptionState.error?.message as string) : undefined}
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
              <TextField
                value={(nameField.value as string) || ""}
                onChange={(value) => nameField.onChange(value)}
                error={(nameState.isTouched || nameState.isDirty || nameHasDraft) ? (nameState.error?.message as unknown as string) : undefined}
                isRemote
                required
                placeholder="Online"
              />

              <TimezoneField
                value={(timezoneField.value as string) || ""}
                onChange={(tz) => timezoneField.onChange(tz)}
                error={
                  (timezoneState.isTouched || timezoneState.isDirty || timezoneHasDraft)
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
                emailError={!useBusinessContact && (emailState.isTouched || emailState.isDirty || emailHasDraft) ? (emailState.error?.message as unknown as string) : undefined}
                phoneError={!useBusinessContact && (phoneState.isTouched || phoneState.isDirty || phoneHasDraft) ? (phoneState.error?.message as unknown as string) : undefined}
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
              className="z-[100]"
              overlayClassName="z-[100]"
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
      </div>
    );
  }
);

StepLocation.displayName = "StepLocation";

export default StepLocation;
