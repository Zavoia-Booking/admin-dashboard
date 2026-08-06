import { useEffect, useLayoutEffect, useState } from "react";
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
import { selectCurrentUser } from "../../auth/selectors";
import { ErrorState } from "../../../shared/components/common/ErrorState";
import { scrollAppContentToTop } from "../../../shared/utils/scroll";

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
  const currentUser = useSelector(selectCurrentUser);
  // BusinessSetupGate's condition. Other gated pages fetch inside components rendered as
  // the gate's children, so no request fires while the setup prompt is up; this page
  // fetches at page level, so it has to skip explicitly or the guaranteed 403
  // ("You need a business account…") toasts over the gate's screen.
  const hasBusiness = Boolean(currentUser?.businessId);

  const [showConfiguration, setShowConfiguration] = useState(false);

  // Fetch marketplace data on mount and when navigating back to this page
  useEffect(() => {
    if (!hasBusiness) return;
    dispatch(fetchMarketplaceListingAction.request());
  }, [dispatch, location.pathname, hasBusiness]); // Refetch when pathname changes

  // The marketing view and the configuration view swap in place under the same AppLayout, so
  // <main> stays mounted and keeps its scroll offset. Someone who read the marketing page to the
  // bottom before tapping "Publish my listing" (the CTA lives in the sticky mobile header, so it's
  // reachable from anywhere) would land mid-page in the configuration form. Reset before paint.
  useLayoutEffect(() => {
    if (!showConfiguration) return;
    scrollAppContentToTop();
  }, [showConfiguration]);

  const handleStartListing = () => {
    setShowConfiguration(true);
  };

  const handleSaveConfiguration = (data: PublishMarketplaceListingPayload) => {
    // The form produces Marketplace-only data. Website Builder content is saved separately.
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
          <ErrorState
            variant="page"
            body={t("page.loadError")}
            onRetry={() => dispatch(fetchMarketplaceListingAction.request())}
            retryLabel={t("page.retry")}
          />
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
      <AppLayout headerHidden>
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
