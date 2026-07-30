import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useCanWrite } from "../../../shared/components/common/subscription/useCanWrite";
import { LimitedAccessBanner } from "../../../shared/components/common/subscription/LimitedAccessBanner";
import {
  ResponsiveTabs,
  type ResponsiveTabItem,
} from "../../../shared/components/ui/responsive-tabs";
import type {
  Business,
  LocationWithAssignments,
  PublishMarketplaceListingPayload,
} from "../types";
import { useMarketplaceForm } from "../hooks/useMarketplaceForm";
import { requestPortfolioAttention } from "../utils/portfolioAttention";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";

import { BusinessListingTab } from "./business/BusinessListingTab";
import { LocationsTab } from "./locations/LocationsTab";
import { MarketplacePublishStatusStrip } from "./MarketplacePublishStatusStrip";
import { ReviewsTab } from "../../reviews/components/ReviewsTab";

type MarketplaceTab = "business" | "locations" | "reviews";

interface MarketplaceNavigationState {
  marketplaceLocationsOrigin?: boolean;
  marketplaceReviewReturnLocationId?: number;
}

const validTabs: MarketplaceTab[] = [
  "business",
  "locations",
  "reviews",
];

function resolveMarketplaceTab(rawTab: string | null): MarketplaceTab {
  const tab = rawTab as MarketplaceTab | null;
  if (tab && validTabs.includes(tab)) return tab;
  return rawTab === "portfolio" ? "locations" : "business";
}

interface ListingConfigurationViewProps {
  business: Business | null;
  locationsWithAssignments: LocationWithAssignments[];
  isPublishing: boolean;
  isListed: boolean;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplacePhone?: string | null;
  marketplaceDescription?: string | null;
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessPhone?: boolean;
  useBusinessDescription?: boolean;
  industries: any[];
  industryTags: any[];
  selectedIndustryTags: any[];
  onSave: (data: PublishMarketplaceListingPayload) => void;
}

