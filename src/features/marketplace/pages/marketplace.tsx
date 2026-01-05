import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { fetchMarketplaceListingAction, publishMarketplaceListingAction, updateMarketplaceVisibilityAction } from '../actions';
import { fetchCurrentBusinessAction } from '../../business/actions';
import type { PortfolioImage } from '../components/MarketplaceImagesSection';
import type { PublishMarketplaceListingRequest } from '../types';
import { 
  selectMarketplaceBusiness,
  selectMarketplaceListing, 
  selectMarketplaceLoading,
  selectMarketplaceLocations,
  selectMarketplaceServices,
  selectMarketplaceCategories,
  selectMarketplaceTeamMembers,
  selectListedLocations,
  selectListedServices,
  selectListedCategories,
  selectListedTeamMembers,
  selectMarketplacePublishing,
  selectMarketplaceUpdatingVisibility,
} from '../selectors';
import { getCurrentBusinessSelector } from '../../business/selectors';
import { NotListedYetView } from '../components/NotListedYetView';
import { ListingConfigurationView } from '../components/ListingConfigurationView';
import { MarketplaceSkeleton } from '../components/MarketplaceSkeleton';
import { ListingConfigurationSkeleton } from '../components/ListingConfigurationSkeleton';

export default function MarketplacePage() {
  const dispatch = useDispatch();  
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
  const locations = useSelector(selectMarketplaceLocations);
  const services = useSelector(selectMarketplaceServices);
  const categories = useSelector(selectMarketplaceCategories);
  const teamMembers = useSelector(selectMarketplaceTeamMembers);
  const listedLocations = useSelector(selectListedLocations);
  const listedServices = useSelector(selectListedServices);
  const listedCategories = useSelector(selectListedCategories);
  const listedTeamMembers = useSelector(selectListedTeamMembers);
  const isPublishing = useSelector(selectMarketplacePublishing);
  const isUpdatingVisibility = useSelector(selectMarketplaceUpdatingVisibility);
  
  const [showConfiguration, setShowConfiguration] = useState(false);

  useEffect(() => {
    dispatch(fetchMarketplaceListingAction.request());
    dispatch(fetchCurrentBusinessAction.request());
  }, [dispatch]);

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
    locationIds: number[];
    serviceIds: number[];
    categoryIds: number[];
    teamMemberIds: number[];
    marketplaceName?: string;
    marketplaceEmail?: string;
    marketplaceDescription?: string;
    useBusinessName: boolean;
    useBusinessEmail: boolean;
    useBusinessDescription: boolean;
    allowOnlineBooking: boolean;
    featuredImageId?: string | null;
    portfolioImages?: PortfolioImage[];
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
        locationIds: data.locationIds,
        serviceIds: data.serviceIds,
        categoryIds: data.categoryIds,
        teamMemberIds: data.teamMemberIds,
        marketplaceName: data.marketplaceName,
        marketplaceEmail: data.marketplaceEmail,
        marketplaceDescription: data.marketplaceDescription,
        useBusinessName: data.useBusinessName,
        useBusinessEmail: data.useBusinessEmail,
        useBusinessDescription: data.useBusinessDescription,
        showTeamMembers: true,
        showServices: true,
        showLocations: true,
        allowOnlineBooking: data.allowOnlineBooking,
        existingImageIds,
        newImagesMeta: newImagesMeta.length > 0 ? newImagesMeta : undefined,
        featuredImageKey,
      },
      newImageFiles: Object.keys(newImageFiles).length > 0 ? newImageFiles : undefined,
    };

    dispatch(publishMarketplaceListingAction.request(request as any));
  };

  const handleToggleVisibility = (isVisible: boolean) => {
    dispatch(updateMarketplaceVisibilityAction.request({ isVisible }));
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
          locations={locations}
          services={services}
          categories={categories}
          teamMembers={teamMembers}
          listedLocations={listedLocations}
          listedServices={listedServices}
          listedCategories={listedCategories}
          listedTeamMembers={listedTeamMembers}
          isPublishing={isPublishing}
          isVisible={listing.isVisible}
          isUpdatingVisibility={isUpdatingVisibility}
          isListed={listing.isListed}
          marketplaceName={listing.marketplaceName}
          marketplaceEmail={listing.marketplaceEmail}
          marketplaceDescription={listing.marketplaceDescription}
          useBusinessName={listing.useBusinessName}
          useBusinessEmail={listing.useBusinessEmail}
          useBusinessDescription={listing.useBusinessDescription}
          allowOnlineBooking={listing.allowOnlineBooking}
          featuredImage={listing.featuredImage}
          portfolioImages={listing.portfolioImages}
          onSave={handleSaveConfiguration}
          onToggleVisibility={handleToggleVisibility}
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
          locations={locations}
          services={services}
          teamMembers={teamMembers}
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


