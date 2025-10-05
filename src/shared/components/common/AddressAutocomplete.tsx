import { useEffect, useMemo, useRef, useState } from 'react';
import { locationIqAutocomplete } from '../../lib/locationiq';
import type { AddressAutocompleteChange, AddressSuggestion } from '../../types/geo';
import { Input } from '../ui/input';

type Props = {
  value?: string;
  onChange: (change: AddressAutocompleteChange) => void;
  placeholder?: string;
  debounceMs?: number;
  countryCodes?: string[];
  limit?: number;
  disabled?: boolean;
  className?: string;
};

const DEFAULT_COUNTRY_CODES = ['ro'];

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing an address...',
  debounceMs = 500,
  countryCodes = DEFAULT_COUNTRY_CODES,
  limit = 5,
  disabled,
  className,
}: Props) {
  const [query, setQuery] = useState<string>(value ?? '');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldFetchRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof value === 'string' && value !== query) {
      setQuery(value);
    }
  }, [value, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Stable dependency key for country codes
  const codesKey = useMemo(() => (countryCodes || []).join(','), [countryCodes]);

  // Debounced fetch
  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setSuggestions(prev => (prev.length ? [] : prev));
      setOpen(prev => (prev ? false : prev));
      return;
    }
    // Only fetch when user is typing, not after a selection
    if (!shouldFetchRef.current) {
      return;
    }
    // Show dropdown immediately with loading state
    setOpen(true);
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const raw = await locationIqAutocomplete({ query, limit, countryCodes });
        const seen = new Set<string>();
        const mapped: AddressSuggestion[] = [];
        (raw || []).forEach((r: any) => {
          const id = String(r.place_id ?? r.osm_id ?? r.placeId ?? `${r.lat},${r.lon}`);
          const lat = Number(r.lat);
          const lng = Number(r.lon ?? r.lng);
          const key = `${id}|${lat}|${lng}`;
          if (seen.has(key)) return;
          seen.add(key);
          mapped.push({
            id,
            displayName: r.display_name ?? r.description ?? r.name ?? query,
            address: r.address?.road || r.address?.house_number ? `${r.address?.road ?? ''} ${r.address?.house_number ?? ''}`.trim() : (r.display_name ?? ''),
            lat,
            lng,
            city: r.address?.city || r.address?.town || r.address?.village,
            postalCode: r.address?.postcode,
            country: r.address?.country,
          });
        });
        setSuggestions(mapped);
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, debounceMs, limit, codesKey]);

  const handleSelect = (s: AddressSuggestion) => {
    shouldFetchRef.current = false;
    setQuery(s.displayName);
    setLoading(false);
    setSuggestions([]);
    setOpen(false);
    onChange({ address: s.displayName, suggestion: s });
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* hidden trap input to discourage browser autofill */}
      <input type="text" style={{ display: 'none' }} name="__trap_address" autoComplete="new-password" />
      <Input
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          shouldFetchRef.current = true;
          setQuery(next);
          onChange({ address: next });
        }}
        onFocus={(e) => {
          e.currentTarget.setAttribute('autocomplete', 'new-password');
          if (suggestions.length) setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
        name={`addr-${Math.random().toString(36).slice(2)}`}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        inputMode="search"
        aria-autocomplete="list"
        className="h-11"
      />
      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow">
          {loading && (
            <div className="p-3 text-sm text-gray-500">Searching...</div>
          )}
          {!loading && suggestions.map((s, idx) => (
            <button
              key={`${s.id}-${idx}`}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => handleSelect(s)}
            >
              <div className="text-sm text-gray-900">{s.displayName}</div>
              {s.city && (
                <div className="text-xs text-gray-500">{s.city}{s.postalCode ? `, ${s.postalCode}` : ''}</div>
              )}
            </button>
          ))}
          {!loading && suggestions.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No results</div>
          )}
        </div>
      )}
    </div>
  );
}


