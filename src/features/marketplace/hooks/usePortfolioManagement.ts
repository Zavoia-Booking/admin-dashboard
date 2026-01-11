import { useState, useEffect, useMemo } from 'react';
import type { PortfolioImage } from '../components/MarketplaceImagesSection';

interface UsePortfolioManagementProps {
  featuredImage?: string | null;
  portfolioImages?: string[] | null;
}

export function usePortfolioManagement({
  featuredImage,
  portfolioImages,
}: UsePortfolioManagementProps) {
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  
  // Track initial state for dirty detection
  const [initialFeaturedId, setInitialFeaturedId] = useState<string | null>(null);
  const [initialPortfolioCount, setInitialPortfolioCount] = useState<number>(0);

  // Initialize portfolio on mount
  useEffect(() => {
    if (portfolioImages && portfolioImages.length > 0) {
      const existingImages: PortfolioImage[] = portfolioImages.map((url, index) => ({
        tempId: `existing-${index}`,
        url,
      }));
      setPortfolio(existingImages);
      setInitialPortfolioCount(existingImages.length);
      
      if (featuredImage) {
        const featuredImageIndex = portfolioImages.indexOf(featuredImage);
        if (featuredImageIndex !== -1) {
          const featuredId = `existing-${featuredImageIndex}`;
          setFeaturedImageId(featuredId);
          setInitialFeaturedId(featuredId);
        }
      }
    } else {
      setInitialPortfolioCount(0);
      setInitialFeaturedId(null);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync portfolio images when props change
  useEffect(() => {
    if (portfolioImages && portfolioImages.length > 0) {
      const existingImages: PortfolioImage[] = portfolioImages.map((url, index) => ({
        tempId: `existing-${index}`,
        url,
      }));
      setPortfolio(existingImages);
      setInitialPortfolioCount(existingImages.length);
      
      if (featuredImage) {
        const featuredImageIndex = portfolioImages.indexOf(featuredImage);
        if (featuredImageIndex !== -1) {
          const featuredId = `existing-${featuredImageIndex}`;
          setFeaturedImageId(featuredId);
          setInitialFeaturedId(featuredId);
        }
      } else {
        setInitialFeaturedId(null);
      }
    } else {
      setPortfolio([]);
      setFeaturedImageId(null);
      setInitialPortfolioCount(0);
      setInitialFeaturedId(null);
    }
  }, [portfolioImages, featuredImage]);

  // Check if portfolio is dirty
  const isDirty = useMemo(() => {
    // Check if featured image changed
    if (featuredImageId !== initialFeaturedId) return true;
    
    // Check if portfolio count changed (added/removed images)
    if (portfolio.length !== initialPortfolioCount) return true;
    
    // Check if any new images were added (have 'file' property)
    const hasNewImages = portfolio.some(img => img.file);
    if (hasNewImages) return true;
    
    return false;
  }, [featuredImageId, initialFeaturedId, portfolio, initialPortfolioCount]);

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

