import { useEffect, useState } from 'react';
import { checkSlugAvailabilityApi } from '../api';

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * Debounced availability check for a business-page vanity slug.
 * Returns 'idle' when the slug is empty or unchanged from the saved one,
 * 'invalid' for a malformed slug, and 'available'/'taken' from the backend.
 */
export function useSlugAvailability(slug: string, initialSlug?: string | null): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>('idle');

  useEffect(() => {
    const s = slug.trim();
    if (!s || s === (initialSlug ?? '')) {
      setStatus('idle');
      return;
    }
    if (!/^[a-z0-9-]{3,100}$/.test(s)) {
      setStatus('invalid');
      return;
    }
    setStatus('checking');
    const id = setTimeout(async () => {
      try {
        const { available } = await checkSlugAvailabilityApi(s);
        setStatus(available ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 400);
    return () => clearTimeout(id);
  }, [slug, initialSlug]);

  return status;
}
