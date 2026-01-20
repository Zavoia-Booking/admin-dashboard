const BASE_URL = 'https://api.maptiler.com/geocoding';
let warnedNoToken = false;

type CacheEntry = { data: any[]; ts: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function getToken(): string | undefined {
  return (import.meta as any).env?.VITE_MAPTILER_API_KEY;
}

/**
 * Forward geocoding: Convert address string to coordinates
 */
export async function maptilerGeocode(address: string): Promise<{ lat: number; lon: number; display_name: string; address: any } | null> {
  const token = getToken();
  if (!token) {
    console.warn('[MapTiler] Missing VITE_MAPTILER_API_KEY. Geocoding disabled.');
    return null;
  }

  const url = `${BASE_URL}/${encodeURIComponent(address)}.json?key=${token}&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    
    if (json.features && json.features.length > 0) {
      const feature = json.features[0];
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties || {};
      const context = feature.context || [];
      
      // Extract context information
      const cityCtx = context.find((c: any) => 
        (c.id?.startsWith('municipality.') || c.id?.startsWith('region.')) &&
        c.place_designation === 'city'
      ) || context.find((c: any) => 
        c.id?.startsWith('municipality.') || c.id?.startsWith('region.')
      );
      const postcodeCtx = context.find((c: any) => c.id?.startsWith('postal_code.'));
      const countryCtx = context.find((c: any) => c.id?.startsWith('country.'));
      const neighborhoodCtx = context.find((c: any) => 
        c.id?.startsWith('place.') && 
        (c.place_designation === 'suburb' || c.place_designation === 'neighbourhood' || c.place_designation === 'quarter')
      );
      const countyCtx = context.find((c: any) => 
        c.id?.startsWith('region.') && c.place_designation === 'county'
      );
      
      const placeType = feature.place_type?.[0] || '';
      const isAddress = placeType === 'address';
      const isStreet = props.kind === 'street' || isAddress;
      
      // Build full address with neighborhood and county if available
      let fullAddress = feature.place_name || feature.text || address;
      if ((neighborhoodCtx?.text || countyCtx?.text) && !fullAddress.includes(neighborhoodCtx?.text || '') && !fullAddress.includes(countyCtx?.text || '')) {
        // Insert neighborhood and county between street and city if not already in place_name
        const parts = [];
        if (feature.text) parts.push(feature.text);
        if (feature.address) parts[parts.length - 1] = `${parts[parts.length - 1]} ${feature.address}`;
        if (neighborhoodCtx?.text) parts.push(neighborhoodCtx.text);
        if (cityCtx?.text) parts.push(cityCtx.text);
        if (countyCtx?.text) parts.push(countyCtx.text);
        if (postcodeCtx?.text) parts.push(postcodeCtx.text);
        if (countryCtx?.text) parts.push(countryCtx.text);
        if (parts.length > 0) fullAddress = parts.join(', ');
      }
      
      return {
        lat,
        lon: lng,
        display_name: fullAddress,
        address: {
          road: isStreet ? feature.text : '',
          house_number: feature.address || '',
          city: cityCtx?.text || '',
          postcode: postcodeCtx?.text || '',
          country: countryCtx?.text || props.country_code?.toUpperCase() || '',
          state: context.find((c: any) => c.id?.startsWith('region.'))?.text || '',
        }
      };
    }
    return null;
  } catch (error) {
    console.error('[MapTiler] Geocoding error:', error);
    return null;
  }
}

/**
 * Autocomplete search for addresses
 */
export async function maptilerAutocomplete(params: {
  query: string;
  limit?: number;
  countryCodes?: string[]; // e.g. ['ro', 'gb']
}): Promise<any[]> {
  const token = getToken();
  if (!token) {
    if (!warnedNoToken && typeof window !== 'undefined') {
      warnedNoToken = true;
      console.warn('[MapTiler] Missing VITE_MAPTILER_API_KEY. Autocomplete will be disabled.');
    }
    return [];
  }

  const query = (params.query || '').trim();
  if (!query) return [];

  // Build cache key
  const key = `auto:${query.toLowerCase()}|${params.limit ?? 5}|${(params.countryCodes || []).join(',')}`;
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.ts < TTL_MS) {
    return hit.data;
  }

  // Build URL with parameters
  let url = `${BASE_URL}/${encodeURIComponent(query)}.json?key=${token}&limit=${params.limit ?? 5}&autocomplete=true`;
  
  // Add country filter if specified
  if (params.countryCodes?.length) {
    // MapTiler uses 'country' param with comma-separated ISO codes
    url += `&country=${params.countryCodes.join(',')}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      CACHE.set(key, { data: [], ts: now });
      return [];
    }
    
    const json = await res.json();
    const features = json.features || [];
    
    // Transform to common format compatible with existing AddressSuggestion interface
    const results = features.map((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties || {};
      const context = feature.context || [];
      
      // Extract context information from the context array
      // MapTiler uses context for hierarchical location data
      const cityCtx = context.find((c: any) => 
        (c.id?.startsWith('municipality.') || c.id?.startsWith('region.')) &&
        c.place_designation === 'city'
      ) || context.find((c: any) => 
        c.id?.startsWith('municipality.') || c.id?.startsWith('region.')
      );
      const postcodeCtx = context.find((c: any) => c.id?.startsWith('postal_code.'));
      const countryCtx = context.find((c: any) => c.id?.startsWith('country.'));
      const neighborhoodCtx = context.find((c: any) => 
        c.id?.startsWith('place.') && 
        (c.place_designation === 'suburb' || c.place_designation === 'neighbourhood' || c.place_designation === 'quarter')
      );
      const countyCtx = context.find((c: any) => 
        c.id?.startsWith('region.') && c.place_designation === 'county'
      );
      
      // MapTiler response structure:
      // - feature.text = short name (street name, place name, etc.)
      // - feature.address = house number (string) - only for street addresses
      // - feature.place_name = full formatted address
      // - context[] = hierarchical location data (city, region, country)
      // - place_type[] = type of place (e.g., ["address"], ["place"], ["region"])
      
      const placeType = feature.place_type?.[0] || '';
      const isAddress = placeType === 'address';
      const isStreet = props.kind === 'street' || isAddress;
      
      // Build full address with neighborhood and county if available
      let fullAddress = feature.place_name || feature.text;
      if ((neighborhoodCtx?.text || countyCtx?.text) && !fullAddress.includes(neighborhoodCtx?.text || '') && !fullAddress.includes(countyCtx?.text || '')) {
        // Insert neighborhood and county between street and city if not already in place_name
        const parts = [];
        if (feature.text) parts.push(feature.text);
        if (feature.address) parts[parts.length - 1] = `${parts[parts.length - 1]} ${feature.address}`;
        if (neighborhoodCtx?.text) parts.push(neighborhoodCtx.text);
        if (cityCtx?.text) parts.push(cityCtx.text);
        if (countyCtx?.text) parts.push(countyCtx.text);
        if (postcodeCtx?.text) parts.push(postcodeCtx.text);
        if (countryCtx?.text) parts.push(countryCtx.text);
        if (parts.length > 0) fullAddress = parts.join(', ');
      }
      
      return {
        place_id: feature.id,
        lat,
        lon: lng,
        display_name: fullAddress,
        address: {
          name: isAddress ? '' : feature.text,  // Empty for actual addresses, use text for places
          house_number: feature.address || '',  // House number if available
          road: isStreet ? feature.text : '',  // Street name for street/address types
          city: cityCtx?.text || '',
          postcode: postcodeCtx?.text || '',
          country: countryCtx?.text || props.country_code?.toUpperCase() || '',
        }
      };
    });
    
    CACHE.set(key, { data: results, ts: now });
    return results;
  } catch (error) {
    console.error('[MapTiler] Autocomplete error:', error);
    return [];
  }
}
