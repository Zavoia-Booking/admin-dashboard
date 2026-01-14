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
      
      return {
        lat,
        lon: lng,
        display_name: feature.place_name || props.name || address,
        address: {
          road: props.street || props.name,
          house_number: props.housenumber,
          city: props.city || props.municipality,
          postcode: props.postcode,
          country: props.country,
          state: props.region,
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
      
      // Extract context information (city, region, country)
      const cityCtx = context.find((c: any) => c.id?.startsWith('place.') || c.id?.startsWith('municipality.'));
      const postcodeCtx = context.find((c: any) => c.id?.startsWith('postcode.'));
      const countryCtx = context.find((c: any) => c.id?.startsWith('country.'));
      
      return {
        place_id: feature.id,
        lat,
        lon: lng,
        display_name: feature.place_name || props.name,
        address: {
          name: props.name,
          house_number: props.housenumber || props.address,
          road: props.street,
          city: props.city || props.municipality || cityCtx?.text,
          postcode: props.postcode || postcodeCtx?.text,
          country: props.country || countryCtx?.text,
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
