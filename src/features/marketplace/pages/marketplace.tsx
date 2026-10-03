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

  const searchParams = new URLSearchParams(location.search);
  const requestedTab = searchParams.get("tab");
  const requestsPhotos =
    requestedTab === "locations" &&
    searchParams.get("section") === "photos";
  const requestsConfigurationView =
    searchParams.get("view") === "configuration" &&
    ["business", "locations", "reviews"].includes(requestedTab ?? "");
  const requestsConfiguration =
    location.state?.marketplaceOpenConfiguration === true ||
    requestsPhotos ||
    requestsConfigurationView;
  const [showConfiguration, setShowConfiguration] = useState(
    () => requestsConfiguration,
  );
  const configurationOpen = showConfiguration || requestsConfiguration;
  const [entryLoadState, setEntryLoadState] = useState<
    "pending" | "loading" | "ready"
  >("pending");

  useEffect(() => {
    if (requestsConfiguration) setShowConfiguration(true);
  }, [requestsConfiguration]);

  // Fetch marketplace data on mount and when navigating back to this page
  useEffect(() => {
    if (!hasBusiness) return;
    dispatch(fetchMarketplaceListingAction.request());
    setEntryLoadState("loading");
  }, [dispatch, location.pathname, hasBusiness]); // Refetch when pathname changes

  useEffect(() => {
    if (entryLoadState === "loading" && !isLoading && listing && !error) {
      setEntryLoadState("ready");
    }
  }, [entryLoadState, isLoading, listing, error]);

  // The marketing view and the configuration view swap in place under the same AppLayout, so
  // <main> stays mounted and keeps its scroll offset. Someone who read the marketing page to the
  // bottom before tapping "Publish my listing" (the CTA lives in the sticky mobile header, so it's
  // reachable from anywhere) would land mid-page in the configuration form. Reset before paint.
  useLayoutEffect(() => {
    if (!configurationOpen) return;
    scrollAppContentToTop();
  }, [configurationOpen]);

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

  // Incoming location workspace links wait for a fresh catalog so a newly created
  // location is not rejected against cached data. Later refetches keep the view mounted.
  const waitingForLocationCatalog =
    hasBusiness &&
    (requestsPhotos ||
      (requestsConfigurationView && requestedTab === "locations")) &&
    entryLoadState !== "ready";
  if (
    (isLoading && !listing) ||
    (waitingForLocationCatalog &&
      (entryLoadState === "pending" || isLoading || !error))
  ) {
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

  // Location entry requires a fresh catalog: keep its target intact on failure
  // and offer a retry instead of resolving it against an older location list.
  if (error && (!listing || waitingForLocationCatalog)) {
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

  // Published listings, "Start Listing", and explicit setup links open configuration.
  if (listing && (listing.isListed || configurationOpen)) {
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
