import { useCallback, useRef, useState } from 'react';
import { normText } from '../lib/addressLookup';

export const hasRealCoords = (lat?: unknown, lng?: unknown): boolean => {
  const toNum = (v: unknown): number =>
    typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  const a = toNum(lat);
  const b = toNum(lng);
  return Number.isFinite(a) && Number.isFinite(b) && !(a === 0 && b === 0);
};

const coordsKey = (lat?: unknown, lng?: unknown): string | null =>
  hasRealCoords(lat, lng) ? `${Number(lat)}|${Number(lng)}` : null;

export const pinKey = (address?: string | null, lat?: unknown, lng?: unknown): string | null => {
  const coords = coordsKey(lat, lng);
  return coords == null ? null : `${(address ?? '').trim()}|${coords}`;
};

export type PinLevel = 'address' | 'street' | 'town';

// Pin map opening zoom: one step further out when only the street or town is known, so the building is more often on screen
export const pinMapZoom = (level?: PinLevel | null): number => (level === 'street' || level === 'town' ? 15 : 16);

// A pin is confirmed exactly while the form holds an address + coordinates that were confirmed.
export function useLocationPinState() {
  const confirmed = useRef(new Set<string>());
  const hints = useRef(new Map<string, PinLevel>());
  const places = useRef(new Map<string, string>());
  const [version, setVersion] = useState(0);

  const isConfirmed = useCallback((key: string | null) => key != null && confirmed.current.has(key), []);
  const markConfirmed = useCallback((key: string | null) => {
    if (key == null) return;
    confirmed.current.add(key);
    // a spot the owner confirmed is theirs, no longer the map's guess
    hints.current.delete(key.split('|').slice(-2).join('|'));
    setVersion((v) => v + 1);
  }, []);
  const reset = useCallback(() => {
    confirmed.current.clear();
    hints.current.clear();
    places.current.clear();
    setVersion((v) => v + 1);
  }, []);

  // A hint says how precisely the coordinates were found, so it is kept by coordinates: the owner may still type the Number or Postcode.
  const setHint = useCallback((lat: unknown, lng: unknown, level: PinLevel) => {
    const key = coordsKey(lat, lng);
    if (key != null) hints.current.set(key, level);
  }, []);
  const hintFor = useCallback((lat: unknown, lng: unknown) => {
    const key = coordsKey(lat, lng);
    return key == null ? null : hints.current.get(key) ?? null;
  }, []);

  // The street + town the coordinates were set for: once either is changed, the stored pin belongs to another place.
  const notePlace = useCallback((lat: unknown, lng: unknown, street?: string | null, city?: string | null) => {
    const key = coordsKey(lat, lng);
    if (key != null) places.current.set(key, `${normText(street)}|${normText(city)}`);
  }, []);
  const placeChanged = useCallback((lat: unknown, lng: unknown, street?: string | null, city?: string | null) => {
    const key = coordsKey(lat, lng);
    const was = key == null ? undefined : places.current.get(key);
    return was !== undefined && was !== `${normText(street)}|${normText(city)}`;
  }, []);

  return { isConfirmed, markConfirmed, reset, setHint, hintFor, notePlace, placeChanged, version };
}