export function ListingConfigurationView(props: ListingConfigurationViewProps) {
  const { business, locationsWithAssignments, isPublishing, isListed } = props;
  const { t } = useTranslation("marketplace");
  const { t: tReviews } = useTranslation("reviews");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab = resolveMarketplaceTab(rawTab);
  const selectedLocationId = Number.parseInt(
    searchParams.get("locationId") ?? "",
    10,
  );
  const isLocationDetail =
    activeTab === "locations" &&
    locationsWithAssignments.length > 1 &&
    !Number.isNaN(selectedLocationId) &&
    locationsWithAssignments.some(
      (locationItem) => locationItem.id === selectedLocationId,
    );

  // State for unsaved changes confirmation dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationPathRef = useRef<string | null>(null);
  const allowNavigationRef = useRef(false);

  const canWrite = useCanWrite();

  // Canonicalize legacy tab names. The active tab itself is derived from the URL above,
  // so browser navigation and redirects never require a second state synchronization pass.
  // The retired Website Builder tab is redirected by the route before this view mounts.
  useEffect(() => {
    if (rawTab === "profile" || rawTab === "booking-settings") {
      navigate("/marketplace?tab=business", { replace: true });
    } else if (rawTab === "portfolio") {
      navigate("/marketplace?tab=locations", { replace: true });
    }
  }, [rawTab, navigate]);

  const form = useMarketplaceForm({
    business: props.business,
    marketplaceName: props.marketplaceName,
    marketplaceEmail: props.marketplaceEmail,
    marketplacePhone: props.marketplacePhone,
    marketplaceDescription: props.marketplaceDescription,
    useBusinessName: props.useBusinessName ?? true,
    useBusinessEmail: props.useBusinessEmail ?? true,
    useBusinessPhone: props.useBusinessPhone ?? true,
    useBusinessDescription: props.useBusinessDescription ?? true,
    selectedIndustryTags: props.selectedIndustryTags,
    onSave: props.onSave,
  });

  const isCombinedDirty = form.isDirty;

  // Warn before closing browser tab/window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCombinedDirty) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show their own
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isCombinedDirty]);

  // Custom navigation guard - intercept clicks on navigation links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isCombinedDirty || allowNavigationRef.current) {
        return;
      }

      const target = e.target as HTMLElement;
      let targetPath: string | null = null;

      // Check for anchor tags with href
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (link && link.href) {
        try {
          const url = new URL(link.href);
          targetPath = url.pathname + url.search;
        } catch {
          // Invalid URL, ignore
        }
      } else {
        // Check for elements that might trigger navigation via onClick
        // Look for clickable elements (spans, divs with cursor-pointer) that might call navigate()
        const clickableElement = target.closest(
          "span.cursor-pointer, div.cursor-pointer, [role='button']",
        ) as HTMLElement | null;

        // Check for elements with data-navigate or data-navigate-to attribute
        const dataNavigateElement = target.closest(
          "[data-navigate], [data-navigate-to]",
        ) as HTMLElement | null;

        if (dataNavigateElement) {
          targetPath =
            dataNavigateElement.getAttribute("data-navigate") ||
            dataNavigateElement.getAttribute("data-navigate-to");
        } else if (clickableElement) {
          // For elements that might navigate via onClick, we need to intercept
          // Check if this looks like a navigation link (has ArrowUpRight icon, specific classes, etc.)
          const hasNavigationPattern =
            clickableElement.querySelector("svg") || // Has an icon (like ArrowUpRight)
            clickableElement.classList.contains("font-semibold") || // Styled like a link
            clickableElement.textContent
              ?.trim()
              .toLowerCase()
              .includes("assignments") ||
            clickableElement.textContent
              ?.trim()
              .toLowerCase()
              .includes("settings");

          if (hasNavigationPattern) {
            // Try to infer the navigation path from the element's content or context
            const text =
              clickableElement.textContent?.trim().toLowerCase() || "";
            let inferredPath: string | null = null;

            if (
              text.includes("assignments") ||
              clickableElement.closest('[data-navigate-to="/assignments"]')
            ) {
              inferredPath = "/assignments";
            } else if (
              text.includes("settings") ||
              clickableElement.closest('[data-navigate-to="/account"]')
            ) {
              inferredPath = "/account";
            } else if (text.includes("location")) {
              // For location links, try to get locationId from parent context
              const locationCard =
                clickableElement.closest("[data-location-id]");
              if (locationCard) {
                const locationId =
                  locationCard.getAttribute("data-location-id");
                inferredPath = `/locations?locationId=${locationId}`;
              } else {
                inferredPath = "/locations";
              }
            }

            if (inferredPath) {
              const currentPath = location.pathname + location.search;
              if (
                inferredPath !== currentPath &&
                !inferredPath.startsWith("/marketplace")
              ) {
                e.preventDefault();
                e.stopPropagation();
                pendingNavigationPathRef.current = inferredPath;
                setShowUnsavedDialog(true);
                return;
              }
            }
          }
        }
      }

      if (targetPath) {
        const currentPath = location.pathname + location.search;

        // Only block if navigating away from marketplace
        if (
          targetPath !== currentPath &&
          !targetPath.startsWith("/marketplace")
        ) {
          e.preventDefault();
          e.stopPropagation();
          pendingNavigationPathRef.current = targetPath;
          setShowUnsavedDialog(true);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isCombinedDirty, location]);

  // Dialog handlers
  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false);
    allowNavigationRef.current = true;

    if (pendingNavigationPathRef.current) {
      navigate(pendingNavigationPathRef.current);
      pendingNavigationPathRef.current = null;
    }

    // Reset flag after navigation
    setTimeout(() => {
      allowNavigationRef.current = false;
    }, 100);
  };

  const handleCancelLeave = () => {
    setShowUnsavedDialog(false);
    pendingNavigationPathRef.current = null;
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabId as MarketplaceTab;
    if (tab === activeTab) return;

    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    const currentState =
      location.state && typeof location.state === "object"
        ? (location.state as MarketplaceNavigationState)
        : {};

    const reviewReturnId = currentState.marketplaceReviewReturnLocationId;
    if (
      tab === "locations" &&
      reviewReturnId != null &&
      locationsWithAssignments.some(
        (locationItem) => locationItem.id === reviewReturnId,
      )
    ) {
      next.set("locationId", String(reviewReturnId));
      const nextState = { ...currentState };
      delete nextState.marketplaceReviewReturnLocationId;
      navigate(`/marketplace?${next.toString()}`, {
        replace: true,
        state: nextState,
      });
      return;
    }

    if (tab === "locations" && currentState.marketplaceLocationsOrigin) {
      navigate(-1);
      return;
    }

    // A normal tab click is unscoped. Location-scoped Reviews is entered only
    // through the explicit View reviews action in the location workspace.
    next.delete("locationId");
    const nextState = { ...currentState };
    delete nextState.marketplaceReviewReturnLocationId;
    navigate(`/marketplace?${next.toString()}`, {
      replace: true,
      state: nextState,
    });
  };

  const handleCombinedSave = () => {
    form.handleSave();
  };

  // Location pre-filter for the Reviews tab (set when drilling in from a location panel)
  const reviewsLocationId = (() => {
    if (activeTab !== "reviews") return null;
    const raw = searchParams.get("locationId");
    if (!raw) return null;
    const id = parseInt(raw, 10);
    return Number.isNaN(id) ? null : id;
  })();

  // Mirror the user's location-filter changes back into the URL so a cleared
  // filter doesn't resurrect on refresh, and a picked one survives it.
  const handleReviewsLocationScopeChange = useCallback(
    (nextLocationId: number | null) => {
      const next = new URLSearchParams(searchParams);
      if (nextLocationId == null) next.delete("locationId");
      else next.set("locationId", String(nextLocationId));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const industryTagOk = form.selectedIndustryTags.length > 0;
  const businessDetailsOk = !(
    form.nameError ||
    form.emailError ||
    form.phoneError ||
    form.descriptionError
  );
  // Photo gates, mirroring the backend publish checks: publishing needs at least
  // one photo somewhere (MARKETPLACE_LISTING.E22), and no publicly visible
  // location may have zero photos (E20).
  const locationImagesOk = !locationsWithAssignments.some(
    (l) => l.isPublic && (l.portfolioImages?.length ?? 0) === 0,
  );
  const hasLocationPhoto =
    locationsWithAssignments.length === 0 ||
    locationsWithAssignments.some((l) => (l.portfolioImages?.length ?? 0) > 0);
  // Tab attention badge: any location without photos — visible or not — shows
  // the add-photos nag inside the tab, so the badge tracks the same condition
  // (a superset of both publish gates above).
  const someLocationMissingPhotos = locationsWithAssignments.some(
    (l) => (l.portfolioImages?.length ?? 0) === 0,
  );

  // Publish clicked while photos are missing: deep-link into the offending
  // location's panel and pulse its upload card (works from any tab, any viewport).
  const handlePhotosNeeded = () => {
    const target =
      locationsWithAssignments.find(
        (l) => l.isPublic && (l.portfolioImages?.length ?? 0) === 0,
      ) ??
      locationsWithAssignments.find((l) => (l.portfolioImages?.length ?? 0) === 0) ??
      locationsWithAssignments[0];
    if (!target) return;
    navigate(`/marketplace?tab=locations&locationId=${target.id}`);
    requestPortfolioAttention(target.id);
  };
  // Persistent business-level go-live status strip. Rendered at the top of every
  // tab panel (ResponsiveTabs keeps panels mounted but only shows the active one,
  // so exactly one strip is visible — and it stays put as tabs switch).
  const statusStrip = (
    <div className="max-w-5xl mb-6">
      <MarketplacePublishStatusStrip
        isListed={isListed}
        isPublishing={isPublishing}
        canWrite={canWrite}
        isDirty={isCombinedDirty}
        hasValidationErrors={form.hasValidationErrors}
        industryTagOk={industryTagOk}
        businessDetailsOk={businessDetailsOk}
        locationImagesOk={locationImagesOk}
        hasLocationPhoto={hasLocationPhoto}
        onPhotosNeeded={handlePhotosNeeded}
        locations={locationsWithAssignments}
        onPublish={handleCombinedSave}
        compactOnMobile={isLocationDetail}
      />
    </div>
  );

  const tabItems: ResponsiveTabItem[] = [
    {
      id: "business",
      label: t("configuration.tabs.business"),
      showBadge: !businessDetailsOk || !industryTagOk,
      content: (
        <>
          {statusStrip}
          <BusinessListingTab
            business={business}
            canWrite={canWrite}
            industries={props.industries}
            industryTags={props.industryTags}
            form={form}
          />
        </>
      ),
    },
    {
      id: "locations",
      label: t("configuration.tabs.locations"),
      showBadge: someLocationMissingPhotos,
      content: (
        <>
          {statusStrip}
          <LocationsTab
            locations={locationsWithAssignments}
            isActive={activeTab === "locations"}
          />
        </>
      ),
    },
    {
      id: "reviews",
      label: tReviews("tabLabel"),
      content:
        activeTab === "reviews" ? (
          <>
            {statusStrip}
            <LimitedAccessBanner className="!px-0 !pt-0" />
            <ReviewsTab
              locationId={reviewsLocationId}
              onLocationScopeChange={handleReviewsLocationScopeChange}
            />
          </>
        ) : null,
    },
  ];

  return (
    <>
      <div className="cursor-default">
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          stickyHeader={true}
        />
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        open={showUnsavedDialog}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        onOpenChange={setShowUnsavedDialog}
        title={t("configuration.unsavedChanges.title")}
        description={t("configuration.unsavedChanges.description")}
        confirmTitle={t("configuration.unsavedChanges.leave")}
        cancelTitle={t("configuration.unsavedChanges.cancel")}
        variant="destructive"
        showCloseButton
      />
    </>
  );
}
