import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { X, ArrowRight, CheckSquare, Square } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../../../../shared/components/ui/drawer";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { Button } from "../../../../shared/components/ui/button";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import { useKeyboardVisible } from "../../../../shared/hooks/useKeyboardVisible";
import { getCurrencyDisplay } from "../../../../shared/utils/currency";
import { selectCurrentUser } from "../../../auth/selectors";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider";
import { StaffServiceItem } from "./StaffServiceItem";
import { PersonAvatar } from "../../../../shared/components/common/PersonAvatar";
import { cn } from "../../../../shared/lib/utils";
import type { StaffService, LocationService } from "../../types";

type FilterType = "all" | "enabled" | "custom";

interface ManageTeamMemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  teamMember: {
    userId: number;
    firstName: string;
    lastName: string;
    email?: string;
    profileImage?: string | null;
  } | null;
  locationName: string;
  services: StaffService[];
  onSave: (services: StaffService[]) => void;
  currency?: string;
  isSaving?: boolean;
  isLoading?: boolean;
  /** Local location services state (includes unsaved changes) */
  localLocationServices?: LocationService[];
}

export function ManageTeamMemberDrawer({
  isOpen,
  onClose,
  teamMember,
  services: initialServices,
  onSave,
  currency = "USD",
  isSaving = false,
  isLoading = false,
  localLocationServices = [],
}: ManageTeamMemberDrawerProps) {
  const { t } = useTranslation("assignments");
  const isMobile = useIsMobile();
  // Native keyboard covers the mobile footer (like the bottom nav) instead of pushing it up.
  const keyboardVisible = useKeyboardVisible();
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency =
    currency || currentUser?.business?.businessCurrency || "eur";
  const currencyDisplay = { ...getCurrencyDisplay(businessCurrency), currency: businessCurrency };

  // Local state for services
  const [localServices, setLocalServices] = useState<StaffService[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [servicesWithErrors, setServicesWithErrors] = useState<Set<number>>(
    new Set()
  );
  const prevIsOpenRef = useRef(false);

  // Initialize local state when drawer opens/closes
  useEffect(() => {
    // Only reset when modal transitions from closed to open
    if (isOpen && !prevIsOpenRef.current) {
      // Always reset filter to "all" when modal first opens
      setFilter("all");
      setServicesWithErrors(new Set());
      // Clear local services to prevent showing stale data during loading
      setLocalServices([]);
    }
    // Clear local services when drawer closes to ensure clean state
    if (!isOpen && prevIsOpenRef.current) {
      setLocalServices([]);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Sync services when they change (but don't reset filter)
  // Only update when we have valid data and we're not loading
  // localLocationServices is the authoritative source for which services exist
  useEffect(() => {
    if (isOpen && !isLoading) {
      // Build services list ONLY from localLocationServices (single source of truth)
      const mergedServices: StaffService[] = localLocationServices.map((ls) => {
        // Try to find staff settings from backend
        const backendService = initialServices.find(
          (s) => s.serviceId === ls.serviceId
        );

        if (backendService) {
          // Service exists in backend - use staff settings
          return { ...backendService };
        } else {
          // New service (not in backend yet) - default to disabled
          return {
            serviceId: ls.serviceId,
            serviceName: ls.serviceName,
            canPerform: false,
            category: ls.category,
            inheritedPrice: ls.customPrice ?? ls.defaultPrice,
            inheritedDisplayPrice: (ls.customPrice ?? ls.defaultPrice) / 100,
            inheritedDuration: ls.customDuration ?? ls.defaultDuration,
            customPrice: null,
            customDuration: null,
            isCustom: false,
          };
        }
      });

      setLocalServices(mergedServices);
    }
  }, [isOpen, initialServices, isLoading, localLocationServices]);

  const hasCustomValues = (s: StaffService) =>
    s.customPrice !== null || s.customDuration !== null;

  // Filter services
  const filteredServices = useMemo(() => {
    switch (filter) {
      case "enabled":
        return localServices.filter((s) => s.canPerform);
      case "custom":
        return localServices.filter(hasCustomValues);
      default:
        return localServices;
    }
  }, [localServices, filter]);

  // `isLoading` only covers the request. The sync effect above fills
  // localServices one commit later, so without this second term the empty state
  // ("no services") flashes for a frame between the two. Every skeleton stage
  // gates on this, not on isLoading.
  const isHydrating =
    isLoading ||
    (localServices.length === 0 && localLocationServices.length > 0);

  // Check for changes
  const hasChanges = useMemo(() => {
    if (localServices.length !== initialServices.length) return true;
    return localServices.some((local) => {
      const initial = initialServices.find(
        (s) => s.serviceId === local.serviceId
      );
      if (!initial) return true;
      return (
        local.canPerform !== initial.canPerform ||
        local.customPrice !== initial.customPrice ||
        local.customDuration !== initial.customDuration
      );
    });
  }, [localServices, initialServices]);

  // Check if there are any validation errors
  const hasErrors = servicesWithErrors.size > 0;

  const areAllVisibleEnabled = useMemo(() => {
    if (filteredServices.length === 0) return false;
    return filteredServices.every((s) => s.canPerform);
  }, [filteredServices]);

  const toggleAllVisible = () => {
    const filteredIds = new Set(filteredServices.map((s) => s.serviceId));
    const newCanPerform = !areAllVisibleEnabled;
    setLocalServices((prev) =>
      prev.map((s) => {
        if (!filteredIds.has(s.serviceId)) return s;
        if (newCanPerform) {
          const isCustom = s.customPrice !== null || s.customDuration !== null;
          return { ...s, canPerform: true, isCustom };
        }
        return { ...s, canPerform: false, isCustom: false };
      })
    );
    if (!newCanPerform && filter !== "all") {
      setFilter("all");
    }
  };

  const renderSelectAllButton = () => (
    <button
      onClick={toggleAllVisible}
      className={cn(
        "inline-flex items-center justify-center h-10 md:h-8 !min-h-0 md:!min-w-36 px-3 gap-1.5 rounded-full border border-border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
        areAllVisibleEnabled
          ? "bg-info-100 border-border-strong text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1 dark:border-border-strong"
          : "bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong dark:bg-transparent dark:text-foreground-1 dark:hover:bg-neutral-900 dark:border-border-strong"
      )}
      aria-label={areAllVisibleEnabled ? t("page.manageTeamMemberDrawer.deselectAll") : t("page.manageTeamMemberDrawer.selectAll")}
      disabled={filteredServices.length === 0}
    >
      {areAllVisibleEnabled ? (
        <CheckSquare className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
      ) : (
        <Square className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
      )}
      <span className="text-xs font-medium hidden md:inline">
        {areAllVisibleEnabled ? t("page.manageTeamMemberDrawer.deselectAll") : t("page.manageTeamMemberDrawer.selectAll")}
      </span>
      <span className="text-xs font-medium md:hidden">
        {t("page.manageTeamMemberDrawer.filters.all")}
      </span>
    </button>
  );

  // Handlers
  const handleToggleCanPerform = (serviceId: number, canPerform: boolean) => {
    setLocalServices((prev) =>
      prev.map((s) => {
        if (s.serviceId === serviceId) {
          // If disabling, preserve custom values but mark service as disabled
          // Set isCustom to false so it doesn't count in stats, but keep the values
          if (!canPerform) {
            return {
              ...s,
              canPerform: false,
              isCustom: false, // Don't count as custom when disabled
              // Keep customPrice and customDuration intact for restoration
            };
          }
          // If re-enabling, restore isCustom flag based on preserved custom values
          const isCustom = s.customPrice !== null || s.customDuration !== null;
          return {
            ...s,
            canPerform: true,
            isCustom,
          };
        }
        return s;
      })
    );
  };

  const handleSetCustomPrice = (serviceId: number, price: number | null) => {
    setLocalServices((prev) =>
      prev.map((s) => {
        if (s.serviceId === serviceId) {
          // If price equals inherited, treat as revert
          const newCustomPrice = price === s.inheritedPrice ? null : price;
          const isCustom = newCustomPrice !== null || s.customDuration !== null;
          return {
            ...s,
            customPrice: newCustomPrice,
            isCustom,
          };
        }
        return s;
      })
    );
  };

  const handleSetCustomDuration = (
    serviceId: number,
    duration: number | null
  ) => {
    setLocalServices((prev) =>
      prev.map((s) => {
        if (s.serviceId === serviceId) {
          // If duration equals inherited, treat as revert
          const newCustomDuration =
            duration === s.inheritedDuration ? null : duration;
          const isCustom = s.customPrice !== null || newCustomDuration !== null;
          return {
            ...s,
            customDuration: newCustomDuration,
            isCustom,
          };
        }
        return s;
      })
    );
  };

  const handleServiceErrorChange = (serviceId: number, hasError: boolean) => {
    setServicesWithErrors((prev) => {
      const next = new Set(prev);
      if (hasError) {
        next.add(serviceId);
      } else {
        next.delete(serviceId);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(localServices);
  };

  // Animated indicator for filter buttons (like ResponsiveTabs)
  const filterButtonsRef = useRef<HTMLDivElement | null>(null);
  const filterButtonsDesktopRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || isHydrating) {
      setIndicatorStyle(null);
      return;
    }

    // Small delay to ensure DOM is ready, especially after loading completes
    const timeoutId = setTimeout(() => {
      const ref = filterButtonsRef.current || filterButtonsDesktopRef.current;
      if (!ref) return;

      const activeButton = ref.querySelector<HTMLButtonElement>(
        `[data-filter-id="${filter}"]`
      );

      if (!activeButton) return;

      const containerRect = ref.getBoundingClientRect();
      const rect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        left: rect.left - containerRect.left,
        width: rect.width,
      });
    }, 50); // Slightly longer delay to ensure buttons are rendered after loading

    return () => clearTimeout(timeoutId);
  }, [filter, isOpen, isHydrating]);

  // Empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-4 w-full">
      <div className="space-y-1.5 max-w-md px-4">
        <h3 className="text-base font-semibold text-foreground-1">
          {filter === "custom"
            ? t("page.manageTeamMemberDrawer.emptyState.noCustom")
            : filter === "enabled"
            ? t("page.manageTeamMemberDrawer.emptyState.noEnabled")
            : t("page.manageTeamMemberDrawer.emptyState.noServices")}
        </h3>
      </div>
    </div>
  );

  const renderServiceList = () => (
    <>
      {filteredServices.map((service) => (
        <StaffServiceItem
          key={service.serviceId}
          service={service}
          searchTerm=""
          currencyDisplay={currencyDisplay}
          currency={businessCurrency}
          onToggleCanPerform={handleToggleCanPerform}
          onSetCustomPrice={handleSetCustomPrice}
          onSetCustomDuration={handleSetCustomDuration}
          onErrorChange={handleServiceErrorChange}
        />
      ))}
    </>
  );

  // Toolbar skeleton. Mirrors the real toolbar's box model exactly — same
  // padding, same pill height, same select-all button — so the header does not
  // shift when the services land. (The old one had a stray border-b and no
  // select-all, which is what made the swap visibly jump.)
  const renderToolbarSkeleton = (isDesktop = false) => (
    <div
      className={cn(
        "flex flex-col gap-2",
        isDesktop ? "p-4 pt-2 pb-2" : "p-2 pt-0 pb-2"
      )}
    >
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 min-w-0">
          <Skeleton
            className={cn("w-full rounded-full", isDesktop ? "h-8" : "h-10")}
          />
        </div>
        <Skeleton
          className={cn(
            "shrink-0 rounded-full",
            isDesktop ? "h-8 w-36" : "h-10 w-16"
          )}
        />
      </div>
    </div>
  );

  // Row skeleton. StaffServiceItem rows start COLLAPSED, so this models the
  // collapsed row (~56px desktop / ~80px mobile) rather than the expanded
  // price+duration form the previous skeleton drew at roughly triple the height.
  const renderServiceListSkeleton = (isDesktop = false) =>
    Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-lg border border-border">
        {isDesktop ? (
          <div className="flex items-center gap-4 px-2 py-4">
            <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
            {/* flex-1 wrapper, not a flex-1 bar: the real name cell fills the
                row and pushes the price/duration summary to the right edge. */}
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
            <Skeleton className="h-4 w-12 shrink-0" />
            <Skeleton className="h-4 w-4 shrink-0" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-3 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-3/5" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
            <div className="flex items-center gap-5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        )}
      </div>
    ));

  // Desktop modal content
  const modalContent = (
    <>
      <DrawerHeader className="hidden md:flex flex-col bg-surface relative p-4 px-0 md:p-6">
        <div className="flex items-center gap-3 px-4 md:px-0">
          {teamMember && (
            <div className="hidden md:flex flex-shrink-0 items-stretch self-stretch">
              <PersonAvatar
                id={teamMember.userId ?? teamMember.email ?? ''}
                firstName={teamMember.firstName}
                lastName={teamMember.lastName}
                profileImage={teamMember.profileImage}
                className="aspect-square h-full min-w-[2.5rem] border-border-strong"
                initialsClassName="text-sm font-medium"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
            <DrawerTitle className="text-lg text-foreground-1 cursor-default">
              {t("page.manageTeamMemberDrawer.title", {
                name: teamMember ? `${teamMember.firstName} ${teamMember.lastName}` : "",
              })}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
              {t("page.manageTeamMemberDrawer.titleSubtitle")}
            </DrawerDescription>
          </div>
        </div>
        <DashedDivider
          marginTop="mt-3"
          className="pt-0 md:pt-3"
          dashPattern="1 1"
        />
      </DrawerHeader>

      {/* Toolbar */}
      {isHydrating ? (
        renderToolbarSkeleton(false)
      ) : (
        <div className="p-2 pt-0 pb-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0">
              <div
                ref={filterButtonsDesktopRef}
                className="relative flex h-10 items-stretch gap-1 rounded-full bg-transparent border border-border p-1"
              >
                <button
                  data-filter-id="all"
                  onClick={() => setFilter("all")}
                  style={
                    {
                      height: "auto",
                      minHeight: "0",
                    } as React.CSSProperties
                  }
                  className={cn(
                    "relative z-10 flex items-center justify-center gap-2 text-xs font-medium transition-colors flex-1 rounded-full px-0.5 py-2.5 !min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
                    filter === "all"
                      ? "text-foreground cursor-default"
                      : "text-foreground-2 hover:text-foreground cursor-pointer"
                  )}
                >
                  <span className="text-xs">
                    {t("page.manageTeamMemberDrawer.filters.all")}
                  </span>
                </button>
                <button
                  data-filter-id="enabled"
                  onClick={() => setFilter("enabled")}
                  style={
                    {
                      height: "auto",
                      minHeight: "0",
                    } as React.CSSProperties
                  }
                  className={cn(
                    "relative z-10 flex items-center justify-center gap-2 text-xs font-medium transition-colors flex-1 rounded-full px-0.5 py-1.5 !min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
                    filter === "enabled"
                      ? "text-foreground cursor-default"
                      : "text-foreground-2 hover:text-foreground cursor-pointer"
                  )}
                >
                  <span className="text-xs">
                    {t("page.manageTeamMemberDrawer.filters.enabled")}
                  </span>
                </button>
                <button
                  data-filter-id="custom"
                  onClick={() => setFilter("custom")}
                  style={
                    {
                      height: "auto",
                      minHeight: "0",
                    } as React.CSSProperties
                  }
                  className={cn(
                    "relative z-10 flex items-center justify-center gap-2 text-xs font-medium transition-colors flex-1 rounded-full px-0.5 py-1.5 !min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
                    filter === "custom"
                      ? "text-foreground cursor-default"
                      : "text-foreground-2 hover:text-foreground cursor-pointer"
                  )}
                >
                  <span className="text-xs">
                    {t("page.manageTeamMemberDrawer.filters.customRates")}
                  </span>
                </button>

                {/* Animated pill indicator */}
                {indicatorStyle && (
                  <span
                    className="pointer-events-none absolute inset-y-1 block rounded-full bg-sidebar shadow-sm transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.max(0, indicatorStyle.width - 2)}px`,
                      transform: `translateX(${indicatorStyle.left - 3}px)`,
                    }}
                  />
                )}
              </div>
            </div>
            {renderSelectAllButton()}
          </div>
        </div>
      )}

      {/* Services list */}
      <div
        className={cn(
          "flex-1 space-y-3 p-4",
          // Centering is only for the empty state. While the skeleton is up the
          // list is also "empty", which is what pushed it into the middle of the
          // modal instead of starting at the top.
          isHydrating || filteredServices.length > 0
            ? "overflow-y-auto"
            : "overflow-hidden flex items-center justify-center"
        )}
      >
        {isHydrating ? (
          renderServiceListSkeleton(false)
        ) : filteredServices.length === 0 ? (
          renderEmptyState()
        ) : (
          renderServiceList()
        )}
      </div>

      {/* Footer */}
      <div className="hidden md:flex flex-col bg-surface shrink-0">
        <DashedDivider
          marginTop="mt-0"
          className="mb-0"
          paddingTop="pt-4"
          dashPattern="1 1"
        />
        <div className="px-6 pb-2">
          <div className="flex justify-between gap-2 mt-4 mb-3 md:mb-2">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={onClose}
              disabled={isSaving}
              className="gap-2 h-11 cursor-pointer w-32 md:w-42"
            >
              {t("page.manageTeamMemberDrawer.buttons.cancel")}
            </Button>
            <Button
              type="button"
              rounded="full"
              onClick={handleSave}
              disabled={!hasChanges || hasErrors || isSaving || isHydrating}
              className="group gap-2 h-11 cursor-pointer w-72"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("page.manageTeamMemberDrawer.buttons.saving")}
                </span>
              ) : (
                <>
                  {t("page.manageTeamMemberDrawer.buttons.save")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  // Mobile drawer version
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose} autoFocus>
        <DrawerContent
          className=" !mt-0 flex h-[85vh] flex-col bg-popover text-popover-foreground !z-80"
          overlayClassName="!z-80"
        >
          <DrawerTitle className="">
            <div className="flex flex-col bg-surface relative px-4 py-2">
              <div className="flex items-center">
                <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
                  <h2 className="text-base text-center pt-1 text-foreground-1 cursor-default">
                    {teamMember && (
                      <span className="font-medium">
                        {" "}
                        {teamMember.firstName} {teamMember.lastName}
                      </span>
                    )}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hidden md:flex absolute right-4 top-4 h-8 w-8 rounded-md hover:bg-surface-hover active:bg-surface-active"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">
                    {t("page.ariaLabels.close")}
                  </span>
                </Button>
              </div>
            </div>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("page.manageTeamMemberDrawer.description")}
          </DrawerDescription>
          {modalContent}
          {/* Mobile footer */}
          <div className={cn("md:hidden bg-surface", keyboardVisible && "hidden")}>
            <DashedDivider
              marginTop="mt-0"
              className="mb-0"
              paddingTop="pt-2"
              dashPattern="1 1"
            />
            <div className="flex justify-between gap-2 mt-0 md:mb-2 p-4">
              <Button
                type="button"
                variant="outline"
                rounded="full"
                onClick={onClose}
                disabled={isSaving}
                className="gap-2 h-11 cursor-pointer w-32"
              >
                {t("page.manageTeamMemberDrawer.buttons.cancel")}
              </Button>
              <Button
                type="button"
                rounded="full"
                onClick={handleSave}
                disabled={!hasChanges || hasErrors || isSaving || isHydrating}
                className="group gap-2 h-11 cursor-pointer flex-1"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("page.manageTeamMemberDrawer.buttons.saving")}
                  </span>
                ) : (
                  <>
                    {t("page.manageTeamMemberDrawer.buttons.save")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop modal version
  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-80 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-80 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-popover overflow-hidden text-popover-foreground rounded-lg border shadow-lg max-w-2xl w-full h-[85vh] flex flex-col p-0 pointer-events-auto animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col bg-surface relative p-4 px-0 md:p-6 md:pb-0">
            <div className="flex items-center gap-3 px-4 md:px-0">
              {teamMember && (
                <div className="hidden md:flex flex-shrink-0 items-stretch self-stretch">
                  <PersonAvatar
                    id={teamMember.userId ?? teamMember.email ?? ''}
                    firstName={teamMember.firstName}
                    lastName={teamMember.lastName}
                    profileImage={teamMember.profileImage}
                    className="h-13 w-13 border-border-strong"
                    initialsClassName="text-sm font-medium"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
                <h2 className="text-lg text-foreground-1 cursor-default">
                  {t("page.manageTeamMemberDrawer.title", {
                    name: teamMember ? `${teamMember.firstName} ${teamMember.lastName}` : "",
                  })}
                </h2>
                <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
                  {t("page.manageTeamMemberDrawer.titleSubtitle")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hidden md:flex absolute right-4 top-4 h-8 w-8 rounded-md hover:bg-surface-hover active:bg-surface-active"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">
                  {t("page.ariaLabels.close")}
                </span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Toolbar */}
            {isHydrating ? (
              renderToolbarSkeleton(true)
            ) : (
              <div className="p-4 pt-2 pb-2 flex flex-col gap-2">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 min-w-0">
                    <div
                      ref={filterButtonsDesktopRef}
                      className="relative flex w-full h-8 items-stretch gap-1 rounded-full bg-transparent border border-border p-1"
                    >
                      <button
                        data-filter-id="all"
                        onClick={() => setFilter("all")}
                        style={
                          {
                            height: "auto",
                            minHeight: "0",
                          } as React.CSSProperties
                        }
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 text-xs font-medium transition-colors flex-1 rounded-full px-1.5 py-2.5 !min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
                          filter === "all"
                            ? "text-foreground cursor-default"
                            : "text-foreground-2 hover:text-foreground cursor-pointer"
                        )}
                      >
                        <span className="text-sm">
                          {t("page.manageTeamMemberDrawer.filters.all")}
                        </span>
                      </button>
                      <button
                        data-filter-id="enabled"
                        onClick={() => setFilter("enabled")}
                        style={
                          {
                            height: "auto",
                            minHeight: "0",
                          } as React.CSSProperties
                        }
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 text-xs font-medium transition-colors flex-1 rounded-full px-1.5 py-1.5 !min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
                          filter === "enabled"
                            ? "text-foreground cursor-default"
                            : "text-foreground-2 hover:text-foreground cursor-pointer"
                        )}
                      >
                        <span className="text-sm">
                          {t("page.manageTeamMemberDrawer.filters.enabled")}
                        </span>
                      </button>
                      <button
                        data-filter-id="custom"
                        onClick={() => setFilter("custom")}
                        style={
                          {
                            height: "auto",
                            minHeight: "0",
                          } as React.CSSProperties
                        }
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-2 text-xs font-medium transition-colors flex-1 rounded-full px-1.5 py-1.5 !min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
                          filter === "custom"
                            ? "text-foreground cursor-default"
                            : "text-foreground-2 hover:text-foreground cursor-pointer"
                        )}
                      >
                        <span className="text-sm">
                          {t("page.manageTeamMemberDrawer.filters.customRates")}
                        </span>
                      </button>

                      {/* Animated pill indicator */}
                      {indicatorStyle && (
                        <span
                          className="pointer-events-none absolute inset-y-1 block rounded-full bg-sidebar shadow-sm transition-all duration-300 ease-out"
                          style={{
                            width: `${Math.max(0, indicatorStyle.width - 2)}px`,
                            transform: `translateX(${indicatorStyle.left - 3}px)`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  {renderSelectAllButton()}
                </div>
              </div>
            )}

            <div
              className={cn(
                "flex-1 space-y-3 scrollbar-hide relative p-4",
                // See the mobile list: centering belongs to the empty state only.
                isHydrating || filteredServices.length > 0
                  ? "overflow-y-auto"
                  : "overflow-hidden flex items-center justify-center"
              )}
            >
              {isHydrating ? (
                renderServiceListSkeleton(true)
              ) : filteredServices.length === 0 ? (
                renderEmptyState()
              ) : (
                renderServiceList()
              )}
            </div>
          </div>

          {/* Desktop footer */}
          <div className="hidden md:flex flex-col bg-surface shrink-0">
            <DashedDivider
              marginTop="mt-0"
              className="mb-0"
              paddingTop="pt-4"
              dashPattern="1 1"
            />
            <div className="px-6 pb-2 flex justify-end">
              <div className="flex justify-between gap-4 w-2/3 mt-4 mb-3 md:mb-2">
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={onClose}
                  disabled={isSaving}
                  className="gap-2 h-11 cursor-pointer w-1/3"
                >
                  {t("page.manageTeamMemberDrawer.buttons.cancel")}
                </Button>
                <Button
                  type="button"
                  rounded="full"
                  onClick={handleSave}
                  disabled={!hasChanges || hasErrors || isSaving || isHydrating}
                  className="group gap-2 h-11 cursor-pointer w-2/3"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("page.manageTeamMemberDrawer.buttons.saving")}
                    </span>
                  ) : (
                    <>
                      {t("page.manageTeamMemberDrawer.buttons.save")}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
