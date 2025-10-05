import { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import AddressAutocomplete from './AddressAutocomplete';
import { composeFullAddress } from '../../utils/address';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
};

export default function AddressComposer({ value, onChange, className }: Props) {
  const [addressSelected, setAddressSelected] = useState(false);
  const [streetBase, setStreetBase] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [manualMode, setManualMode] = useState(false);

  // full composed address is derived on demand via composeFullAddress

  const handleAutocompleteChange = useCallback((c: { address: string; suggestion?: any | null }) => {
    if (c.suggestion) {
      const s = c.suggestion as { address?: string; displayName?: string; city?: string; postalCode?: string; country?: string };
      const base = (s.address && s.address.trim().length > 0)
        ? s.address
        : (s.displayName?.split(',')[0] ?? c.address);
      setStreetBase(base ?? '');
      setStreetNumber('');
      setCity(s.city ?? '');
      setPostalCode(s.postalCode ?? '');
      setCountry(s.country ?? '');
      setAddressSelected(true);
      setManualMode(false);
      onChange(composeFullAddress(base ?? '', '', s.city ?? '', s.postalCode ?? '', s.country ?? ''));
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
  }, [onChange]);

  const handleStreetNumberChange = useCallback((next: string) => {
    setStreetNumber(next);
    onChange(composeFullAddress(streetBase, next, city, postalCode, country));
  }, [onChange, streetBase, city, postalCode, country]);

  const handlePostcodeChange = useCallback((next: string) => {
    setPostalCode(next);
    onChange(composeFullAddress(streetBase, streetNumber, city, next, country));
  }, [onChange, streetBase, streetNumber, city, country]);

  const handleCityChange = useCallback((next: string) => {
    setCity(next);
    onChange(composeFullAddress(streetBase, streetNumber, next, postalCode, country));
  }, [onChange, streetBase, streetNumber, postalCode, country]);

  const handleCountryChange = useCallback((next: string) => {
    setCountry(next);
    onChange(composeFullAddress(streetBase, streetNumber, city, postalCode, next));
  }, [onChange, streetBase, streetNumber, city, postalCode]);

  // Event wrappers (avoid inline lambdas in JSX)
  const handleStreetInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setStreetBase(next);
    onChange(composeFullAddress(next, streetNumber, city, postalCode, country));
  }, [onChange, streetNumber, city, postalCode, country]);

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
  }, []);

  const handleSelectManualMode = useCallback(() => {
    setManualMode(true);
    setAddressSelected(true);
    setStreetBase(value || '');
    if (value) onChange(value);
  }, [onChange, value]);

  const handleChangeAddressClick = useCallback(() => {
    setAddressSelected(false);
    setStreetBase('');
  }, []);

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
      {/* Segmented control: Search | Manual */}
      <div className="mb-2 inline-flex rounded-md border p-0.5 bg-white">
        <button
          type="button"
          className={`px-3 py-1 text-sm rounded ${!manualMode ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={handleSelectSearchMode}
        >
          Search
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-sm rounded ${manualMode ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={handleSelectManualMode}
        >
          Manual
        </button>
      </div>

      {!manualMode && (
        <>
          <AddressAutocomplete value={value} onChange={handleAutocompleteChange} />
          <div className="mt-1 text-xs text-muted-foreground">Type to search. If you can’t find it, switch to Manual.</div>
        </>
      )}
      {(addressSelected || manualMode) && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
          <div className="md:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Street</Label>
              {!manualMode && addressSelected && (
                <button
                  type="button"
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                  onClick={handleChangeAddressClick}
                >
                  Change address
                </button>
              )}
            </div>
            <Tooltip open={showStreetTip}>
              <TooltipTrigger asChild>
                <Input
                  value={streetBase}
                  onChange={handleStreetInputChange}
                  placeholder="Street"
                  className={`h-11 truncate ${isLocked ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
                  readOnly={isLocked}
                  aria-readonly={isLocked}
                  onFocus={handleStreetFocus}
                  onBlur={handleStreetBlur}
                />
              </TooltipTrigger>
              {isLocked && streetBase?.length > 0 && (
                <TooltipContent sideOffset={6}>{streetBase}</TooltipContent>
              )}
            </Tooltip>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Street number</Label>
            <Input value={streetNumber} onChange={handleStreetNumberInputChange} placeholder="e.g. 79" className="h-11" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Postcode</Label>
            <Input value={postalCode} onChange={handlePostcodeInputChange} placeholder="Postal code" className="h-11" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">City</Label>
            <Input value={city} onChange={handleCityInputChange} placeholder="City" className="h-11" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Country</Label>
            <Input value={country} onChange={handleCountryInputChange} placeholder="Country" className="h-11" />
          </div>
        </div>
      )}
    </div>
  );
}


