import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { 
  fetchMarketplaceListingAction, 
  publishMarketplaceListingAction, 
  updateBookingSettingsAction
} from '../actions';
import { fetchCurrentBusinessAction } from '../../business/actions';
import type { PortfolioImage } from '../components/MarketplaceImagesSection';
import type { PublishMarketplaceListingRequest, UpdateBookingSettingsPayload } from '../types';
import { 
  selectMarketplaceBusiness,
  selectMarketplaceListing, 
  selectMarketplaceLoading,
  selectLocationCatalog,
  selectMarketplacePublishing,
  selectBookingSettingsSaving,
  selectMarketplaceIndustries,
  selectMarketplaceIndustryTags,
  selectMarketplaceSelectedIndustryTags,
} from '../selectors';
import { getCurrentBusinessSelector } from '../../business/selectors';
import { NotListedYetView } from '../components/NotListedYetView';
import { ListingConfigurationView } from '../components/ListingConfigurationView';
import { MarketplaceSkeleton } from '../components/MarketplaceSkeleton';
import { ListingConfigurationSkeleton } from '../components/ListingConfigurationSkeleton';

export default function MarketplacePage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const marketplaceBusiness = useSelector(selectMarketplaceBusiness);
  const globalBusiness = useSelector(getCurrentBusinessSelector);
  
  // Use global business as base, then override with marketplace-specific data if available.
  // This ensures the logo and other global details are present even if the marketplace API 
  // returns a partial business object.
  const business = marketplaceBusiness && globalBusiness 
    ? { ...globalBusiness, ...marketplaceBusiness, logo: marketplaceBusiness.logo || globalBusiness.logo }
    : (marketplaceBusiness || globalBusiness);
  const listing = useSelector(selectMarketplaceListing);
  const isLoading = useSelector(selectMarketplaceLoading);
  const locationCatalog = useSelector(selectLocationCatalog);
  const isPublishing = useSelector(selectMarketplacePublishing);
  const isSavingBookingSettings = useSelector(selectBookingSettingsSaving);
  const industries = useSelector(selectMarketplaceIndustries);
  const industryTags = useSelector(selectMarketplaceIndustryTags);
  const selectedIndustryTags = useSelector(selectMarketplaceSelectedIndustryTags);
  
  const [showConfiguration, setShowConfiguration] = useState(false);

  // Fetch marketplace data on mount and when navigating back to this page
  useEffect(() => {
    dispatch(fetchMarketplaceListingAction.request());
    dispatch(fetchCurrentBusinessAction.request());
  }, [dispatch, location.pathname]); // Refetch when pathname changes

  // Close configuration view when listing is successfully published
  useEffect(() => {
    if (!isPublishing && listing?.isListed && showConfiguration) {
      setShowConfiguration(false);
    }
  }, [isPublishing, listing?.isListed, showConfiguration]);

  const handleStartListing = () => {
    setShowConfiguration(true);
  };

  const handleSaveConfiguration = (data: {
    marketplaceName?: string;
    marketplaceEmail?: string;
    marketplacePhone?: string;
    marketplaceDescription?: string;
    useBusinessName: boolean;
    useBusinessEmail: boolean;
    useBusinessPhone: boolean;
    useBusinessDescription: boolean;
    allowOnlineBooking: boolean;
    featuredImageId?: string | null;
    portfolioImages?: PortfolioImage[];
    isVisible: boolean;
    industryTagIds?: number[];
  }) => {
    const portfolioImages = data.portfolioImages || [];

    // Separate existing images (no file) from new uploads (have file)
    const newImages = portfolioImages.filter(img => img.file);

    // For now, treat existing as empty (will be wired properly when backend returns IDs)
    const existingImageIds: number[] = [];
    
    const newImagesMeta = newImages.map(img => ({
      tempId: img.tempId,
    }));

    // Build file map for new images
    const newImageFiles: Record<string, File> = {};
    newImages.forEach(img => {
      if (img.file) {
        newImageFiles[img.tempId] = img.file;
      }
    });

    const featuredImageKey = data.featuredImageId || undefined;

    const request: PublishMarketplaceListingRequest = {
      payload: {
        marketplaceName: data.marketplaceName,
        marketplaceEmail: data.marketplaceEmail,
        marketplacePhone: data.marketplacePhone,
        marketplaceDescription: data.marketplaceDescription,
        useBusinessName: data.useBusinessName,
        useBusinessEmail: data.useBusinessEmail,
        useBusinessPhone: data.useBusinessPhone,
        useBusinessDescription: data.useBusinessDescription,
        showTeamMembers: true,
        showServices: true,
        showLocations: true,
        allowOnlineBooking: data.allowOnlineBooking,
        isVisible: data.isVisible,
        existingImageIds,
        newImagesMeta: newImagesMeta.length > 0 ? newImagesMeta : undefined,
        featuredImageKey,
        industryTagIds: data.industryTagIds,
      },
      newImageFiles: Object.keys(newImageFiles).length > 0 ? newImageFiles : undefined,
    };

    dispatch(publishMarketplaceListingAction.request(request as any));
  };

  const handleSaveBookingSettings = (data: UpdateBookingSettingsPayload) => {
    dispatch(updateBookingSettingsAction.request(data));
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        {listing && !listing.isListed ? (
          <MarketplaceSkeleton />
        ) : (
          <ListingConfigurationSkeleton />
        )}
      </AppLayout>
    );
  }

  // Show configuration view when listing is published OR user clicked "Start Listing"
  if (listing && (listing.isListed || showConfiguration)) {
    return (
      <AppLayout>
        <ListingConfigurationView
          business={business}
          locationsWithAssignments={locationCatalog}
          isPublishing={isPublishing || isSavingBookingSettings}
          isVisible={listing.isVisible}
          isListed={listing.isListed}
          marketplaceName={listing.marketplaceName}
          marketplaceEmail={listing.marketplaceEmail}
          marketplacePhone={listing.marketplacePhone}
          marketplaceDescription={listing.marketplaceDescription}
          useBusinessName={listing.useBusinessName}
          useBusinessEmail={listing.useBusinessEmail}
          useBusinessPhone={listing.useBusinessPhone}
          useBusinessDescription={listing.useBusinessDescription}
          allowOnlineBooking={listing.allowOnlineBooking}
          featuredImage={listing.featuredImage}
          portfolioImages={listing.portfolioImages}
          industries={industries}
          industryTags={industryTags}
          selectedIndustryTags={selectedIndustryTags}
          onSave={handleSaveConfiguration}
          onSaveBookingSettings={handleSaveBookingSettings}
        />
      </AppLayout>
    );
  }

  // Show "Not Listed Yet" marketing view when not listed and configuration not started
  if (listing && !listing.isListed) {
    return (
      <AppLayout>
        <NotListedYetView 
          onStartListing={handleStartListing}
          business={business}
          listing={listing}
          locations={locationCatalog}
          services={locationCatalog.flatMap(loc => loc.services)}
          teamMembers={locationCatalog.flatMap(loc => loc.teamMembers)}
        />
      </AppLayout>
    );
  }

  // Fallback (should not reach here if listing data is loaded)
  return (
    <AppLayout>
      <div className="p-4 flex items-center justify-center h-[calc(100vh-200px)] cursor-default">
        <p className="text-muted-foreground">No listing data available</p>
      </div>
    </AppLayout>
  );
}


