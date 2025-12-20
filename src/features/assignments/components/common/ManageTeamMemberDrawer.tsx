import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { X, ArrowRight, Info } from "lucide-react";
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
import { getCurrencyDisplay } from "../../../../shared/utils/currency";
import { selectCurrentUser } from "../../../auth/selectors";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider";
import { StaffServiceItem } from "./StaffServiceItem";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../../../shared/components/ui/avatar";
import { getAvatarBgColor } from "../../../setupWizard/components/StepTeam";
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
  locationName,
  services: initialServices,
  onSave,
  currency = "USD",
  isSaving = false,
  isLoading = false,
  localLocationServices = [],
}: ManageTeamMemberDrawerProps) {
  const { t } = useTranslation("assignments");
  const isMobile = useIsMobile();
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency =
    currency || currentUser?.business?.businessCurrency || "eur";
  const currencyDisplay = getCurrencyDisplay(businessCurrency);

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
        const backendService = initialServices.find((s) => s.serviceId === ls.serviceId);
        
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

  // Filter services
  const filteredServices = useMemo(() => {
    // Apply basic filter (all/enabled/custom)
    switch (filter) {
      case "enabled":
        return localServices.filter((s) => s.canPerform);
      case "custom":
        return localServices.filter((s) => s.isCustom);
      default:
        return localServices;
    }
  }, [localServices, filter]);

  // Stats
  const enabledCount = localServices.filter((s) => s.canPerform).length;
  const customCount = localServices.filter((s) => s.isCustom).length;

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

  // Get avatar initials
  const avatarInitials = teamMember
    ? `${teamMember.firstName[0]}${teamMember.lastName[0]}`.toUpperCase()
    : "";

  // Animated indicator for filter buttons (like ResponsiveTabs)
  const filterButtonsRef = useRef<HTMLDivElement | null>(null);
  const filterButtonsDesktopRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || isLoading) {
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
  }, [filter, isOpen, isLoading]);

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
        <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {filter === "custom"
            ? t("page.manageTeamMemberDrawer.emptyState.noCustomDescription", {
                defaultValue: "No services have custom pricing.",
              })
            : filter === "enabled"
            ? t("page.manageTeamMemberDrawer.emptyState.noEnabledDescription", {
                defaultValue: "No services are enabled for this member.",
              })
            : t(
                "page.manageTeamMemberDrawer.emptyState.noServicesDescription",
                { defaultValue: "No services available at this location." }
              )}
        </p>
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

  const renderToolbarSkeleton = (isDesktop = false) => (
    <div
      className={cn(
        "p-4 flex flex-col border-b border-border",
        isDesktop ? "pt-2 gap-2" : "gap-2"
      )}
    >
      {/* Filter buttons row skeleton */}
      <div className="w-full">
        <Skeleton
          className={cn("!h-6 rounded-full", isDesktop ? "w-2/3" : "!w-full")}
        />
      </div>
    </div>
  );

  // Desktop modal content
  const modalContent = (
    <>
      <DrawerHeader className="hidden md:flex flex-col bg-surface relative p-4 px-0 md:p-6">
        <div className="flex items-center gap-3 px-4 md:px-0">
          {teamMember && (
            <div className="hidden md:flex flex-shrink-0 items-stretch self-stretch">
              <Avatar className="rounded-full border border-border-strong bg-surface aspect-square h-full min-w-[2.5rem]">
                <AvatarImage
                  src={teamMember.profileImage || undefined}
                  alt={`${teamMember.firstName} ${teamMember.lastName}`}
                />
                <AvatarFallback
                  className="text-sm font-medium"
                  style={{
                    backgroundColor: teamMember.email
                      ? getAvatarBgColor(teamMember.email)
                      : undefined,
                  }}
                >
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
            <DrawerTitle className="text-lg text-foreground-1 cursor-default">
              {t("page.manageTeamMemberDrawer.title", {
                name: "",
              })}
              {teamMember && (
                <span className="font-medium">
                  {" "}
                  {teamMember.firstName} {teamMember.lastName}
                </span>
              )}
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
            {isLoading ? (
              renderToolbarSkeleton(false)
            ) : (
              <div className="p-2 pt-0 pb-2 flex flex-col">
                {/* Filter buttons row */}
                <div className="w-full">
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
                        {t("page.manageTeamMemberDrawer.filters.enabled")} (
                        {enabledCount})
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
                        {t("page.manageTeamMemberDrawer.filters.customRates", {
                          defaultValue: "Custom rates",
                        })}{" "}
                        ({customCount})
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
              </div>
            )}

      {/* Services list */}
      <div
        className={cn(
          "flex-1 space-y-3",
          filteredServices.length > 0
            ? "overflow-y-auto"
            : "overflow-hidden flex items-center justify-center",
          "p-4"
        )}
      >
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Skeleton className="h-5 w-9 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              disabled={!hasChanges || hasErrors || isSaving || isLoading}
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
          className=" !mt-0 flex flex-col bg-popover text-popover-foreground !z-80"
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
                  {t("page.manageTeamMemberDrawer.buttons.cancel")}
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
          <div className="md:hidden bg-surface">
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
                disabled={!hasChanges || hasErrors || isSaving || isLoading}
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
                  <Avatar className="rounded-full border border-border-strong bg-surface h-13 w-13">
                    <AvatarImage
                      src={teamMember.profileImage || undefined}
                      alt={`${teamMember.firstName} ${teamMember.lastName}`}
                    />
                    <AvatarFallback
                      className="text-sm font-medium"
                      style={{
                        backgroundColor: teamMember.email
                          ? getAvatarBgColor(teamMember.email)
                          : undefined,
                      }}
                    >
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
                <h2 className="text-lg text-foreground-1 cursor-default">
                  {t("page.manageTeamMemberDrawer.title", {
                    name: "",
                  })}
                  {teamMember && (
                    <span className="font-medium">
                      {" "}
                      {teamMember.firstName} {teamMember.lastName}
                    </span>
                  )}
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
                  {t("page.manageTeamMemberDrawer.buttons.cancel")}
                </span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Toolbar */}
            {isLoading ? (
              renderToolbarSkeleton(true)
            ) : (
              <div className="p-4 pt-2 pb-2 flex flex-col">
                {/* Filter buttons row */}
                <div className="w-full">
                  <div
                    ref={filterButtonsDesktopRef}
                    className="relative flex w-2/3 h-8 items-stretch gap-1 rounded-full bg-transparent border border-border p-1"
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
                        {t("page.manageTeamMemberDrawer.filters.enabled")} (
                        {enabledCount})
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
                        {t("page.manageTeamMemberDrawer.filters.customRates", {
                          defaultValue: "Custom rates",
                        })}{" "}
                        ({customCount})
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
              </div>
            )}

            <div
              className={cn(
                "flex-1 space-y-3 scrollbar-hide relative",
                filteredServices.length > 0
                  ? "overflow-y-auto"
                  : "overflow-hidden flex items-center justify-center",
                "p-4"
              )}
            >
              {isLoading ? (
                <div className="space-y-3 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Skeleton className="h-5 w-9 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                        <div className="space-y-1.5">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  disabled={!hasChanges || hasErrors || isSaving || isLoading}
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
