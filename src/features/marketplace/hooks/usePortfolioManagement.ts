import { useState } from 'react';
import type { PortfolioImage } from '../components/MarketplaceImagesSection';
import type { LocationWithAssignments } from '../types';

interface UsePortfolioManagementProps {
  locationId: number | null;
  locationsWithAssignments: LocationWithAssignments[];
}

function buildPortfolioState(
  locationId: number | null,
  catalog: LocationWithAssignments[],
): { portfolio: PortfolioImage[]; featuredImageId: string | null } {
  const activeLocation =
    locationId == null
      ? null
      : catalog.find((l) => l.id === locationId) ?? null;

  if (!activeLocation) {
    return { portfolio: [], featuredImageId: null };
  }

  const sourceImages = activeLocation.portfolioImages || [];
  const sourceFeatured = activeLocation.featuredImage;

  const existingImages: PortfolioImage[] = sourceImages.map((img, index) => ({
    tempId: `loc-${activeLocation.id}-${img.key ?? index}`,
    url: img.url,
    key: img.key,
    originalName: img.originalName,
    size: img.size,
  }));

  return {
    portfolio: existingImages,
    featuredImageId: sourceFeatured
      ? existingImages.find((img) => img.url === sourceFeatured)?.tempId ?? null
      : null,
  };
}

/**
 * Per-location portfolio state.
 *
 * Re-initializes from Redux only when the active locationId changes — NOT on
 * every catalog update. This is important because each successful upload/delete
 * dispatches setLocationPortfolioAction (so Redux stays the source of truth and
 * other UI like publish-button gating updates), but we don't want that dispatch
 * to clobber in-flight optimistic state in the gallery component.
 *
 * The re-init happens during render rather than in an effect so a freshly
 * mounted gallery never paints an empty frame before its images arrive.
 */
export function usePortfolioManagement({
  locationId,
  locationsWithAssignments,
}: UsePortfolioManagementProps) {
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(
    () => buildPortfolioState(locationId, locationsWithAssignments).featuredImageId,
  );
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>(
    () => buildPortfolioState(locationId, locationsWithAssignments).portfolio,
  );
  const [syncedLocationId, setSyncedLocationId] = useState(locationId);

  // Reading the catalog here rather than in an effect keeps the re-init gated
  // on locationId alone while still using the freshest catalog available.
  if (syncedLocationId !== locationId) {
    const next = buildPortfolioState(locationId, locationsWithAssignments);
    setSyncedLocationId(locationId);
    setPortfolio(next.portfolio);
    setFeaturedImageId(next.featuredImageId);
  }

  return {
    featuredImageId,
    portfolio,
    setFeaturedImageId,
    setPortfolio,
    isDirty: false,
  };
}
