import { useState, useEffect, useMemo } from 'react';
import type { PortfolioImage } from '../components/MarketplaceImagesSection';
import type { PortfolioImageData } from '../types';

interface UsePortfolioManagementProps {
  featuredImage?: string | null;
  portfolioImages?: PortfolioImageData[] | null;
}

export function usePortfolioManagement({
  featuredImage,
  portfolioImages,
}: UsePortfolioManagementProps) {
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  
  // Track initial state for dirty detection
  // Note: Portfolio images AND featured choice are saved immediately, so nothing is dirty here
  const [isInitialized, setIsInitialized] = useState(false);

  // Consolidated effect: Initialize on mount and sync when props change
  useEffect(() => {
    if (portfolioImages && portfolioImages.length > 0) {
      const existingImages: PortfolioImage[] = portfolioImages.map((img, index) => ({
        tempId: `existing-${index}`,
        url: img.url,
        key: img.key,
        originalName: img.originalName,
        size: img.size,
      }));
      
      setPortfolio(existingImages);
      
      if (featuredImage) {
        // Find by URL
        const featuredImg = existingImages.find(img => img.url === featuredImage);
        if (featuredImg) {
          setFeaturedImageId(featuredImg.tempId);
        }
      }
    } else {
      setPortfolio([]);
      setFeaturedImageId(null);
    }
    
    // Mark as initialized after first run
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [portfolioImages, featuredImage, isInitialized]);

  // Check if portfolio is dirty
  // Always false because changes are instant
  const isDirty = false;

  return {
    // State
    featuredImageId,
    portfolio,
    isDirty,
    // Setters
    setFeaturedImageId,
    setPortfolio,
  };
}

