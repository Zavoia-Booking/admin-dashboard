const BASE_URL = 'https://api.locationiq.com/v1';
let warnedNoToken = false;

type CacheEntry = { data: any[]; ts: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function getToken(): string | undefined {
  // Vite env
  return (import.meta as any).env?.VITE_LOCATIONIQ_TOKEN;
}

// Normalize Romanian diacritics for better search results
function normalizeDiacritics(text: string): string {
  const diacriticsMap: Record<string, string> = {
    'ă': 'a', 'Ă': 'A',
    'â': 'a', 'Â': 'A',
    'î': 'i', 'Î': 'I',
    'ș': 's', 'Ș': 'S',
    'ț': 't', 'Ț': 'T',
  };
  return text.replace(/[ăâîșțĂÂÎȘȚ]/g, char => diacriticsMap[char] || char);
}

export async function locationIqAutocomplete(params: {
  query: string;
  limit?: number;
  countryCodes?: string[]; // e.g. ['ro']
}): Promise<any[]> {
  const token = getToken();
  if (!token) {
    if (!warnedNoToken && typeof window !== 'undefined') {
      warnedNoToken = true;
      // eslint-disable-next-line no-console
      console.warn('[LocationIQ] Missing VITE_LOCATIONIQ_TOKEN. Autocomplete will be disabled.');
    }
    return [];
  }

  // Build cache key
  const key = `auto:${(params.query || '').trim().toLowerCase()}|${params.limit ?? 5}|${(params.countryCodes || []).join(',')}`;
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.ts < TTL_MS) {
    return hit.data;
  }

  const url = new URL(`${BASE_URL}/autocomplete`);
  url.searchParams.set('key', token);
  // Normalize diacritics to improve search results (e.g., "Garlei" finds "Gârlei")
  url.searchParams.set('q', normalizeDiacritics(params.query));
  url.searchParams.set('limit', String(params.limit ?? 5));
  url.searchParams.set('autocomplete', '1');
  if (params.countryCodes?.length) {
    url.searchParams.set('countrycodes', params.countryCodes.join(','));
  }

  const res = await fetch(url.toString());
  // 404 means no results found, which is valid (not an error)
  if (res.status === 404) {
    CACHE.set(key, { data: [], ts: now });
    return [];
  }
  if (!res.ok) return [];
  const json = await res.json();
  CACHE.set(key, { data: json, ts: now });
  return json;
}


