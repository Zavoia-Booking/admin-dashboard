import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { composeFullAddress } from '../utils/address';
import { minLengthError, sanitizeDigits, requiredMinError, requiredError } from '../utils/validation';

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
  const [streetBase, setStreetBase] = useState('');
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
    setStreetNumber(streetNumber);
    setCity(city);
    setPostalCode(postalCode);
    setCountry(country);

    setStreetError(requiredMinError('Street', street));
    setNumberError(requiredError('Number', streetNumber));
    setCityError(requiredMinError('City', city));
    setPostalError(requiredMinError('Postcode', postalCode));
    setCountryError(requiredMinError('Country', country));
    hasHydratedRef.current = true;
  }, [components, fullAddressDisplay]);

  const emitChange = useCallback((s: string, n: string, c: string, p: string, co: string) => {
    onChange(composeFullAddress(s, n, c, p, co));
    onComponentsChange?.({ street: s, streetNumber: n, city: c, postalCode: p, country: co });
  }, [onChange, onComponentsChange]);

  const onStreetChange = useCallback((next: string) => {
    setStreetBase(next);
    setStreetError(requiredMinError('Street', next));
    emitChange(next, streetNumber, city, postalCode, country);
  }, [emitChange, streetNumber, city, postalCode, country]);

  const onNumberChange = useCallback((next: string) => {
    setStreetNumber(next);
    setNumberError(requiredError('Number', next));
    emitChange(streetBase, next, city, postalCode, country);
  }, [emitChange, streetBase, city, postalCode, country]);

  const onCityChange = useCallback((next: string) => {
    setCity(next);
    setCityError(requiredMinError('City', next));
    emitChange(streetBase, streetNumber, next, postalCode, country);
  }, [emitChange, streetBase, streetNumber, postalCode, country]);

  const onPostalChange = useCallback((next: string) => {
    const digits = sanitizeDigits(next);
    setPostalCode(digits);
    setPostalError(requiredMinError('Postcode', digits));
    emitChange(streetBase, streetNumber, city, digits, country);
  }, [emitChange, streetBase, streetNumber, city, country]);

  const onCountryChange = useCallback((next: string) => {
    setCountry(next);
    setCountryError(requiredMinError('Country', next));
    emitChange(streetBase, streetNumber, city, postalCode, next);
  }, [emitChange, streetBase, streetNumber, city, postalCode]);

  const isValid = useMemo(() => !Boolean(streetError || numberError || cityError || postalError || countryError), [streetError, numberError, cityError, postalError, countryError]);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return {
    // values
    streetBase,
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
        setStreetError(minLengthError('Street', street));
        setNumberError(requiredError('Number', streetNumber));
        setCityError(minLengthError('City', city));
        setPostalError(minLengthError('Postcode', postalCode));
        setCountryError(minLengthError('Country', country));
      }
    },
  } as const;
};


