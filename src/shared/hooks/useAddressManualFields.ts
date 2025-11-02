import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { composeFullAddress } from '../utils/address';
import { sanitizeDigits, validateStreetAddress, validateBuildingNumber, validateCity, validatePostcode, validateCountry } from '../utils/validation';

export type AddressComponents = {
  street?: string;
  streetNumber?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

type Params = {
  components?: AddressComponents;
  fullAddressDisplay?: string; // full address string for display in locked mode (from location.address)
  onChange: (next: string) => void;
  onComponentsChange?: (c: Required<AddressComponents>) => void;
  onValidityChange?: (isValid: boolean) => void;
};

export const useAddressManualFields = ({ components, fullAddressDisplay, onChange, onComponentsChange, onValidityChange }: Params) => {
  const [streetBase, setStreetBase] = useState(''); // Display value (full address for locked mode, street name for manual)
  const [actualStreet, setActualStreet] = useState(''); // Actual street component for composition
  const [streetNumber, setStreetNumber] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  const [streetError, setStreetError] = useState<string | null>(null);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [postalError, setPostalError] = useState<string | null>(null);
  const [countryError, setCountryError] = useState<string | null>(null);

  // hydrate from components (draft)
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!components) return;
    if (hasHydratedRef.current) return; // hydrate only once from incoming components
    const street = (components.street ?? '').trim();
    const streetNumber = (components.streetNumber ?? '').trim();
    const city = (components.city ?? '').trim();
    const postalCode = (components.postalCode ?? '').trim();
    const country = (components.country ?? '').trim();

    // Use the full address display if available (from location.address), otherwise reconstruct
    const fullStreet = fullAddressDisplay && fullAddressDisplay.trim() 
      ? fullAddressDisplay.trim()
      : (() => {
          const parts = [
            streetNumber && street ? `${street} ${streetNumber}` : street || streetNumber,
            city,
            country,
          ].filter(Boolean);
          return parts.join(', ');
        })();
    
    setStreetBase(fullStreet);
    setActualStreet(street); // Store the actual street component
    setStreetNumber(streetNumber);
    setCity(city);
    setPostalCode(postalCode);
    setCountry(country);

    // Only validate if fields have actual values (from saved draft)
    // Don't show errors for empty fields on initial load
    if (street) setStreetError(validateStreetAddress(street));
    if (streetNumber) setNumberError(validateBuildingNumber(streetNumber));
    if (city) setCityError(validateCity(city));
    if (postalCode) setPostalError(validatePostcode(postalCode));
    if (country) setCountryError(validateCountry(country));
    hasHydratedRef.current = true;
  }, [components, fullAddressDisplay]);

  const emitChange = useCallback((s: string, n: string, c: string, p: string, co: string) => {
    const fullAddress = composeFullAddress(s, n, c, p, co);
    onChange(fullAddress);
    // Update streetBase display to reflect the changes (for locked mode)
    setStreetBase(fullAddress);
    onComponentsChange?.({ street: s, streetNumber: n, city: c, postalCode: p, country: co });
  }, [onChange, onComponentsChange]);

  const onStreetChange = useCallback((next: string) => {
    setStreetBase(next);
    setActualStreet(next); // Update both display and actual street
    setStreetError(validateStreetAddress(next));
    emitChange(next, streetNumber, city, postalCode, country);
  }, [emitChange, streetNumber, city, postalCode, country]);

  const onNumberChange = useCallback((next: string) => {
    setStreetNumber(next);
    setNumberError(validateBuildingNumber(next));
    emitChange(actualStreet, next, city, postalCode, country); // Use actualStreet, not streetBase
  }, [emitChange, actualStreet, city, postalCode, country]);

  const onCityChange = useCallback((next: string) => {
    setCity(next);
    setCityError(validateCity(next));
    emitChange(actualStreet, streetNumber, next, postalCode, country);
  }, [emitChange, actualStreet, streetNumber, postalCode, country]);

  const onPostalChange = useCallback((next: string) => {
    const digits = sanitizeDigits(next);
    setPostalCode(digits);
    setPostalError(validatePostcode(digits));
    emitChange(actualStreet, streetNumber, city, digits, country);
  }, [emitChange, actualStreet, streetNumber, city, country]);

  const onCountryChange = useCallback((next: string) => {
    setCountry(next);
    setCountryError(validateCountry(next));
    emitChange(actualStreet, streetNumber, city, postalCode, next);
  }, [emitChange, actualStreet, streetNumber, city, postalCode]);

  const isValid = useMemo(() => !(streetError || numberError || cityError || postalError || countryError), [streetError, numberError, cityError, postalError, countryError]);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return {
    // values
    streetBase,
    actualStreet,
    streetNumber,
    city,
    postalCode,
    country,
    // errors
    streetError,
    numberError,
    cityError,
    postalError,
    countryError,
    // handlers
    onStreetChange,
    onNumberChange,
    onCityChange,
    onPostalChange,
    onCountryChange,
    // derived
    isValid,
    // hydrator for immediate UI sync (e.g., autocomplete selection)
    hydrateFromComponents: (
      street: string,
      streetNumber: string,
      city: string,
      postalCode: string,
      country: string,
      display?: string,
      resetTouched?: boolean
    ) => {
      const fullStreet = display ?? (streetNumber ? `${street} ${streetNumber}` : street);
      setStreetBase(fullStreet);
      setActualStreet(street); // Store the actual street component
      setStreetNumber(streetNumber);
      setCity(city);
      setPostalCode(postalCode);
      setCountry(country);
      if (resetTouched) {
        setStreetError(null);
        setNumberError(null);
        setCityError(null);
        setPostalError(null);
        setCountryError(null);
      } else {
        setStreetError(validateStreetAddress(street));
        setNumberError(validateBuildingNumber(streetNumber));
        setCityError(validateCity(city));
        setPostalError(validatePostcode(postalCode));
        setCountryError(validateCountry(country));
      }
    },
  } as const;
};


