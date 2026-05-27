import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getLocationTagDictionariesApi,
  type LocationTagDictionaries,
  type TagDictionaryEntry,
} from "../api";

/**
 * Session-cached fetch of the 6 location-marketplace tag dictionaries.
 *
 * The dictionaries are small (~68 rows total) and rarely change, so we memoize
 * the resolved server payload at module level. Display labels are resolved
 * client-side from each tag's slug via the `locationMarketplaceDetails`
 * i18n namespace, so locale changes re-render instantly without re-fetching.
 */
let cache: LocationTagDictionaries | null = null;
let inFlight: Promise<LocationTagDictionaries> | null = null;

const fetchOnce = (): Promise<LocationTagDictionaries> => {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = getLocationTagDictionariesApi()
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

export type ChipOption = { id: number; label: string; slug: string };

export type ResolvedTagDictionaries = {
  amenities: ChipOption[];
  audience: ChipOption[];
  values: ChipOption[];
  accessibility: ChipOption[];
  paymentMethods: ChipOption[];
  languages: ChipOption[];
};

export const useLocationTagDictionaries = () => {
  const { t } = useTranslation("locationMarketplaceDetails");
  const [raw, setRaw] = useState<LocationTagDictionaries | null>(cache);
  const [isLoading, setIsLoading] = useState(!cache);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchOnce()
      .then((data) => {
        setRaw(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!cache) load();
  }, [load]);

  // Resolve labels via i18n with the canonical English `name` as the fallback.
  // `t(key, defaultValue)` returns the localized value when present, else the
  // backend-provided `name`. Recomputes when the user switches languages.
  const dictionaries = useMemo<ResolvedTagDictionaries | null>(() => {
    if (!raw) return null;
    const resolve = (group: keyof LocationTagDictionaries) =>
      raw[group].map(
        (entry: TagDictionaryEntry): ChipOption => ({
          id: entry.id,
          slug: entry.slug,
          label: t(`tags.${group}.${entry.slug}`, entry.name),
        }),
      );

    return {
      amenities: resolve("amenities"),
      audience: resolve("audience"),
      values: resolve("values"),
      accessibility: resolve("accessibility"),
      paymentMethods: resolve("paymentMethods"),
      languages: resolve("languages"),
    };
  }, [raw, t]);

  return { dictionaries, isLoading, error, reload: load };
};
