import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_LOCATION_MARKETPLACE_TAGS,
  getLocationMarketplaceTagsApi,
  updateLocationMarketplaceTagsApi,
  type LocationMarketplaceTags,
} from "../api";

/**
 * Loads (and lets you save) the marketplace tag selections for a single location.
 * Loader fires only when `locationId` is a positive integer (i.e. the slider
 * has an actual location). Saving optimistically returns the server's
 * round-tripped state.
 */
export const useLocationMarketplaceTags = (locationId: number | null) => {
  const [tags, setTags] = useState<LocationMarketplaceTags>(
    EMPTY_LOCATION_MARKETPLACE_TAGS,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saveError, setSaveError] = useState<unknown>(null);

  const reload = useCallback(() => {
    if (!locationId || locationId <= 0) {
      setTags(EMPTY_LOCATION_MARKETPLACE_TAGS);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    getLocationMarketplaceTagsApi(locationId)
      .then((data) => {
        setTags(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setLoadError(err);
        setIsLoading(false);
      });
  }, [locationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (
      next: Partial<LocationMarketplaceTags>,
    ): Promise<LocationMarketplaceTags> => {
      if (!locationId || locationId <= 0) {
        throw new Error("Cannot save tags without a location id");
      }
      setIsSaving(true);
      setSaveError(null);
      try {
        const updated = await updateLocationMarketplaceTagsApi(locationId, next);
        setTags(updated);
        return updated;
      } catch (err) {
        setSaveError(err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [locationId],
  );

  return {
    tags,
    isLoading,
    isSaving,
    loadError,
    saveError,
    reload,
    save,
  };
};
