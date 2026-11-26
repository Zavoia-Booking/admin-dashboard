import { useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AddressAutocomplete from './AddressAutocomplete';
import { useAddressManualFields } from '../../hooks/useAddressManualFields';
import AddressManualFields from './AddressManualFields';
import SegmentedControl from '../common/SegmentedControl';
import { validateBuildingNumber, validateCity, validatePostcode, validateCountry } from '../../utils/validation';
import type { AddressSuggestion } from '../../types/geo';

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
  countryCodes?: string[]; // ISO country codes to restrict address search (e.g., ['ro', 'de'])
  onSuggestionPicked?: (s: AddressSuggestion) => void; // a search pick, incl. how precisely the map knows it
};

type TabDraft = { address: string; components: NonNullable<Props['addressComponents']> };

export default function AddressComposer({ value, onChange, className, addressComponents, onAddressComponentsChange, onValidityChange, manualMode: externalManualMode, onManualModeChange, countryCodes, onSuggestionPicked }: Props) {
  const { t } = useTranslation('common');
  const postcodeNumeric = countryCodes?.length === 1 && countryCodes[0].toLowerCase() === 'ro';
  const [addressSelected, setAddressSelected] = useState(false);
  const drafts = useRef<{ search: TabDraft | null; manual: TabDraft | null }>({ search: null, manual: null });
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
    restoreFromComponents,
  } = useAddressManualFields({
    components: addressComponents,
    fullAddressDisplay: value, // pass the saved full address for display in locked street input
    onChange: (next) => onChange(next),
    onComponentsChange: (c) => onAddressComponentsChange?.(c),
    onValidityChange,
    postcodeDigitsOnly: postcodeNumeric,
  });
  // Use external manualMode if provided, otherwise maintain internal state
  const [internalManualMode, setInternalManualMode] = useState(false);
  const manualMode = externalManualMode ?? internalManualMode;
  const [searchKey, setSearchKey] = useState(0);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [hasLoadedFromDraft, setHasLoadedFromDraft] = useState(false);

  // A saved address (draft or location) shows its filled fields on first load
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
    // Any required field empty => invalid (even if untouched); Manual checks the Street box itself (streetBase holds the whole line there)
    const requiredEmpty = [manualMode ? actualStreet : streetBase, streetNumber, city, postalCode, country].some(v => !(v && v.trim().length > 0));
    // In search mode with no selection, mark invalid (Step handles remote bypass)
    const isValid = editorActive ? (!hasErrors && !requiredEmpty) : false;
    onValidityChange?.(isValid);
  }, [manualMode, addressSelected, streetError, numberError, cityError, postalError, countryError, streetBase, actualStreet, streetNumber, city, postalCode, country, onValidityChange]);

  const handleAutocompleteChange = useCallback((c: { address: string; suggestion?: any | null }) => {
    setShouldAutoFocus(false);
    if (c.suggestion) {
      const s = c.suggestion as { address?: string; streetNumber?: string; displayName?: string; city?: string; postalCode?: string; country?: string; lat?: number; lng?: number };
      const streetName = s.address ?? '';
      const number = s.streetNumber ?? '';
      // Use the full displayName which already contains the complete address
      const fullAddress = s.displayName ?? c.address;
      // Hydrate exact components; display value is handled in UI, but keep street free in manual mode
      // Reset errors since data from MapTiler is trusted
      hydrateFromComponents(streetName, number, s.city ?? '', s.postalCode ?? '', s.country ?? '', fullAddress, true);
      setAddressSelected(true);
      setManualMode(false);
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
      onSuggestionPicked?.(c.suggestion as AddressSuggestion);
      return;
    }
    // User is typing but didn't select a suggestion yet — keep search mode
    setAddressSelected(false);
    setManualMode(false);
    // Reset components fully; do not mark fields as touched on reset
    hydrateFromComponents('', '', '', '', '');
    onChange(c.address);
  }, [onChange, onAddressComponentsChange, onSuggestionPicked]);

  // Helper to update mode state
  const setManualMode = useCallback((isManual: boolean) => {
    if (onManualModeChange) {
      onManualModeChange(isManual);
    } else {
      setInternalManualMode(isManual);
    }
  }, [onManualModeChange]);

  const switchTab = useCallback((toManual: boolean) => {
    if (toManual === manualMode) return;
    if (!toManual) {
      const hasManual = addressComponents && [addressComponents.street, addressComponents.streetNumber, addressComponents.city, addressComponents.postalCode, addressComponents.country].some(v => (v ?? '').trim().length > 0);
      drafts.current.manual = addressComponents && hasManual ? { address: value || '', components: { ...addressComponents } } : null;
    } else {
      drafts.current.search = addressSelected && addressComponents ? { address: value || '', components: { ...addressComponents } } : null;
    }
    const draft = toManual ? drafts.current.manual : drafts.current.search;
    if (draft) {
      const c = draft.components;
      setManualMode(toManual);
      setAddressSelected(true);
      restoreFromComponents(c.street ?? '', c.streetNumber ?? '', c.city ?? '', c.postalCode ?? '', c.country ?? '', draft.address);
      onChange(draft.address);
      onAddressComponentsChange?.(c as Parameters<NonNullable<Props['onAddressComponentsChange']>>[0]);
      return;
    }
    const cleared = {
      street: '',
      streetNumber: '',
      city: '',
      postalCode: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
      mapPinConfirmed: false,
    };
    if (toManual) {
      setManualMode(true);
      setAddressSelected(true);
      hydrateFromComponents('', '', '', '', '', undefined, true);
      onAddressComponentsChange?.(cleared);
      onChange('');
      return;
    }
    setManualMode(false);
    setAddressSelected(false);
    hydrateFromComponents('', '', '', '', '');
    onChange('');
    onAddressComponentsChange?.(cleared);
    setShouldAutoFocus(true);
    setSearchKey(prev => prev + 1);
  }, [manualMode, addressSelected, value, addressComponents, onChange, onAddressComponentsChange, setManualMode, hydrateFromComponents, restoreFromComponents]);

  const handleChangeAddressClick = useCallback(() => {
    setManualMode(false);
    setAddressSelected(false);
    hydrateFromComponents('', '', '', '', '');
    drafts.current.search = null;
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

  // A selected address that lacks a required part says so at once: the owner did not type it, so no box was touched to show its message
  const selectedFromSearch = !manualMode && addressSelected;
  const missing = (value: string, validate: typeof validateCity) => (selectedFromSearch && !value.trim() ? validate('', t) : null);

  return (
    <div className={className}>
      <SegmentedControl
        options={[{ value: 'search', label: t('address.search') }, { value: 'manual', label: t('address.manual') }]}
        value={manualMode ? 'manual' : 'search'}
        onChange={(v) => switchTab(v === 'manual')}
        className="mb-4 w-[224px]"
      />

      {!manualMode && !addressSelected && (
        <>
          <AddressAutocomplete 
            key={searchKey}
            value={addressSelected ? '' : value} 
            onChange={handleAutocompleteChange}
            limit={8}
            autoFocus={shouldAutoFocus}
            countryCodes={countryCodes}
          />
          <div className="mt-2 text-sm text-muted-foreground mb-6">{t('address.helperText')}</div>
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
          numberError={numberError ?? missing(streetNumber, validateBuildingNumber)}
          cityError={cityError ?? missing(city, validateCity)}
          postalError={postalError ?? missing(postalCode, validatePostcode)}
          countryError={countryError ?? missing(country, validateCountry)}
          onStreetChange={onStreetChange}
          onNumberChange={onNumberChange}
          onCityChange={onCityChange}
          onPostalChange={onPostalChange}
          onCountryChange={onCountryChange}
          isLocked={selectedFromSearch}
          onChangeAddressClick={handleChangeAddressClick}
          showStreetTip={showStreetTip}
          onStreetFocus={handleStreetFocus}
          onStreetBlur={handleStreetBlur}
          postcodeNumeric={postcodeNumeric}
        />
      )}
    </div>
  );
}


