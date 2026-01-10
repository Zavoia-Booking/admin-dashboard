import { useCallback, useState, useEffect, useRef } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import { composeFullAddress } from '../../utils/address';
import { useAddressManualFields } from '../../hooks/useAddressManualFields';
import AddressManualFields from './AddressManualFields';
import SegmentedControl from '../common/SegmentedControl';

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  addressComponents?: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    mapPinConfirmed?: boolean;
  };
  onAddressComponentsChange?: (components: {
    street: string;
    streetNumber: string;
    city: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    mapPinConfirmed?: boolean;
  }) => void;
  onValidityChange?: (isValid: boolean) => void;
  manualMode?: boolean; // External control of manual vs search mode
  onManualModeChange?: (isManual: boolean) => void; // Callback to persist mode changes
  preserveInitialData?: boolean; // If true, original server data is preserved and not updated by user actions
  alwaysClearOnSwitch?: boolean; // If true, always clear everything when switching modes (for Add Location)
};

export default function AddressComposer({ value, onChange, className, addressComponents, onAddressComponentsChange, onValidityChange, manualMode: externalManualMode, onManualModeChange, preserveInitialData = false, alwaysClearOnSwitch = false }: Props) {
  const [addressSelected, setAddressSelected] = useState(false);
  const lastSelectedRef = useRef<{ s: string; n: string; c: string; p: string; co: string; display: string } | null>(null);
  const [manualEdited, setManualEdited] = useState(false);
  const draftMode = useRef<boolean | null>(null); // Track which mode the draft was saved in (null = no draft, false = search, true = manual)
  const originalDraftData = useRef<{ components: any; address: string; mode: boolean } | null>(null); // Preserve original draft data
  const {
    streetBase,
    actualStreet,
    streetNumber,
    city,
    postalCode,
    country,
    streetError,
    numberError,
    cityError,
    postalError,
    countryError,
    onStreetChange,
    onNumberChange,
    onCityChange,
    onPostalChange,
    onCountryChange,
    hydrateFromComponents,
  } = useAddressManualFields({
    components: addressComponents,
    fullAddressDisplay: value, // pass the saved full address for display in locked street input
    onChange: (next) => onChange(next),
    onComponentsChange: (c) => onAddressComponentsChange?.(c),
    onValidityChange,
  });
  // Use external manualMode if provided, otherwise maintain internal state
  const [internalManualMode, setInternalManualMode] = useState(false);
  const manualMode = externalManualMode ?? internalManualMode;
  const [searchKey, setSearchKey] = useState(0);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [hasLoadedFromDraft, setHasLoadedFromDraft] = useState(false);

  // full composed address is derived on demand via composeFullAddress

  // When addressComponents prop changes (from saved draft), populate all fields and track draft mode
  useEffect(() => {
    if (!hasLoadedFromDraft && addressComponents && (addressComponents.street || addressComponents.city)) {
      setAddressSelected(true);
      setHasLoadedFromDraft(true);
      // Remember which mode the draft was saved in and preserve the original data
      draftMode.current = externalManualMode ?? false;
      originalDraftData.current = {
        components: { ...addressComponents },
        address: value || '',
        mode: externalManualMode ?? false
      };
    }
  }, [addressComponents, hasLoadedFromDraft, externalManualMode, value]);

  // Bubble validity to parent (e.g., to disable Continue button)
  useEffect(() => {
    const editorActive = manualMode || addressSelected;
    const hasErrors = Boolean(streetError || numberError || cityError || postalError || countryError);
    // Any required field empty => invalid (even if untouched), for both manual and search-selected modes
    const requiredEmpty = [streetBase, streetNumber, city, postalCode, country].some(v => !(v && v.trim().length > 0));
    // In search mode with no selection, mark invalid (Step handles remote bypass)
    const isValid = editorActive ? (!hasErrors && !requiredEmpty) : false;
    onValidityChange?.(isValid);
  }, [manualMode, addressSelected, streetError, numberError, cityError, postalError, countryError, streetBase, streetNumber, city, postalCode, country, onValidityChange]);

  const handleAutocompleteChange = useCallback((c: { address: string; suggestion?: any | null }) => {
    setShouldAutoFocus(false);
    if (c.suggestion) {
      const s = c.suggestion as { address?: string; streetNumber?: string; displayName?: string; city?: string; postalCode?: string; country?: string; lat?: number; lng?: number };
      const streetName = s.address ?? '';
      const number = s.streetNumber ?? '';
      // Use the full displayName which already contains the complete address
      const fullAddress = s.displayName ?? c.address;
      // Hydrate exact components; display value is handled in UI, but keep street free in manual mode
      // Reset errors since data from LocationIQ is trusted
      hydrateFromComponents(streetName, number, s.city ?? '', s.postalCode ?? '', s.country ?? '', fullAddress, true);
      lastSelectedRef.current = { s: streetName, n: number, c: s.city ?? '', p: s.postalCode ?? '', co: s.country ?? '', display: fullAddress };
      setManualEdited(false);
      setAddressSelected(true);
      setManualMode(false);
      // User selected a new address in search mode - update draft mode and original data
      draftMode.current = false;
      // Only update originalDraftData if NOT in alwaysClearOnSwitch mode
      if (!alwaysClearOnSwitch) {
        originalDraftData.current = {
          components: {
            street: streetName,
            streetNumber: number,
            city: s.city ?? '',
            postalCode: s.postalCode ?? '',
            country: s.country ?? '',
            latitude: s.lat,
            longitude: s.lng,
            mapPinConfirmed: false,
          },
          address: fullAddress,
          mode: false
        };
      }
      // Save the full display name as the address, not the composed version
      onChange(fullAddress);
      onAddressComponentsChange?.({ 
        street: streetName, 
        streetNumber: number, 
        city: s.city ?? '', 
        postalCode: s.postalCode ?? '', 
        country: s.country ?? '',
        latitude: s.lat,
        longitude: s.lng,
        mapPinConfirmed: false, // Reset to false when selecting new address from search
      });
      return;
    }
    // User is typing but didn't select a suggestion yet — keep search mode
    setAddressSelected(false);
    setManualMode(false);
    // Reset components fully; do not mark fields as touched on reset
    hydrateFromComponents('', '', '', '', '');
    lastSelectedRef.current = null;
    onChange(c.address);
  }, [onChange, onAddressComponentsChange]);

  const handleStreetNumberChange = useCallback((next: string) => {
    setManualEdited(true);
    onNumberChange(next);
  }, [onNumberChange]);

  const handlePostcodeChange = useCallback((next: string) => {
    setManualEdited(true);
    onPostalChange(next);
  }, [onPostalChange]);

  const handleCityChange = useCallback((next: string) => {
    setManualEdited(true);
    onCityChange(next);
  }, [onCityChange]);

  const handleCountryChange = useCallback((next: string) => {
    setManualEdited(true);
    onCountryChange(next);
  }, [onCountryChange]);

  // Helper to update mode state
  const setManualMode = useCallback((isManual: boolean) => {
    if (onManualModeChange) {
      onManualModeChange(isManual);
    } else {
      setInternalManualMode(isManual);
    }
  }, [onManualModeChange]);

  // Segmented control handlers
  const handleSelectSearchMode = useCallback(() => {
    // If alwaysClearOnSwitch is true, always clear everything (for Add Location)
    if (alwaysClearOnSwitch) {
      setManualMode(false);
      setAddressSelected(false);
      hydrateFromComponents('', '', '', '', '');
      lastSelectedRef.current = null;
      setManualEdited(false);
      onChange('');
      onAddressComponentsChange?.({
        street: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        country: '',
        latitude: undefined,
        longitude: undefined,
        mapPinConfirmed: false,
      });
      setShouldAutoFocus(true);
      setSearchKey(prev => prev + 1);
      return;
    }
    
    // If preserving initial data, only restore if original was in search mode
    if (preserveInitialData) {
      if (originalDraftData.current && originalDraftData.current.mode === false) {
        const draft = originalDraftData.current;
        setManualMode(false);
        setAddressSelected(true);
        hydrateFromComponents(
          draft.components.street || '',
          draft.components.streetNumber || '',
          draft.components.city || '',
          draft.components.postalCode || '',
          draft.components.country || '',
          draft.address,
          true
        );
        onChange(draft.address);
        onAddressComponentsChange?.({
          street: draft.components.street || '',
          streetNumber: draft.components.streetNumber || '',
          city: draft.components.city || '',
          postalCode: draft.components.postalCode || '',
          country: draft.components.country || '',
          latitude: draft.components.latitude,
          longitude: draft.components.longitude,
          mapPinConfirmed: draft.components.mapPinConfirmed ?? false,
        });
        return;
      }
      // Not the original mode, clear everything
      setManualMode(false);
      setAddressSelected(false);
      hydrateFromComponents('', '', '', '', '');
      lastSelectedRef.current = null;
      onChange('');
      onAddressComponentsChange?.({
        street: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        country: '',
        latitude: undefined,
        longitude: undefined,
        mapPinConfirmed: false,
      });
      setShouldAutoFocus(true);
      setSearchKey(prev => prev + 1);
      return;
    }
    
    // Original wizard behavior: restore last selected if not edited
    if (!manualEdited && lastSelectedRef.current) {
      const { s, n, c, p, co, display } = lastSelectedRef.current;
      setManualMode(false);
      setAddressSelected(true);
      hydrateFromComponents(s, n, c, p, co, display);
      onChange(composeFullAddress(s, n, c, p, co));
      return;
    }
    
    // If draft was saved in search mode, restore the ORIGINAL draft data
    if (originalDraftData.current && originalDraftData.current.mode === false) {
      const draft = originalDraftData.current;
      setManualMode(false);
      setAddressSelected(true);
      hydrateFromComponents(
        draft.components.street || '',
        draft.components.streetNumber || '',
        draft.components.city || '',
        draft.components.postalCode || '',
        draft.components.country || '',
        draft.address,
        true
      );
      onChange(draft.address);
      // Restore original draft components including coordinates
      onAddressComponentsChange?.({
        street: draft.components.street || '',
        streetNumber: draft.components.streetNumber || '',
        city: draft.components.city || '',
        postalCode: draft.components.postalCode || '',
        country: draft.components.country || '',
        latitude: draft.components.latitude,
        longitude: draft.components.longitude,
        mapPinConfirmed: draft.components.mapPinConfirmed ?? false,
      });
      return;
    }
    
    // Otherwise clear everything and start fresh search
    setManualMode(false);
    setAddressSelected(false);
    hydrateFromComponents('', '', '', '', '');
    lastSelectedRef.current = null;
    onChange('');
    
    // Clear address components including coordinates
    onAddressComponentsChange?.({
      street: '',
      streetNumber: '',
      city: '',
      postalCode: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
      mapPinConfirmed: false,
    });
    
    setShouldAutoFocus(true);
    setSearchKey(prev => prev + 1);
  }, [alwaysClearOnSwitch, preserveInitialData, manualEdited, onChange, hydrateFromComponents, setManualMode, onAddressComponentsChange]);

  const handleSelectManualMode = useCallback(() => {
    setManualMode(true);
    setAddressSelected(true);
    
    // If alwaysClearOnSwitch is true, always clear everything (for Add Location)
    if (alwaysClearOnSwitch) {
      hydrateFromComponents('', '', '', '', '', undefined, true);
      onAddressComponentsChange?.({
        street: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        country: '',
        latitude: undefined,
        longitude: undefined,
        mapPinConfirmed: false,
      });
      setManualEdited(false);
      onChange('');
      return;
    }
    
    // If preserving initial data, only restore if original was in manual mode
    if (preserveInitialData) {
      if (originalDraftData.current && originalDraftData.current.mode === true) {
        const draft = originalDraftData.current;
        hydrateFromComponents(
          draft.components.street || '',
          draft.components.streetNumber || '',
          draft.components.city || '',
          draft.components.postalCode || '',
          draft.components.country || '',
          undefined,
          true
        );
        onChange(draft.address);
        onAddressComponentsChange?.({
          street: draft.components.street || '',
          streetNumber: draft.components.streetNumber || '',
          city: draft.components.city || '',
          postalCode: draft.components.postalCode || '',
          country: draft.components.country || '',
          latitude: draft.components.latitude,
          longitude: draft.components.longitude,
          mapPinConfirmed: draft.components.mapPinConfirmed ?? false,
        });
        setManualEdited(false);
        return;
      }
      // Not the original mode, clear everything
      hydrateFromComponents('', '', '', '', '', undefined, true);
      onAddressComponentsChange?.({
        street: '',
        streetNumber: '',
        city: '',
        postalCode: '',
        country: '',
        latitude: undefined,
        longitude: undefined,
        mapPinConfirmed: false,
      });
      setManualEdited(false);
      onChange('');
      return;
    }
    
    // Original wizard behavior: restore if draft was saved in manual mode
    if (originalDraftData.current && originalDraftData.current.mode === true) {
      const draft = originalDraftData.current;
      hydrateFromComponents(
        draft.components.street || '',
        draft.components.streetNumber || '',
        draft.components.city || '',
        draft.components.postalCode || '',
        draft.components.country || '',
        undefined,
        true
      );
      onChange(draft.address);
      // Restore original draft components including coordinates
      onAddressComponentsChange?.({
        street: draft.components.street || '',
        streetNumber: draft.components.streetNumber || '',
        city: draft.components.city || '',
        postalCode: draft.components.postalCode || '',
        country: draft.components.country || '',
        latitude: draft.components.latitude,
        longitude: draft.components.longitude,
        mapPinConfirmed: draft.components.mapPinConfirmed ?? false,
      });
      setManualEdited(false);
      return;
    }
    
    // Otherwise clear everything when switching to manual mode
    hydrateFromComponents('', '', '', '', '', undefined, true);
    
    // Clear address components including coordinates
    onAddressComponentsChange?.({
      street: '',
      streetNumber: '',
      city: '',
      postalCode: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
      mapPinConfirmed: false,
    });
    
    setManualEdited(false);
    onChange('');
  }, [alwaysClearOnSwitch, preserveInitialData, onChange, setManualMode, hydrateFromComponents, onAddressComponentsChange]);

  const handleChangeAddressClick = useCallback(() => {
    setManualMode(false);
    setAddressSelected(false);
    hydrateFromComponents('', '', '', '', '');
    lastSelectedRef.current = null;
    onChange('');
    setShouldAutoFocus(true);
    // Force remount of AddressAutocomplete to clear and focus
    setSearchKey(prev => prev + 1);
  }, [onChange, hydrateFromComponents]);


  const [showStreetTip, setShowStreetTip] = useState(false);
  const handleStreetFocus = useCallback(() => {
    setShowStreetTip(true);
  }, []);

  const handleStreetBlur = useCallback(() => {
    setShowStreetTip(false);
  }, []);

  return (
    <div className={className}>
      <SegmentedControl
        options={[{ value: 'search', label: 'Search' }, { value: 'manual', label: 'Manual' }]}
        value={manualMode ? 'manual' : 'search'}
        onChange={(v) => (v === 'manual' ? handleSelectManualMode() : handleSelectSearchMode())}
        className="mb-4 w-[224px]"
      />

      {!manualMode && !addressSelected && (
        <>
          <AddressAutocomplete 
            key={searchKey}
            value={addressSelected ? '' : value} 
            onChange={handleAutocompleteChange}
            autoFocus={shouldAutoFocus}
          />
          <div className="mt-2 text-sm text-muted-foreground mb-6">Type to search. If you can't find it, switch to Manual.</div>
        </>
      )}
      {(addressSelected || manualMode) && (
        <AddressManualFields
          streetBase={streetBase}
          actualStreet={actualStreet}
          streetNumber={streetNumber}
          city={city}
          postalCode={postalCode}
          country={country}
          streetError={streetError}
          numberError={numberError}
          cityError={cityError}
          postalError={postalError}
          countryError={countryError}
          onStreetChange={(v) => { setManualEdited(true); onStreetChange(v); }}
          onNumberChange={(v) => { setManualEdited(true); handleStreetNumberChange(v); }}
          onCityChange={(v) => { setManualEdited(true); handleCityChange(v); }}
          onPostalChange={(v) => { setManualEdited(true); handlePostcodeChange(v); }}
          onCountryChange={(v) => { setManualEdited(true); handleCountryChange(v); }}
          isLocked={!manualMode && addressSelected}
          onChangeAddressClick={handleChangeAddressClick}
          showStreetTip={showStreetTip}
          onStreetFocus={handleStreetFocus}
          onStreetBlur={handleStreetBlur}
        />
      )}
    </div>
  );
}


