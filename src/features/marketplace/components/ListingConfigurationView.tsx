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
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import { StickyPrimaryAction } from "../../../shared/components/common/StickyPrimaryAction";

import { BusinessListingTab } from "./business/BusinessListingTab";
import { LocationsTab } from "./locations/LocationsTab";
import { useReturnToMarketplaceLocations } from "./locations/useReturnToMarketplaceLocations";
import {
  LocationDetailSwipeBack,
  type LocationDetailSwipeBackHandle,
} from "./locations/LocationDetailSwipeBack";
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
  // Unlike isLocationDetail, no minimum-count requirement: single-location
  // businesses also use the list-to-detail flow below xl.
  const hasLocationSelected =
    activeTab === "locations" &&
    locationsWithAssignments.some(
      (locationItem) => locationItem.id === selectedLocationId,
    );
  const returnToLocations = useReturnToMarketplaceLocations();
  const swipeBackRef = useRef<LocationDetailSwipeBackHandle | null>(null);

  // State for unsaved changes confirmation dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  // Mobile publish-checklist disclosure — lives here (not in the strip) because
  // the strip renders once per tab panel. Open by default: until the listing is
  // live, what is still missing is the point of the page.
  //
  // Stored as "which tab was it collapsed on" rather than a boolean, so a tab
  // switch re-opens it by derivation. The boolean version needed a render-phase
  // setState to reset, which discards the render and rebuilds all three tab
  // panels a second time on every single switch.
  const [collapsedTab, setCollapsedTab] = useState<MarketplaceTab | null>(null);
  const mobileChecklistOpen = collapsedTab !== activeTab;
  const handleChecklistOpenChange = useCallback(
    (open: boolean) => setCollapsedTab(open ? null : activeTab),
    [activeTab],
  );
  // Whether the active panel's mobile publish button is on screen. Starts true
  // so the floating stand-in cannot flash in before the observer reports.
  const [publishActionInView, setPublishActionInView] = useState(true);
  // Reviews mounts lazily (deferring its fetches) but then STAYS mounted, so
  // returning to the tab shows the loaded list instantly instead of a
  // remount → refetch → skeleton flash.
  const [reviewsActivated, setReviewsActivated] = useState(
    activeTab === "reviews",
  );
  if (activeTab === "reviews" && !reviewsActivated) {
    setReviewsActivated(true);
  }
  const pendingNavigationPathRef = useRef<string | null>(null);
  const allowNavigationRef = useRef(false);

  const canWrite = useCanWrite();
  const isMobile = useIsMobile();

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

  // Mirrors the strip's own gate: a missing photo routes the action to the
  // uploader instead of saving, so both entry points behave identically.
  const photosBlocked = !hasLocationPhoto || !locationImagesOk;
  // Gates the floating action's visibility rather than its disabled state: a
  // permanently dead pill hovering over the page says nothing the checklist in
  // the strip does not already say. isPublishing is excluded on purpose so the
  // pill stays put and shows its spinner through an in-flight save.
  const actionReady = !form.hasValidationErrors && industryTagOk;

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
  // Resolve action for form checklist items: switch to the Profile tab if
  // needed and scroll to the owning section — same "land on the fix"
  // contract the photo flow already provides.
  const focusBusinessSection = (sectionId: string) => {
    if (activeTab !== "business") handleTabChange("business");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const tryScroll = (attempt: number) => {
      const el = document.getElementById(sectionId);
      // The tab panel stays hidden for a frame or two after the switch.
      if (!el || el.offsetParent === null) {
        if (attempt < 20) requestAnimationFrame(() => tryScroll(attempt + 1));
        return;
      }
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    };
    requestAnimationFrame(() => tryScroll(0));
  };

  // One strip per tab panel. All three get the visibility callback: a strip in a
  // display:none panel never reports, because useInView marks its reading stale
  // (see `settled`). Gating on `tabId === activeTab` instead would change the
  // prop on every switch and re-render all three strips for nothing.
  const renderStatusStrip = () => (
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
        onResolveChecklistItem={(item) => {
          if (item === "locationPhoto") {
            handlePhotosNeeded();
            return;
          }
          focusBusinessSection(
            item === "industryTag"
              ? "marketplace-industry-section"
              : "marketplace-business-details-section",
          );
        }}
        locations={locationsWithAssignments}
        onPublish={handleCombinedSave}
        compactOnMobile={isLocationDetail}
        mobileChecklistOpen={mobileChecklistOpen}
        onMobileChecklistOpenChange={handleChecklistOpenChange}
        onMobileActionInViewChange={setPublishActionInView}
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
          {renderStatusStrip()}
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
        <LocationDetailSwipeBack
          enabled={hasLocationSelected}
          onBack={returnToLocations}
          handleRef={swipeBackRef}
        >
          {hasLocationSelected && (
            <div className="pb-3 xl:hidden">
              <Button
                type="button"
                variant="outline"
                rounded="full"
                size="sm"
                onClick={() => {
                  if (swipeBackRef.current) swipeBackRef.current.animateBack();
                  else returnToLocations();
                }}
                className="group h-10 gap-2 border-border bg-surface px-4 text-sm font-medium text-foreground-1 shadow-xs hover:text-primary"
              >
                <ArrowLeft
                  className="size-4 text-foreground-3 transition-transform duration-150 ease-out group-hover:-translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
                  aria-hidden="true"
                />
                {t("locations.backToAll")}
              </Button>
            </div>
          )}
          {renderStatusStrip()}
          <LocationsTab
            locations={locationsWithAssignments}
            isActive={activeTab === "locations"}
          />
        </LocationDetailSwipeBack>
      ),
    },
    {
      id: "reviews",
      label: tReviews("tabLabel"),
      content: reviewsActivated ? (
        <>
          {renderStatusStrip()}
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
          mobileTabsInHeader
        />
      </div>

      {/* The one mobile floating action, rendered here rather than inside the
          strip: the strip renders per tab panel, and this portals to body, which
          display:none on an inactive panel would not hide. Listed → Save, shown
          whenever there are unsaved edits (the strip drops its own inline save
          below md). Not listed → Publish, shown once the strip's own publish
          button has scrolled away, so the two are never on screen together.
          Suppressed in a location detail, whose compact strip keeps its action. */}
      <StickyPrimaryAction
        visible={
          isMobile &&
          canWrite &&
          !isLocationDetail &&
          actionReady &&
          (isListed ? isCombinedDirty : !publishActionInView)
        }
      >
        <Button
          onClick={() =>
            photosBlocked ? handlePhotosNeeded() : handleCombinedSave()
          }
          disabled={isPublishing}
          rounded="full"
          className="btn-primary group !min-w-60 max-w-full px-6 text-sm font-semibold shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>
            {t(
              isListed
                ? "configuration.buttons.save"
                : "configuration.buttons.publish",
            )}
          </span>
          {isPublishing ? (
            <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : isListed ? (
            <Save className="size-4" strokeWidth={1.9} />
          ) : (
            <ArrowRight className="size-4" strokeWidth={1.9} />
          )}
        </Button>
      </StickyPrimaryAction>

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
