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
import {
  requestLocationSettingsAttention,
  type LocationSettingsAttentionTarget,
} from "../utils/locationSettingsAttention";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { HeaderRightSlot } from "../../../shared/components/layouts/HeaderRightSlot";
import { MarketplaceHeaderAction } from "./MarketplaceHeaderAction";

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
  /** The listing refetch is in flight (the saga runs one after each publish). */
  isRefreshing?: boolean;
  isListed: boolean;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplacePhone?: string | null;
  marketplaceDescription?: string | null;
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessPhone?: boolean;
  useBusinessDescription?: boolean;
  /** Required to publish; uploads save immediately, outside the form. */
  hasBrandPhoto: boolean;
  industries: any[];
  industryTags: any[];
  selectedIndustryTags: any[];
  onSave: (data: PublishMarketplaceListingPayload) => void;
}

export function ListingConfigurationView(props: ListingConfigurationViewProps) {
  const { business, locationsWithAssignments, isPublishing, isListed, isRefreshing = false } = props;
  const brandPhotoOk = props.hasBrandPhoto;
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
  // Single-location businesses also use the list-to-detail flow below xl.
  const hasLocationSelected =
    activeTab === "locations" &&
    locationsWithAssignments.some(
      (locationItem) => locationItem.id === selectedLocationId,
    );
  const returnToLocations = useReturnToMarketplaceLocations();
  const swipeBackRef = useRef<LocationDetailSwipeBackHandle | null>(null);

  // State for unsaved changes confirmation dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [ownerProfileSetupNeeded, setOwnerProfileSetupNeeded] = useState(false);
  const [brandPhotoAttention, setBrandPhotoAttention] = useState(0);
  // The strip renders once per tab. Only override the default for the tab
  // where the user explicitly toggled the checklist.
  const [checklistDisclosure, setChecklistDisclosure] = useState<{
    tab: MarketplaceTab;
    open: boolean;
  } | null>(null);
  const handleChecklistOpenChange = useCallback(
    (open: boolean) => setChecklistDisclosure({ tab: activeTab, open }),
    [activeTab],
  );
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
  const mobileChecklistOpen =
    checklistDisclosure?.tab === activeTab
      ? checklistDisclosure.open
      : !industryTagOk || !businessDetailsOk || !brandPhotoOk || photosBlocked;
  // Gates the header action's visibility rather than its disabled state: a
  // permanently dead button says nothing the checklist in the strip does not
  // already say. isPublishing is excluded on purpose so the button stays put
  // and shows its spinner through an in-flight save.
  const actionReady = !form.hasValidationErrors && industryTagOk;

  /* Mobile header: the right end of the tab row holds the bell, or the one
   * primary action while there is something to do (listed: unsaved edits;
   * not listed: publishing). The header is md:hidden, so no isMobile gate:
   * its first render reads false, which would animate a swap on load. */
  const headerActionShown =
    canWrite && actionReady && (!isListed || isCombinedDirty);
  // Swaps animate; the first paint and the skeleton handover don't.
  const [seenHeaderActionShown, setSeenHeaderActionShown] =
    useState(headerActionShown);
  const [headerSwapAnimates, setHeaderSwapAnimates] = useState(false);
  if (seenHeaderActionShown !== headerActionShown) {
    setSeenHeaderActionShown(headerActionShown);
    setHeaderSwapAnimates(true);
  }
  // Publish success clears isPublishing before the refetch that makes the form
  // clean lands; keep the spinner up through it so Save doesn't flash back.
  const [seenPublishing, setSeenPublishing] = useState(isPublishing);
  const [awaitingRefresh, setAwaitingRefresh] = useState(false);
  if (seenPublishing !== isPublishing) {
    setSeenPublishing(isPublishing);
    setAwaitingRefresh(!isPublishing && isRefreshing);
  } else if (awaitingRefresh && !isRefreshing) {
    setAwaitingRefresh(false);
  }


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
  // Typing is done: close the keyboard so the whole form is back in view.
  const handleHeaderAction = () => {
    const focused = document.activeElement;
    if (
      focused instanceof HTMLInputElement ||
      focused instanceof HTMLTextAreaElement ||
      (focused instanceof HTMLElement && focused.isContentEditable)
    ) {
      focused.blur();
    }
    if (!brandPhotoOk) handleBrandPhotoNeeded();
    else if (photosBlocked) handlePhotosNeeded();
    else handleCombinedSave();
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
  // The brand photo is required too; a blocked publish lands on its card (the card scrolls itself).
  const handleBrandPhotoNeeded = () => {
    if (activeTab !== "business") handleTabChange("business");
    setBrandPhotoAttention((n) => n + 1);
  };

  const handleLocationSummaryAction = (
    locationId: number,
    target: LocationSettingsAttentionTarget | "photos",
    selectLocation?: (locationId: number) => void,
  ) => {
    if (selectLocation) {
      selectLocation(locationId);
    } else {
      navigate(`/marketplace?tab=locations&locationId=${locationId}`, {
        replace: true,
        state: location.state,
      });
    }
    requestAnimationFrame(() => {
      if (target === "photos") requestPortfolioAttention(locationId);
      else requestLocationSettingsAttention(locationId, target);
    });
  };

  // One strip per tab panel. The Locations tab supplies its actual workspace
  // selection, including the existing single-location and stored-selection flows.
  const renderStatusStrip = (
    selectedLocation?: LocationWithAssignments | null,
    selectLocation?: (locationId: number) => void,
  ) => (
    <div className="max-w-5xl mb-6">
      <MarketplacePublishStatusStrip
        isListed={isListed}
        isPublishing={isPublishing}
        canWrite={canWrite}
        isDirty={isCombinedDirty}
        hasValidationErrors={form.hasValidationErrors}
        industryTagOk={industryTagOk}
        businessDetailsOk={businessDetailsOk}
        brandPhotoOk={brandPhotoOk}
        onBrandPhotoNeeded={handleBrandPhotoNeeded}
        locationImagesOk={locationImagesOk}
        hasLocationPhoto={hasLocationPhoto}
        onPhotosNeeded={handlePhotosNeeded}
        onResolveChecklistItem={(item) => {
          focusBusinessSection(
            item === "industryTag"
              ? "marketplace-industry-section"
              : "marketplace-business-details-section",
          );
        }}
        locations={locationsWithAssignments}
        location={selectedLocation}
        onManageVisibility={(locationId) =>
          handleLocationSummaryAction(
            locationId,
            "visibility",
            selectedLocation === null ? selectLocation : undefined,
          )
        }
        onManageBooking={(locationId) =>
          handleLocationSummaryAction(
            locationId,
            "booking",
            selectedLocation === null ? selectLocation : undefined,
          )
        }
        onManagePhotos={(locationId) =>
          handleLocationSummaryAction(
            locationId,
            "photos",
            selectedLocation === null ? selectLocation : undefined,
          )
        }
        ownerProfileSetupNeeded={ownerProfileSetupNeeded}
        onManageOwnerProfile={() =>
          focusBusinessSection("marketplace-owner-profile-section")
        }
        onPublish={handleCombinedSave}
        mobileChecklistOpen={mobileChecklistOpen}
        onMobileChecklistOpenChange={handleChecklistOpenChange}
      />
    </div>
  );

  const tabItems: ResponsiveTabItem[] = [
    {
      id: "business",
      label: t("configuration.tabs.business"),
      showBadge: !businessDetailsOk || !industryTagOk || !brandPhotoOk,
      content: (
        <>
          {/* The limited-access banner leads every tab, right under the tab bar. */}
          <LimitedAccessBanner className="!px-0 !pt-0" />
          {renderStatusStrip()}
          <BusinessListingTab
            business={business}
            canWrite={canWrite}
            industries={props.industries}
            industryTags={props.industryTags}
            form={form}
            onOwnerProfileSetupNeededChange={setOwnerProfileSetupNeeded}
            brandPhotoAttention={brandPhotoAttention}
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
          <LimitedAccessBanner className="!px-0 !pt-0" />
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
          <LocationsTab
            locations={locationsWithAssignments}
            isActive={activeTab === "locations"}
            renderStatusStrip={renderStatusStrip}
          />
        </LocationDetailSwipeBack>
      ),
    },
    {
      id: "reviews",
      label: tReviews("tabLabel"),
      content: reviewsActivated ? (
        <>
          <LimitedAccessBanner className="!px-0 !pt-0" />
          {renderStatusStrip()}
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

      {/* End clearance the floating save pill used to provide; the Reviews
          tab's floating "Clear filters" pill still needs it. */}
      <div className="h-16 md:hidden" aria-hidden />

      {/* Mobile header, right of the tabs (that header is md:hidden). Not gated
          on isMobile, which is false on the first render: the skeleton's bell
          then hands over without a remount. */}
      <HeaderRightSlot>
        <MarketplaceHeaderAction
          shown={headerActionShown}
          label={t(
            isListed
              ? "configuration.buttons.save"
              : "configuration.buttons.publishShort",
          )}
          busy={isPublishing || awaitingRefresh}
          onAction={handleHeaderAction}
          animate={headerSwapAnimates}
        />
      </HeaderRightSlot>

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
