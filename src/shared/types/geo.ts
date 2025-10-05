export interface AddressSuggestion {
  id: string; // provider-specific id (e.g., LocationIQ place_id as string)
  displayName: string; // human readable, formatted
  address: string; // primary address line if available; fallback to displayName
  lat: number;
  lng: number;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface AddressAutocompleteChange {
  // Minimal surface for consumers that only need a string
  address: string;
  // Rich data available for consumers that want more (not required to persist)
  suggestion?: AddressSuggestion | null;
}


