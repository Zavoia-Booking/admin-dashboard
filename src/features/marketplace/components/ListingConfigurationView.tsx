import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useCanWrite } from "../../../shared/components/common/subscription/useCanWrite";
import { LimitedAccessBanner } from "../../../shared/components/common/subscription/LimitedAccessBanner";
import {
  ResponsiveTabs,
  type ResponsiveTabItem,
} from "../../../shared/components/ui/responsive-tabs";
import { AlertTriangle } from "lucide-react";
import type {
  Business,
  LocationWithAssignments,
  SectionEntry,
  PageTheme,
  FaqItem,
  AnnouncementContent,
  PublishMarketplaceListingPayload,
} from "../types";
import { useMarketplaceForm } from "../hooks/useMarketplaceForm";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";
import { fetchReviewStatsAction, fetchHighlightReviewsAction } from "../../reviews/actions";
import { selectReviewStats, selectHighlightReviews } from "../../reviews/selectors";

import { BusinessPageTab } from "./business/BusinessPageTab";
import type { PreviewReview } from "./business/builder/LivePreview";
import { LocationsTab } from "./locations/LocationsTab";
import { MarketplacePublishStatusStrip } from "./MarketplacePublishStatusStrip";
import { ReviewsTab } from "../../reviews/components/ReviewsTab";

type MarketplaceTab = "business" | "locations" | "reviews";

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
  // Business-page (microsite) content
  heroImageUrl?: string | null;
  tagline?: string | null;
  aboutContent?: string | null;
  brandColorHex?: string | null;
  // Section builder (v1)
  pageLayout?: SectionEntry[] | null;
  pageTheme?: PageTheme | null;
  faq?: FaqItem[] | null;
  announcement?: AnnouncementContent | null;
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
  const [searchParams] = useSearchParams();

  // State for unsaved changes confirmation dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationPathRef = useRef<string | null>(null);
  const allowNavigationRef = useRef(false);

  const validTabs: MarketplaceTab[] = ["business", "locations", "reviews"];

  const getInitialTab = (): MarketplaceTab => {
    const tab = searchParams.get("tab") as MarketplaceTab | null;
    if (tab && validTabs.includes(tab)) {
      return tab;
    }
    return "business";
  };

  const [activeTab, setActiveTab] = useState<MarketplaceTab>(getInitialTab());
  const canWrite = useCanWrite();

  // Business-page preview data sourced from the reviews store: real 5★ quotes (their own slice, so the
  // Reviews tab's filtered fetch never clobbers them) + per-member ratings from the filter-independent
  // stats. Fetched once on mount; the preview degrades gracefully to aggregate-only if either is empty.
  const dispatch = useDispatch();
  const reviewStats = useSelector(selectReviewStats);
  const highlightReviews = useSelector(selectHighlightReviews);

  useEffect(() => {
    dispatch(fetchReviewStatsAction.request());
    dispatch(
      fetchHighlightReviewsAction.request({
        rating: 5,
        withCommentsOnly: true,
        sortBy: "rating",
        sortOrder: "DESC",
        limit: 12,
      }),
    );
  }, [dispatch]);

  const teamRatings = useMemo(() => {
    const map: Record<number, { rating: number; count: number }> = {};
    (reviewStats?.teamMembers ?? []).forEach((tm) => {
      if (tm.totalReviews > 0) map[tm.teamMemberId] = { rating: tm.averageRating, count: tm.totalReviews };
    });
    return map;
  }, [reviewStats]);

  // Business-wide per-star counts → the Reviews section's distribution bars (real data, not synthetic).
  const ratingDistribution = reviewStats?.business?.ratingDistribution;

  const previewReviews = useMemo<PreviewReview[]>(
    () =>
      highlightReviews
        .filter((r) => (r.comment ?? "").trim())
        .map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: (r.comment ?? "").trim(),
          customerName: [r.customer.firstName, r.customer.lastName].filter(Boolean).join(" ").trim(),
          locationName: r.location?.name ?? null,
          createdAt: r.createdAt,
        })),
    [highlightReviews],
  );

  // Sync with URL changes (map legacy tab names: profile/booking-settings → business, portfolio → locations)
  useEffect(() => {
    const rawTab = searchParams.get("tab");
    const tab = rawTab as MarketplaceTab | null;
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else if (rawTab === "profile" || rawTab === "booking-settings") {
      setActiveTab("business");
      navigate("/marketplace?tab=business", { replace: true });
    } else if (rawTab === "portfolio") {
      setActiveTab("locations");
      navigate("/marketplace?tab=locations", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  const form = useMarketplaceForm({
    business: props.business,
    marketplaceName: props.marketplaceName,
    marketplaceEmail: props.marketplaceEmail,
    marketplacePhone: props.marketplacePhone,
    marketplaceDescription: props.marketplaceDescription,
    tagline: props.tagline,
    aboutContent: props.aboutContent,
    brandColorHex: props.brandColorHex,
    pageLayout: props.pageLayout,
    pageTheme: props.pageTheme,
    faq: props.faq,
    announcement: props.announcement,
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
    setActiveTab(tab);
    navigate(`/marketplace?tab=${tab}`, { replace: true });
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

  const industryTagOk = form.selectedIndustryTags.length > 0;
  // "Details valid" is about the profile/branding fields only — the industry tag has its own
  // checklist row, so exclude it here (hasValidationErrors folds the tag check in, which would make
  // both rows fail for a single missing tag).
  const detailsOk = !(
    form.nameError ||
    form.emailError ||
    form.phoneError ||
    form.descriptionError ||
    form.taglineError ||
    form.brandColorError ||
    form.announcementError ||
    form.aboutError
  );

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
        detailsOk={detailsOk}
        locations={locationsWithAssignments}
        onPublish={handleCombinedSave}
      />
    </div>
  );

  const tabItems: ResponsiveTabItem[] = [
    {
      id: "business",
      label: t("configuration.tabs.business"),
      // Pulse the tab whenever anything on it blocks publish. hasValidationErrors is the single aggregate
      // (industry tag, contact, tagline/brand colour, announcement, About headline…), so a new section's
      // required field lights the tab automatically once it folds into that gate — no per-section wiring.
      showBadge: form.hasValidationErrors,
      content: (
        <>
          {statusStrip}
          <BusinessPageTab
            business={business}
            canWrite={canWrite}
            heroImageUrl={props.heroImageUrl ?? null}
            industries={props.industries}
            industryTags={props.industryTags}
            locations={locationsWithAssignments}
            form={form}
            reviews={previewReviews}
            teamRatings={teamRatings}
            ratingDistribution={ratingDistribution}
          />
        </>
      ),
    },
    {
      id: "locations",
      label: t("configuration.tabs.locations"),
      showBadge: locationsWithAssignments.some(
        (l) => l.isPublic && (l.portfolioImages?.length ?? 0) === 0,
      ),
      content: (
        <>
          {statusStrip}
          <LocationsTab locations={locationsWithAssignments} />
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
            <ReviewsTab locationId={reviewsLocationId} />
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
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-destructive"
        showCloseButton
        footerClassName=""
        cancelClassName="w-auto md:w-44"
        confirmClassName="w-auto md:w-32"
      />
    </>
  );
}
