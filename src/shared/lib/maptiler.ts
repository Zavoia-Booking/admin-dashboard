import { cleanTypedAddress, leadingHouseNumber, metresBetween, normText, rankAddressRows, readAddressRow, textWords, typedHouseNumber } from './addressLookup';
import type { LookupRow } from './addressLookup';
import { composeFullAddress } from '../utils/address';

const BASE_URL = 'https://api.maptiler.com/geocoding';
let warnedNoToken = false;

type CacheEntry = { data: any[]; ts: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

// MapTiler refused the request or could not be reached; not the same as "no results"
export class MaptilerUnavailableError extends Error {}

function getToken(): string | undefined {
  return (import.meta as any).env?.VITE_MAPTILER_API_KEY;
}

// Addresses are stored in the business country's own language ("București", not
// "Bucharest"), whatever language the dashboard is in: that's how addresses are
// written locally, and admin-api's city key (utils/city.ts normalizeCityKey) and
// the marketplace app's city filter rely on the local name. MapTiler's default
// language depends on the request shape, so it is always pinned explicitly.
const COUNTRY_LANGUAGE: Record<string, string> = {
  ro: 'ro', md: 'ro', bg: 'bg', hu: 'hu', de: 'de', at: 'de', fr: 'fr', it: 'it', es: 'es',
  pt: 'pt', nl: 'nl', pl: 'pl', cz: 'cs', gb: 'en', ie: 'en', us: 'en',
};

/** `&language=` for a single known country, else nothing (MapTiler's default). */
function localLanguageParam(countryCodes?: (string | null | undefined)[]): string {
  const codes = (countryCodes ?? []).filter(Boolean).map((c) => String(c).toLowerCase());
  const lang = codes.length === 1 ? COUNTRY_LANGUAGE[codes[0]] : undefined;
  return lang ? `&language=${lang}` : '';
}

type TypedParts = { street: string; streetNumber: string; city: string; postalCode: string };
export type TypedLocation = { level: 'address' | 'street' | 'town'; lngLat: [number, number] };

const TOWN_TYPES = 'municipality,place,joint_municipality,joint_submunicipality,municipal_district,county,subregion,region';

async function callGeocoder(token: string, q: string, params: Record<string, unknown>): Promise<any[]> {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString();
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(q)}.json?key=${token}&${qs}`);
    if (!res.ok) throw new MaptilerUnavailableError(`HTTP ${res.status}`);
    return (await res.json()).features || [];
  } catch (error) {
    if (error instanceof MaptilerUnavailableError) throw error;
    throw new MaptilerUnavailableError(String(error));
  }
}

const bboxSpan = (b: number[] | null | undefined): number => (b ? metresBetween([b[0], b[1]], [b[2], b[3]]) : Infinity);

const boxAround = (t: { bbox: number[] | null; center: [number, number] }): number[] => { // the town's own outline, or ~4 km around a point-like place
  const b = t.bbox;
  if (b && (b[2] - b[0] > 0.02 || b[3] - b[1] > 0.02)) return b;
  const [x, y] = t.center;
  return [x - 0.06, y - 0.04, x + 0.06, y + 0.04];
};

async function findTown(token: string, name: string, cc: string, postcode: string) {
  const lang = COUNTRY_LANGUAGE[cc] ? { language: COUNTRY_LANGUAGE[cc] } : {};
  const country = cc ? { country: cc } : {};
  let near: [number, number] | null = null;
  let pcArea: { center: [number, number]; size: number } | null = null;
  if (postcode) {
    const pc = await callGeocoder(token, postcode, { limit: 1, autocomplete: 'false', types: 'postal_code', ...country });
    near = pc[0]?.center || null;
    if (pc[0]) pcArea = { center: pc[0].center, size: bboxSpan(pc[0].bbox) };
  }
  const list = await callGeocoder(token, name, { limit: 10, autocomplete: 'false', types: TOWN_TYPES, ...country, ...lang, ...(near ? { proximity: near.join(',') } : {}) });
  const key = normText(name);
  const named = list.filter((f) => normText(f.text) === key || normText(f.text).split(' ').includes(key));
  if (!named.length) return near ? { center: near, bbox: null as number[] | null, pcArea } : null;
  const order = ['city', 'town', 'village', 'hamlet'];
  const rankOf = (f: any) => { const i = order.indexOf(f.properties?.place_designation); return i < 0 ? 9 : i; };
  const d2 = (f: any) => (f.center[0] - near![0]) ** 2 + (f.center[1] - near![1]) ** 2;
  named.sort((x, y) => (near ? d2(x) - d2(y) : rankOf(x) - rankOf(y)));
  const t = named[0];
  return { center: t.center as [number, number], bbox: (t.bbox || null) as number[] | null, pcArea };
}

/**
 * Typed (Manual) address -> where to open the map: exact address, else street, else town.
 * Returns null when nothing was found; throws MaptilerUnavailableError when MapTiler refuses or is unreachable.
 */
export async function locateTypedAddress(parts: TypedParts, countryCode?: string | null): Promise<TypedLocation | null> {
  const token = getToken();
  if (!token) {
    console.warn('[MapTiler] Missing VITE_MAPTILER_API_KEY. Geocoding disabled.');
    return null;
  }
  const { street, streetNumber, city, postalCode: postcode } = parts;
  const cc = (countryCode ?? '').toLowerCase();
  const key = `typed:${street.trim()}|${streetNumber.trim()}|${city.trim()}|${postcode.trim()}|${cc}`;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data[0] ?? null;

  const lang = COUNTRY_LANGUAGE[cc] ? { language: COUNTRY_LANGUAGE[cc] } : {};
  const country = cc ? { country: cc } : {};
  const nr = leadingHouseNumber(streetNumber);
  const { text: streetClean } = cleanTypedAddress(street, cc);
  const streetOk = (r: LookupRow) => { const a = textWords(r.street), b = textWords(streetClean); return a.every((t) => b.includes(t)) || b.every((t) => a.includes(t)); };
  const cityKey = normText(city);
  const inCity = (r: LookupRow) => r.localities.some((l) => normText(l) === cityKey);
  const base = { limit: 10, autocomplete: 'false', types: 'address', ...country, ...lang };
  const town = await findTown(token, city, cc, postcode);
  const pcSame = (r: LookupRow) => !!postcode && normText(r.postcode).replace(/ /g, '') === normText(postcode).replace(/ /g, '');
  let rows: LookupRow[] = [];
  if (town) rows = (await callGeocoder(token, `${streetClean}${nr ? ` ${nr}` : ''}`, { ...base, bbox: boxAround(town).join(',') })).map(readAddressRow).filter(streetOk);
  const labelled = rows.filter(inCity); // the rectangle around a town also covers its neighbours
  const nextTo = (r: LookupRow) => labelled.some((a) => (a.postcode && a.postcode === r.postcode) || metresBetween(a.lngLat, r.lngLat) <= 500);
  let pool = labelled.concat(rows.filter((r) => !inCity(r) && (pcSame(r) || nextTo(r))));
  if (!pool.length) pool = (await callGeocoder(token, `${streetClean}${nr ? ` ${nr}` : ''}, ${city}`, base)).map(readAddressRow).filter((r) => streetOk(r) && (inCity(r) || pcSame(r)));
  const exacts = nr ? pool.filter((r) => normText(r.number) === normText(nr)) : [];
  const exact = exacts.find(pcSame) || exacts[0];
  const pcArea = town?.pcArea;
  const st = pool.find(pcSame) || pool[0];

  let result: TypedLocation | null = null;
  if (exact) result = { level: 'address', lngLat: exact.lngLat };
  else if (pcArea && pcArea.size <= 700) result = { level: 'street', lngLat: pcArea.center }; // a big-city postcode covers one street segment
  else if (st) result = { level: 'street', lngLat: st.lngLat };
  else if (town) result = { level: 'town', lngLat: town.center };

  CACHE.set(key, { data: [result], ts: Date.now() });
  return result;
}

/**
 * Autocomplete search for addresses
 */
export async function maptilerAutocomplete(params: {
  query: string;
  limit?: number;
  countryCodes?: string[]; // e.g. ['ro', 'gb']
  signal?: AbortSignal;
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

  const { text: cleaned, postcode: typedPostcode } = cleanTypedAddress(query, params.countryCodes?.[0]);
  if (!cleaned) return [];

  // The cache holds the raw reply: rows also depend on the typed postcode and number
  const key = `auto:${cleaned.toLowerCase()}|${(params.countryCodes || []).join(',')}`;
  const now = Date.now();
  const hit = CACHE.get(key);

  let features: any[];
  if (hit && now - hit.ts < TTL_MS) {
    features = hit.data;
  } else {
    let url = `${BASE_URL}/${encodeURIComponent(cleaned)}.json?key=${token}&limit=10&autocomplete=true&types=address`;

    // Add country filter if specified
    if (params.countryCodes?.length) {
      // MapTiler uses 'country' param with comma-separated ISO codes
      url += `&country=${params.countryCodes.join(',')}`;
    }
    url += localLanguageParam(params.countryCodes);

    try {
      const res = await fetch(url, { signal: params.signal });
      if (!res.ok) throw new MaptilerUnavailableError(`HTTP ${res.status}`);
      const json = await res.json();
      features = json.features || [];
      CACHE.set(key, { data: features, ts: now });
    } catch (error) {
      if (params.signal?.aborted) throw error;
      if (error instanceof MaptilerUnavailableError) throw error;
      console.error('[MapTiler] Autocomplete error:', error);
      throw new MaptilerUnavailableError(String(error));
    }
  }

  // Transform to common format compatible with existing AddressSuggestion interface
  const rows = features.map((feature: any) => ({ ...readAddressRow(feature), feature }));
  return rankAddressRows(rows, cleaned, typedPostcode).slice(0, params.limit ?? 5).map(({ feature, ...row }) => {
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

    const houseNumber = feature.address || typedHouseNumber(row, cleaned);
    const postcode = postcodeCtx?.text || typedPostcode || '';
    const country = countryCtx?.text || props.country_code?.toUpperCase() || '';
    // A picked row's display_name is saved as the address line, so it must carry the kept number/postcode
    if (houseNumber !== (feature.address || '') || postcode !== (postcodeCtx?.text || '')) {
      fullAddress = composeFullAddress(isStreet ? feature.text : '', houseNumber, cityCtx?.text || '', postcode, country);
    }

    return {
      place_id: feature.id,
      lat,
      lon: lng,
      display_name: fullAddress,
      address: {
        name: isAddress ? '' : feature.text,  // Empty for actual addresses, use text for places
        house_number: houseNumber,
        road: isStreet ? feature.text : '',  // Street name for street/address types
        city: cityCtx?.text || '',
        postcode,
        country,
      },
      county: row.county,
      precision: row.precision,
    };
  });
}
