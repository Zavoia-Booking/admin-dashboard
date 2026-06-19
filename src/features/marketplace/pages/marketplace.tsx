import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
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
  selectMarketplaceError,
  selectLocationCatalog,
  selectMarketplacePublishing,
  selectMarketplaceIndustries,
  selectMarketplaceIndustryTags,
  selectMarketplaceSelectedIndustryTags,
} from "../selectors";
import { NotListedYetView } from "../components/NotListedYetView";
import { ListingConfigurationView } from "../components/ListingConfigurationView";
import { ListingConfigurationSkeleton } from "../components/ListingConfigurationSkeleton";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate";
import { Button } from "../../../shared/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function MarketplacePage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation("marketplace");
  const business = useSelector(selectMarketplaceBusiness);
  const listing = useSelector(selectMarketplaceListing);
  const isLoading = useSelector(selectMarketplaceLoading);
  const error = useSelector(selectMarketplaceError);
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

  const handleStartListing = () => {
    setShowConfiguration(true);
  };

  const handleSaveConfiguration = (data: PublishMarketplaceListingPayload) => {
    // The form (useMarketplaceForm) already produces the full publish payload — profile/branding
    // fields plus the section-builder slice (pageLayout / pageTheme / faq / announcement). Spread it
    // so new fields never get silently dropped here; we only stamp the always-on visibility flags.
    // Note: portfolioImages + featured image are saved immediately on upload/delete/select, and
    // per-location publicity / online-booking flags are toggled inline per location — not here.
    const payload: PublishMarketplaceListingPayload = {
      ...data,
      showTeamMembers: true,
      showServices: true,
      showLocations: true,
    };

    dispatch(publishMarketplaceListingAction.request(payload));
  };

  // Show loading state — A7: only the initial load shows the skeleton. A refetch (e.g. the
  // post-publish reload) keeps `listing` in state, so we keep the current view mounted instead of
  // flashing the full skeleton over it.
  if (isLoading && !listing) {
    // ListingConfigurationSkeleton mirrors the real tabs and uses the same
    // `-mt-8` breakout, so treat it as a tabbed page too.
    return (
      <AppLayout tabbedPage>
        <BusinessSetupGate>
          <ListingConfigurationSkeleton />
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  // A5: fetch failed and we have nothing to show — surface the error with a retry instead of
  // silently falling through to the generic "no listing data" message.
  if (error && !listing) {
    return (
      <AppLayout>
        <BusinessSetupGate>
          <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 px-4 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden />
            <p className="text-sm text-muted-foreground">{t("page.loadError")}</p>
            <Button
              variant="outline"
              onClick={() => dispatch(fetchMarketplaceListingAction.request())}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              {t("page.retry")}
            </Button>
          </div>
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  // Show configuration view when listing is published OR user clicked "Start Listing"
  if (listing && (listing.isListed || showConfiguration)) {
    return (
      <AppLayout tabbedPage>
        <BusinessSetupGate>
          <ListingConfigurationView
            business={business}
            locationsWithAssignments={locationCatalog}
            isPublishing={isPublishing}
            isListed={listing.isListed}
            marketplaceName={listing.marketplaceName}
            marketplaceEmail={listing.marketplaceEmail}
            marketplacePhone={listing.marketplacePhone}
            marketplaceDescription={listing.marketplaceDescription}
            useBusinessName={listing.useBusinessName}
            useBusinessEmail={listing.useBusinessEmail}
            useBusinessPhone={listing.useBusinessPhone}
            useBusinessDescription={listing.useBusinessDescription}
            heroImageUrl={listing.heroImageUrl}
            tagline={listing.tagline}
            aboutContent={listing.aboutContent}
            brandColorHex={listing.brandColorHex}
            pageLayout={listing.pageLayout}
            pageTheme={listing.pageTheme}
            faq={listing.faq}
            announcement={listing.announcement}
            industries={industries}
            industryTags={industryTags}
            selectedIndustryTags={selectedIndustryTags}
            onSave={handleSaveConfiguration}
          />
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  // Show "Not Listed Yet" marketing view when not listed and configuration not started
  if (listing && !listing.isListed) {
    return (
      <AppLayout>
        <BusinessSetupGate>
          <NotListedYetView
            onStartListing={handleStartListing}
            business={business}
            listing={listing}
            locations={locationCatalog}
            services={locationCatalog.flatMap((loc) => loc.services)}
            teamMembers={locationCatalog.flatMap((loc) => loc.teamMembers)}
          />
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  // Fallback (should not reach here if listing data is loaded)
  return (
    <AppLayout>
      <BusinessSetupGate>
        <div className="p-4 flex items-center justify-center h-[calc(100vh-200px)] cursor-default">
          <p className="text-muted-foreground">{t("page.noListingData")}</p>
        </div>
      </BusinessSetupGate>
    </AppLayout>
  );
}
