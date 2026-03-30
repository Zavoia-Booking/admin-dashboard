import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { AccessGuard } from "../../../shared/components/guards/AccessGuard";
import { useTranslation } from "react-i18next";
import {
  fetchMarketplaceListingAction,
  publishMarketplaceListingAction,
} from "../actions";
import type { PublishMarketplaceListingPayload } from "../types";
import {
  selectMarketplaceBusiness,
  selectMarketplaceListing,
  selectMarketplaceLoading,
  selectLocationCatalog,
  selectMarketplacePublishing,
  selectMarketplaceIndustries,
  selectMarketplaceIndustryTags,
  selectMarketplaceSelectedIndustryTags,
} from "../selectors";
import { NotListedYetView } from "../components/NotListedYetView";
import { ListingConfigurationView } from "../components/ListingConfigurationView";
import { MarketplaceSkeleton } from "../components/MarketplaceSkeleton";
import { ListingConfigurationSkeleton } from "../components/ListingConfigurationSkeleton";

export default function MarketplacePage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation("marketplace");
  const business = useSelector(selectMarketplaceBusiness);
  const listing = useSelector(selectMarketplaceListing);
  const isLoading = useSelector(selectMarketplaceLoading);
  const locationCatalog = useSelector(selectLocationCatalog);
  const isPublishing = useSelector(selectMarketplacePublishing);
  const industries = useSelector(selectMarketplaceIndustries);
  const industryTags = useSelector(selectMarketplaceIndustryTags);
  const selectedIndustryTags = useSelector(
    selectMarketplaceSelectedIndustryTags,
  );

  const [showConfiguration, setShowConfiguration] = useState(false);

  // Fetch marketplace data on mount and when navigating back to this page
  useEffect(() => {
    dispatch(fetchMarketplaceListingAction.request());
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
    isVisible: boolean;
    industryTagIds?: number[];
  }) => {
    // Note: portfolioImages AND featured image are saved immediately on upload/delete/select,
    // not in the save payload anymore
    const payload: PublishMarketplaceListingPayload = {
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
      industryTagIds: data.industryTagIds,
    };

    dispatch(publishMarketplaceListingAction.request(payload));
  };

  // Show loading state
  if (isLoading) {
    return (
      <AccessGuard>
        <AppLayout>
          {listing && !listing.isListed ? (
            <MarketplaceSkeleton />
          ) : (
            <ListingConfigurationSkeleton />
          )}
        </AppLayout>
      </AccessGuard>
    );
  }

  // Show configuration view when listing is published OR user clicked "Start Listing"
  if (listing && (listing.isListed || showConfiguration)) {
    return (
      <AccessGuard>
        <AppLayout>
        <ListingConfigurationView
          business={business}
          locationsWithAssignments={locationCatalog}
          isPublishing={isPublishing}
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
        />
        </AppLayout>
      </AccessGuard>
    );
  }

  // Show "Not Listed Yet" marketing view when not listed and configuration not started
  if (listing && !listing.isListed) {
    return (
      <AccessGuard>
        <AppLayout>
        <NotListedYetView
          onStartListing={handleStartListing}
          business={business}
          listing={listing}
          locations={locationCatalog}
          services={locationCatalog.flatMap((loc) => loc.services)}
          teamMembers={locationCatalog.flatMap((loc) => loc.teamMembers)}
        />
        </AppLayout>
      </AccessGuard>
    );
  }

  // Fallback (should not reach here if listing data is loaded)
  return (
    <AccessGuard>
      <AppLayout>
        <div className="p-4 flex items-center justify-center h-[calc(100vh-200px)] cursor-default">
          <p className="text-muted-foreground">{t("page.noListingData")}</p>
        </div>
      </AppLayout>
    </AccessGuard>
  );
}
