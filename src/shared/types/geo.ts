export interface AddressSuggestion {
  id: string; // provider-specific id (e.g., MapTiler feature id)
  displayName: string; // human readable, formatted
  address: string; // street name only (without house number)
  streetNumber?: string; // house/building number
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


