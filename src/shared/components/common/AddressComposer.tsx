import { useCallback, useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import AddressAutocomplete from './AddressAutocomplete';
import { composeFullAddress } from '../../utils/address';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MapPin, Hash, Building2, Flag, Locate } from 'lucide-react';

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
};

export default function AddressComposer({ value, onChange, className, addressComponents, onAddressComponentsChange }: Props) {
  const [addressSelected, setAddressSelected] = useState(false);
  const [streetBase, setStreetBase] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [hasLoadedFromDraft, setHasLoadedFromDraft] = useState(false);

  // full composed address is derived on demand via composeFullAddress

  // When addressComponents prop changes (from saved draft), populate all fields
  useEffect(() => {
    if (!hasLoadedFromDraft && addressComponents && (addressComponents.street || addressComponents.city)) {
      const streetName = addressComponents.street || '';
      const number = addressComponents.streetNumber || '';
      // Combine street name and number for display
      const fullStreet = number ? `${streetName} ${number}` : streetName;
      setStreetBase(fullStreet);
      setStreetNumber(number);
      setCity(addressComponents.city || '');
      setPostalCode(addressComponents.postalCode || '');
      setCountry(addressComponents.country || '');
      setAddressSelected(true);
      setHasLoadedFromDraft(true);
    }
  }, [addressComponents, hasLoadedFromDraft]);

  const handleAutocompleteChange = useCallback((c: { address: string; suggestion?: any | null }) => {
    setShouldAutoFocus(false);
    if (c.suggestion) {
      const s = c.suggestion as { address?: string; streetNumber?: string; displayName?: string; city?: string; postalCode?: string; country?: string };
      const streetName = s.address ?? '';
      const number = s.streetNumber ?? '';
      // Use the full displayName which already contains the complete address
      const fullAddress = s.displayName ?? c.address;
      setStreetBase(fullAddress);
      setStreetNumber(number);
      setCity(s.city ?? '');
      setPostalCode(s.postalCode ?? '');
      setCountry(s.country ?? '');
      setAddressSelected(true);
      setManualMode(false);
      onChange(composeFullAddress(streetName, number, s.city ?? '', s.postalCode ?? '', s.country ?? ''));
      onAddressComponentsChange?.({ street: streetName, streetNumber: number, city: s.city ?? '', postalCode: s.postalCode ?? '', country: s.country ?? '' });
      return;
    }
    // User is typing but didn't select a suggestion yet — keep search mode
    setAddressSelected(false);
    setManualMode(false);
    setStreetBase('');
    setStreetNumber('');
    setCity('');
    setPostalCode('');
    setCountry('');
    onChange(c.address);
  }, [onChange, onAddressComponentsChange]);

  const handleStreetNumberChange = useCallback((next: string) => {
    setStreetNumber(next);
    onChange(composeFullAddress(streetBase, next, city, postalCode, country));
    onAddressComponentsChange?.({ street: streetBase, streetNumber: next, city, postalCode, country });
  }, [onChange, onAddressComponentsChange, streetBase, city, postalCode, country]);

  const handlePostcodeChange = useCallback((next: string) => {
    setPostalCode(next);
    onChange(composeFullAddress(streetBase, streetNumber, city, next, country));
    onAddressComponentsChange?.({ street: streetBase, streetNumber, city, postalCode: next, country });
  }, [onChange, onAddressComponentsChange, streetBase, streetNumber, city, country]);

  const handleCityChange = useCallback((next: string) => {
    setCity(next);
    onChange(composeFullAddress(streetBase, streetNumber, next, postalCode, country));
    onAddressComponentsChange?.({ street: streetBase, streetNumber, city: next, postalCode, country });
  }, [onChange, onAddressComponentsChange, streetBase, streetNumber, postalCode, country]);

  const handleCountryChange = useCallback((next: string) => {
    setCountry(next);
    onChange(composeFullAddress(streetBase, streetNumber, city, postalCode, next));
    onAddressComponentsChange?.({ street: streetBase, streetNumber, city, postalCode, country: next });
  }, [onChange, onAddressComponentsChange, streetBase, streetNumber, city, postalCode]);

  // Event wrappers (avoid inline lambdas in JSX)
  const handleStreetInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setStreetBase(next);
    onChange(composeFullAddress(next, streetNumber, city, postalCode, country));
    onAddressComponentsChange?.({ street: next, streetNumber, city, postalCode, country });
  }, [onChange, onAddressComponentsChange, streetNumber, city, postalCode, country]);

  const handleStreetNumberInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleStreetNumberChange(e.target.value);
  }, [handleStreetNumberChange]);

  const handlePostcodeInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handlePostcodeChange(e.target.value);
  }, [handlePostcodeChange]);

  const handleCityInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleCityChange(e.target.value);
  }, [handleCityChange]);

  const handleCountryInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleCountryChange(e.target.value);
  }, [handleCountryChange]);

  // Segmented control handlers
  const handleSelectSearchMode = useCallback(() => {
    setManualMode(false);
    // Hide inputs if no address has been selected or composed yet
    setAddressSelected(Boolean(value));
  }, [value]);

  const handleSelectManualMode = useCallback(() => {
    setManualMode(true);
    setAddressSelected(true);
    setStreetBase(value || '');
    if (value) onChange(value);
  }, [onChange, value]);

  const handleChangeAddressClick = useCallback(() => {
    setAddressSelected(false);
    setStreetBase('');
    setStreetNumber('');
    setCity('');
    setPostalCode('');
    setCountry('');
    onChange('');
    setShouldAutoFocus(true);
    // Force remount of AddressAutocomplete to clear and focus
    setSearchKey(prev => prev + 1);
  }, [onChange]);

  const isLocked = !manualMode && addressSelected;
  const [showStreetTip, setShowStreetTip] = useState(false);

  const handleStreetFocus = useCallback(() => {
    if (isLocked && streetBase?.length > 0) setShowStreetTip(true);
  }, [isLocked, streetBase]);

  const handleStreetBlur = useCallback(() => {
    setShowStreetTip(false);
  }, []);

  return (
    <div className={className}>
      {/* Segmented control: Search | Manual (toggle with sliding indicator) */}
      <div className="relative mb-4 inline-flex rounded-lg border bg-white p-1 shadow-sm">
        <span
          className={`pointer-events-none absolute inset-y-1 left-1 h-[calc(100%-0.5rem)] w-28 rounded-md bg-black transition-transform duration-200 ease-out ${manualMode ? 'translate-x-28' : 'translate-x-0'}`}
        />
        <button
          type="button"
          className={`relative z-10 w-28 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${!manualMode ? 'text-white' : 'text-gray-800 hover:text-black'}`}
          onClick={handleSelectSearchMode}
          aria-pressed={!manualMode}
        >
          Search
        </button>
        <button
          type="button"
          className={`relative z-10 w-28 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${manualMode ? 'text-white' : 'text-gray-800 hover:text-black'}`}
          onClick={handleSelectManualMode}
          aria-pressed={manualMode}
        >
          Manual
        </button>
      </div>

      {!manualMode && (
        <>
          <AddressAutocomplete 
            key={searchKey}
            value={addressSelected ? '' : value} 
            onChange={handleAutocompleteChange}
            autoFocus={shouldAutoFocus}
          />
          <div className="mt-2 text-xs text-muted-foreground">Type to search. If you can't find it, switch to Manual.</div>
        </>
      )}
      {(addressSelected || manualMode) && (
        <div className="mt-5 space-y-3">
          {/* Street row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Street</Label>
              {!manualMode && addressSelected && (
                <button
                  type="button"
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  onClick={handleChangeAddressClick}
                >
                  Change address
                </button>
              )}
            </div>
            <Tooltip open={showStreetTip}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    value={streetBase}
                    onChange={handleStreetInputChange}
                    placeholder="Enter street name"
                    className={`h-10 !pr-11 truncate transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0 ${isLocked ? 'cursor-not-allowed bg-gray-50/80 text-gray-600 border-gray-200' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400'}`}
                    readOnly={isLocked}
                    aria-readonly={isLocked}
                    onFocus={handleStreetFocus}
                    onBlur={handleStreetBlur}
                  />
                  <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </TooltipTrigger>
              {isLocked && streetBase?.length > 0 && (
                <TooltipContent sideOffset={6} className="max-w-fit text-sm leading-relaxed">{streetBase}</TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Number and City row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Number</Label>
              <div className="relative">
                <Input 
                  value={streetNumber} 
                  onChange={handleStreetNumberInputChange} 
                  placeholder="e.g. 79" 
                  className="h-10 !pr-11 border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0" 
                  maxLength={50}
                />
                <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">City</Label>
              <div className="relative">
                <Input 
                  value={city} 
                  onChange={handleCityInputChange} 
                  placeholder="Enter city" 
                  className="h-10 !pr-11 border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0" 
                  maxLength={50}
                />
                <Building2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Postcode and Country row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Postcode</Label>
              <div className="relative">
                <Input 
                  value={postalCode} 
                  onChange={handlePostcodeInputChange} 
                  placeholder="Postal code" 
                  className="h-10 !pr-11 border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0" 
                  maxLength={50}
                />
                <Locate className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Country</Label>
              <div className="relative">
                <Input 
                  value={country} 
                  onChange={handleCountryInputChange} 
                  placeholder="Country" 
                  className="h-10 !pr-11 border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0" 
                  maxLength={50}
                />
                <Flag className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


