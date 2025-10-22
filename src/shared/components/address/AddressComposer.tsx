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
  };
  onAddressComponentsChange?: (components: {
    street: string;
    streetNumber: string;
    city: string;
    postalCode: string;
    country: string;
  }) => void;
  onValidityChange?: (isValid: boolean) => void;
};

export default function AddressComposer({ value, onChange, className, addressComponents, onAddressComponentsChange, onValidityChange }: Props) {
  const [addressSelected, setAddressSelected] = useState(false);
  const lastSelectedRef = useRef<{ s: string; n: string; c: string; p: string; co: string; display: string } | null>(null);
  const [manualEdited, setManualEdited] = useState(false);
  const {
    streetBase,
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
  const [manualMode, setManualMode] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [hasLoadedFromDraft, setHasLoadedFromDraft] = useState(false);

  // full composed address is derived on demand via composeFullAddress

  // When addressComponents prop changes (from saved draft), populate all fields
  useEffect(() => {
    if (!hasLoadedFromDraft && addressComponents && (addressComponents.street || addressComponents.city)) {
      setAddressSelected(true);
      setHasLoadedFromDraft(true);
    }
  }, [addressComponents, hasLoadedFromDraft]);

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
      const s = c.suggestion as { address?: string; streetNumber?: string; displayName?: string; city?: string; postalCode?: string; country?: string };
      const streetName = s.address ?? '';
      const number = s.streetNumber ?? '';
      // Use the full displayName which already contains the complete address
      const fullAddress = s.displayName ?? c.address;
      // Hydrate exact components; display value is handled in UI, but keep street free in manual mode
      hydrateFromComponents(streetName, number, s.city ?? '', s.postalCode ?? '', s.country ?? '', fullAddress);
      lastSelectedRef.current = { s: streetName, n: number, c: s.city ?? '', p: s.postalCode ?? '', co: s.country ?? '', display: fullAddress };
      setManualEdited(false);
      setAddressSelected(true);
      setManualMode(false);
      // Save the full display name as the address, not the composed version
      onChange(fullAddress);
      onAddressComponentsChange?.({ street: streetName, streetNumber: number, city: s.city ?? '', postalCode: s.postalCode ?? '', country: s.country ?? '' });
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
    onNumberChange(next);
  }, [onNumberChange]);

  const handlePostcodeChange = useCallback((next: string) => {
    onPostalChange(next);
  }, [onPostalChange]);

  const handleCityChange = useCallback((next: string) => {
    onCityChange(next);
  }, [onCityChange]);

  const handleCountryChange = useCallback((next: string) => {
    onCountryChange(next);
  }, [onCountryChange]);

  // Segmented control handlers
  const handleSelectSearchMode = useCallback(() => {
    // If user didn't edit in manual mode and we have a last selected address, restore it
    if (!manualEdited && lastSelectedRef.current) {
      const { s, n, c, p, co, display } = lastSelectedRef.current;
      setManualMode(false);
      setAddressSelected(true);
      hydrateFromComponents(s, n, c, p, co, display);
      onChange(composeFullAddress(s, n, c, p, co));
      return;
    }
    // Otherwise behave like Change address
    setManualMode(false);
    setAddressSelected(false);
    hydrateFromComponents('', '', '', '', '');
    lastSelectedRef.current = null;
    onChange('');
    setShouldAutoFocus(true);
    setSearchKey(prev => prev + 1);
  }, [manualEdited, onChange, hydrateFromComponents]);

  const handleSelectManualMode = useCallback(() => {
    setManualMode(true);
    setAddressSelected(true);
    // In manual mode, street should be a free input: clear any auto-populated value
    hydrateFromComponents('', '', '', '', '', undefined, true);
    setManualEdited(false);
    if (value) onChange(value);
  }, [onChange, value]);

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


