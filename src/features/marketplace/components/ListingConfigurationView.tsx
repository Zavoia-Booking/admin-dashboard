import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../../shared/components/ui/button";
import { useCanWrite } from "../../../shared/components/common/subscription/useCanWrite";
import { LimitedAccessBanner } from "../../../shared/components/common/subscription/LimitedAccessBanner";
import {
  ResponsiveTabs,
  type ResponsiveTabItem,
} from "../../../shared/components/ui/responsive-tabs";
import { Save, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/ui/card";
import type {
  Business,
  LocationWithAssignments,
} from "../types";
import { MarketplaceImagesSection } from "./MarketplaceImagesSection";
import { PortfolioLocationSelector } from "./PortfolioLocationSelector";
import { SectionDivider } from "../../../shared/components/common/SectionDivider";
import { useMarketplaceForm } from "../hooks/useMarketplaceForm";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";

// Profile Tab Components
import { MarketplaceDetailsSection } from "./profile/MarketplaceDetailsSection";
import { LocationVisibilitySection } from "./profile/LocationVisibilitySection";
import IndustrySection from "./profile/IndustrySection.tsx";
import { ReviewsTab } from "../../reviews/components/ReviewsTab";

type MarketplaceTab = "profile" | "portfolio" | "reviews";

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
  onSave: (data: any) => void;
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

  // Get initial tab from URL or default to 'profile'
  const validTabs: MarketplaceTab[] = ["profile", "portfolio", "reviews"];

  const getInitialTab = (): MarketplaceTab => {
    const tab = searchParams.get("tab") as MarketplaceTab | null;
    if (tab && validTabs.includes(tab)) {
      return tab;
    }
    return "profile";
  };

  const [activeTab, setActiveTab] = useState<MarketplaceTab>(getInitialTab());
  const canWrite = useCanWrite();

  // Per-location portfolio selection (persisted by PortfolioLocationSelector)
  const [selectedPortfolioLocationId, setSelectedPortfolioLocationId] = useState<number | null>(null);

  // Should we show the global save/publish button?
  // We hide it on the portfolio tab if the listing is already published (isListed = true)
  // because portfolio changes are instant. We keep it if it's the initial "Publish" flow.
  // Also hide it entirely when the business is not entitled — marketplace profile
  // changes are blocked server-side in that case.
  const showSaveButton =
    canWrite && ((activeTab !== "portfolio" && activeTab !== "reviews") || !isListed);

  // Sync with URL changes
  useEffect(() => {
    const rawTab = searchParams.get("tab");
    const tab = rawTab as MarketplaceTab | null;
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else if (rawTab === "booking-settings") {
      setActiveTab("profile");
      navigate("/marketplace?tab=profile", { replace: true });
    }
  }, [searchParams, navigate]);

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
    selectedLocationId: selectedPortfolioLocationId,
    locationsWithAssignments,
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

  const tabItems: ResponsiveTabItem[] = [
    {
      id: "profile",
      label: t("configuration.tabs.profile"),
      showBadge: form.selectedIndustryTags.length === 0,
      content: (
        <div className="max-w-5xl mb-0 md:mb-8">
          <LimitedAccessBanner className="!px-0 !pt-0" />
          <div
            className={!canWrite ? "pointer-events-none opacity-60" : ""}
            aria-disabled={!canWrite}
          >
          <Card className="border-none pt-0 pb-2 sm:border shadow-none sm:shadow-sm bg-transparent sm:bg-white dark:sm:bg-surface overflow-hidden">
            <CardContent className="p-0 sm:p-4 space-y-10">
              {/* Visibility & Appointments Section (per location) */}
              <div className="px-0 space-y-6">
                <SectionDivider
                  title={t("configuration.sections.visibilityAndAppointments")}
                  className="mt-4 uppercase tracking-wider text-foreground-2"
                />
                <LocationVisibilitySection locations={locationsWithAssignments} />
              </div>

              {/* Marketplace Details Section */}
              <MarketplaceDetailsSection
                business={business}
                useBusinessName={form.useBusinessName}
                setUseBusinessName={form.setUseBusinessName}
                name={form.name}
                setName={form.setName}
                useBusinessEmail={form.useBusinessEmail}
                setUseBusinessEmail={form.setUseBusinessEmail}
                email={form.email}
                setEmail={form.setEmail}
                useBusinessPhone={form.useBusinessPhone}
                setUseBusinessPhone={form.setUseBusinessPhone}
                phone={form.phone}
                setPhone={form.setPhone}
                useBusinessDescription={form.useBusinessDescription}
                setUseBusinessDescription={form.setUseBusinessDescription}
                description={form.description}
                setDescription={form.setDescription}
                nameError={form.nameError || undefined}
                emailError={form.emailError || undefined}
                phoneError={form.phoneError || undefined}
                descriptionError={form.descriptionError || undefined}
              />

              {/* Industry & Tags Section */}
              <IndustrySection
                industries={props.industries}
                industryTags={props.industryTags}
                selectedTags={form.selectedIndustryTags}
                onTagsChange={form.setSelectedIndustryTags}
                error={form.industryTagsError || undefined}
              />
            </CardContent>
          </Card>
          </div>
        </div>
      ),
    },
    {
      id: "portfolio",
      label: t("configuration.tabs.portfolio"),
      showBadge: !form.hasAnyPortfolioImage,
      content: (
        <div className="space-y-6">
          <LimitedAccessBanner className="!px-0 !pt-0" />
          <div className="max-w-5xl">
            <PortfolioLocationSelector
              locations={locationsWithAssignments}
              selectedLocationId={selectedPortfolioLocationId}
              onSelect={setSelectedPortfolioLocationId}
            />
          </div>
          <MarketplaceImagesSection
            locationId={selectedPortfolioLocationId}
            featuredImageId={form.featuredImageId}
            portfolioImages={form.portfolio}
            onFeaturedImageChange={form.setFeaturedImageId}
            onPortfolioImagesChange={form.setPortfolio}
          />
        </div>
      ),
    },
    {
      id: "reviews",
      label: tReviews("tabLabel"),
      content: activeTab === "reviews" ? (
        <>
          <LimitedAccessBanner className="!px-0 !pt-0" />
          <ReviewsTab />
        </>
      ) : null,
    },
  ];

  // Dynamic button text based on listing state
  const buttonText = isListed
    ? t("configuration.buttons.saveChanges")
    : t("configuration.buttons.publish");
  const buttonLoadingText = isPublishing
    ? isListed
      ? t("configuration.buttons.saving")
      : t("configuration.buttons.publishing")
    : buttonText;

  const SaveButton = (
    <Button
      onClick={handleCombinedSave}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-52 md:sm:w-auto"
      disabled={
        isPublishing ||
        !isCombinedDirty ||
        form.hasValidationErrors ||
        !form.hasAnyPortfolioImage ||
        form.selectedIndustryTags.length === 0
      }
    >
      {isPublishing ? (
        <>
          <div className="rounded-full border-2 border-white/30 border-t-white animate-spin h-3 md:h-4 w-3 md:w-4"></div>
          <span>{buttonLoadingText}</span>
        </>
      ) : (
        <>
          <span>{buttonText}</span>
          {!isListed && (
            <ArrowRight className="inline h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
          )}
          {isListed && <Save className="hidden md:inline h-4 w-4" />}
        </>
      )}
    </Button>
  );

  return (
    <>
      <div className="cursor-default">
        {/* Responsive Tabs */}
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          rightContent={showSaveButton ? SaveButton : undefined}
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
