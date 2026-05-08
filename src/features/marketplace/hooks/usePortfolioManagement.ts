import { useEffect, useRef, useState } from 'react';
import type { PortfolioImage } from '../components/MarketplaceImagesSection';
import type { LocationWithAssignments } from '../types';

interface UsePortfolioManagementProps {
  locationId: number | null;
  locationsWithAssignments: LocationWithAssignments[];
}

/**
 * Per-location portfolio state.
 *
 * Re-initializes from Redux only when the active locationId changes — NOT on
 * every catalog update. This is important because each successful upload/delete
 * dispatches setLocationPortfolioAction (so Redux stays the source of truth and
 * other UI like publish-button gating updates), but we don't want that dispatch
 * to clobber in-flight optimistic state in the gallery component.
 */
export function usePortfolioManagement({
  locationId,
  locationsWithAssignments,
}: UsePortfolioManagementProps) {
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);

  // Always read the freshest catalog from inside the effect without making it
  // an effect dependency.
  const catalogRef = useRef(locationsWithAssignments);
  catalogRef.current = locationsWithAssignments;

  useEffect(() => {
    const activeLocation =
      locationId == null
        ? null
        : catalogRef.current.find((l) => l.id === locationId) ?? null;

    if (!activeLocation) {
      setPortfolio([]);
      setFeaturedImageId(null);
      return;
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

    setPortfolio(existingImages);
    setFeaturedImageId(
      sourceFeatured
        ? existingImages.find((img) => img.url === sourceFeatured)?.tempId ?? null
        : null,
    );
  }, [locationId]);

  return {
    featuredImageId,
    portfolio,
    setFeaturedImageId,
    setPortfolio,
    isDirty: false,
  };
}
