import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  getViewModeSelector,
  getViewTypeSelector,
  getActiveCalendarFiltersCount,
  getDayFilters,
} from "../../selectors";
import {
  setViewModeAction,
  setViewTypeAction,
  setBlockFormEditingAction,
  toggleAddForm,
  toggleBlockFormAction,
  setScrollToNow,
  setDayFiltersAction,
} from "../../actions";
import { AppointmentViewMode, AppointmentViewType } from "../../types";
import { Button } from "../../../../shared/components/ui/button";
import {
  CalendarPlus,
  GalleryVertical,
  Grid3x2,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings,
  ShieldBan,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { CalendarHeaderFilters } from "../CalendarHeaderFilters";
import { LocationSelector } from "../LocationSelector";
import { CustomerSearchPopover, type CustomerSearchResult } from "../CustomerSearchPopover";
import { Avatar, AvatarFallback } from "../../../../shared/components/ui/avatar";
import { getCustomerInitials } from "../addAppointmentSliderHelpers";
import { getAvatarBgColor } from "../../../setupWizard/components/StepTeam";
import "./mobilePopoverSpring.css";

interface MobileCalendarHeaderProps {
  onOpenSettings: () => void;
}

export const MobileCalendarHeader: FC<MobileCalendarHeaderProps> = ({
  onOpenSettings,
}) => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const viewMode = useSelector(getViewModeSelector);
  const viewType = useSelector(getViewTypeSelector);
  const activeFiltersCount = useSelector(getActiveCalendarFiltersCount);
  const dayFilters = useSelector(getDayFilters);

  const hasCustomerFilter = dayFilters.customerId != null;

  // Plus menu inline expansion (view mode is a direct Day↔Month toggle, not a menu)
  const [plusMenuExpanded, setPlusMenuExpanded] = useState(false);
  // Location dropdown open state — when true, the action container shrinks
  // to just the + icon so the location pill can expand for easier picking.
  const [locationOpen, setLocationOpen] = useState(false);
  const isExpanded = plusMenuExpanded;

  /* When viewMode changes the morph's iconCount changes (4 ↔ 3), which
   * shifts its width. We don't want that width to animate — the view itself
   * is already fading in, and an extra 200ms layout-dirty width tween on top
   * of that is what makes cheap Android stutter. Snap width on view switch. */
  const prevViewModeRef = useRef(viewMode);
  const [snapMorphWidth, setSnapMorphWidth] = useState(false);
  useEffect(() => {
    if (prevViewModeRef.current !== viewMode) {
      prevViewModeRef.current = viewMode;
      setSnapMorphWidth(true);
      const id = window.setTimeout(() => setSnapMorphWidth(false), 50);
      return () => window.clearTimeout(id);
    }
  }, [viewMode]);

  const morphContainerRef = useRef<HTMLDivElement>(null);
  const closeAll = useCallback(() => {
    setPlusMenuExpanded(false);
  }, []);

  // Location and plus menu are mutually exclusive visually — closing the
  // other whenever one opens keeps the header state machine simple.
  const handleLocationOpenChange = useCallback((open: boolean) => {
    setLocationOpen(open);
    if (open) setPlusMenuExpanded(false);
  }, []);
  const handlePlusMenuOpen = useCallback(() => {
    setPlusMenuExpanded(true);
  }, []);

  /* Outside-tap → close AND swallow the tap. We can't rely on a fixed
   * backdrop here: the header wrapper uses `transform` for scroll-collapse,
   * which turns its subtree into a new containing block — any `fixed`
   * element inside positions relative to the header, not the viewport,
   * leaving the rest of the page hit-testable. */
  useEffect(() => {
    if (!isExpanded) return;
    const onDocClickCapture = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (morphContainerRef.current?.contains(target)) return;
      e.stopPropagation();
      e.preventDefault();
      closeAll();
    };
    document.addEventListener("click", onDocClickCapture, true);
    return () => document.removeEventListener("click", onDocClickCapture, true);
  }, [isExpanded, closeAll]);

  // Customer search — mounted/visible split for enter/exit animations
  const [customerSearchMounted, setCustomerSearchMounted] = useState(false);
  const [customerSearchVisible, setCustomerSearchVisible] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const proxyInputRef = useRef<HTMLInputElement>(null);

  const openCustomerSearch = useCallback(() => {
    // Focus a hidden proxy input synchronously on tap — this claims the keyboard
    // from the OS while the overlay mounts (mobile browsers require sync focus in gesture)
    proxyInputRef.current?.focus({ preventScroll: true });
    setCustomerSearchMounted(true);
    requestAnimationFrame(() => {
      setCustomerSearchVisible(true);
      // Transfer focus to the real input after it mounts
      setTimeout(() => {
        customerInputRef.current?.focus({ preventScroll: true });
      }, 50);
    });
  }, []);

  const closeCustomerSearch = useCallback(() => {
    setCustomerSearchVisible(false);
    // Wait for exit animation to finish before unmounting
    setTimeout(() => setCustomerSearchMounted(false), 250);
  }, []);

  const handleSelectCustomer = useCallback((customer: CustomerSearchResult) => {
    dispatch(
      setDayFiltersAction({
        ...dayFilters,
        clientName: undefined,
        customerId: customer.id,
        customerEmail: customer.email || undefined,
        customerPhone: customer.phone || undefined,
        customerFullName: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || undefined,
      }),
    );
    closeCustomerSearch();
  }, [dispatch, dayFilters, closeCustomerSearch]);

  const handleClearCustomer = useCallback(() => {
    dispatch(
      setDayFiltersAction({
        ...dayFilters,
        clientName: undefined,
        customerId: undefined,
        customerEmail: undefined,
        customerPhone: undefined,
        customerFullName: undefined,
      }),
    );
    // Refocus the search input so the user can search again
    requestAnimationFrame(() => customerInputRef.current?.focus({ preventScroll: true }));
  }, [dispatch, dayFilters]);

  // Filter drawer state
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleToggleViewMode = useCallback(() => {
    dispatch(
      setViewModeAction(
        viewMode === AppointmentViewMode.MONTH
          ? AppointmentViewMode.DAY
          : AppointmentViewMode.MONTH,
      ),
    );
  }, [dispatch, viewMode]);

  const handleToggleViewType = useCallback(() => {
    const next =
      viewType === AppointmentViewType.GRID
        ? AppointmentViewType.LIST
        : AppointmentViewType.GRID;
    dispatch(setViewTypeAction(next));
    if (next === AppointmentViewType.GRID) {
      dispatch(setScrollToNow(true));
    }
  }, [dispatch, viewType]);

  const handleOpenAddForm = useCallback(() => {
    dispatch(toggleAddForm({ open: true }));
  }, [dispatch]);

  const handleOpenBlockForm = useCallback(() => {
    dispatch(setBlockFormEditingAction(null));
    dispatch(toggleBlockFormAction(true));
  }, [dispatch]);

  return (
    <>
      <div className="relative flex items-center gap-2 px-3 bg-white dark:bg-surface overflow-visible" style={{ height: 62 }}>
        {/* Location selector — capped width so the icon row keeps a
         *  comfortable share of the header. In Month mode the row has one
         *  fewer icon, so we let the pill grow a bit into the freed space.
         *  When the location dropdown opens the cap is dropped so picking
         *  is easier. */}
        <div
          className={`flex-1 min-w-0 ${
            locationOpen
              ? "max-w-none"
              : viewMode === AppointmentViewMode.MONTH
                ? "max-w-[220px]"
                : "max-w-[180px]"
          }`}
        >
          <LocationSelector
            closedClassName="!rounded-2xl"
            mobile
            onOpenChange={handleLocationOpenChange}
          />
        </div>

        {/* Actions container — morphs between icon row / plus menu, and
         *  squeezes to just the + icon while the location dropdown is open. */}
        {(() => {
          // Build plus menu items
          const plusItems: { icon: typeof Plus; label: string; onClick: () => void; primary?: boolean; badge?: number }[] = [
            { icon: CalendarPlus, label: t("page.header.addEvent"), onClick: () => { handleOpenAddForm(); closeAll(); }, primary: true },
            { icon: ShieldBan, label: t("page.header.block"), onClick: () => { handleOpenBlockForm(); closeAll(); } },
            { icon: SlidersHorizontal, label: t("page.header.filters"), onClick: () => { closeAll(); setTimeout(() => setFiltersOpen(true), 150); }, badge: activeFiltersCount > 0 ? activeFiltersCount : undefined },
            { icon: Settings, label: t("page.header.calendarSettings"), onClick: () => { onOpenSettings(); closeAll(); } },
          ];

          return (
            <>
              {(() => {
                // Width depends on how many direct icons are visible right now:
                //   Day mode: 4 icons (day/month, list/grid, search, plus)
                //   Month mode: 3 icons (day/month, search, plus)
                // When the location pill is open we squeeze to just the + icon.
                // Each icon cell is 32px; we add breathing room so the muted
                // pill is visibly a pill. Day has 4 icons and gets extra
                // horizontal padding so the icons don't feel crammed.
                const iconCount = viewMode === AppointmentViewMode.DAY ? 4 : 3;
                const slack = iconCount === 4 ? 56 : 36; // 28px vs 18px each side
                const iconsRowWidth = iconCount * 32 + slack;
                const morphWidth = locationOpen
                  ? 52 // + icon (32px) + inner breathing + border
                  : plusMenuExpanded
                    ? 220
                    : iconsRowWidth;
                return (
              <div
                ref={morphContainerRef}
                className={`ml-auto rounded-2xl border border-border [will-change:width] [contain:layout] ${
                  /* Base z sits alongside the collapsible location header.
                   *  When the + menu is expanded, bump above sticky column
                   *  headers (z-30) and the floating Clear Filters pill (z-40)
                   *  so the action list always renders on top of page content. */
                  isExpanded ? "z-[60]" : "z-20"
                } ${
                  snapMorphWidth
                    ? "transition-none"
                    : "transition-[background-color,box-shadow,width] duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                } ${
                  locationOpen
                    ? "overflow-hidden self-center bg-muted/30 dark:bg-muted/10 shadow-none"
                    : isExpanded
                      ? "overflow-hidden self-start mt-1 bg-white dark:bg-surface shadow-lg"
                      : "overflow-visible self-center bg-muted/30 dark:bg-muted/10 shadow-none"
                }`}
                style={{ width: morphWidth }}
              >
                {/* Icons row */}
                <div className={`flex items-center justify-center gap-0 transition-all duration-100 ${
                  isExpanded ? "h-0 opacity-0 pointer-events-none overflow-hidden" : "opacity-100 overflow-visible"
                }`}>
                  {/* Day ↔ Month toggle — hidden when location pill is open so
                   *  only the + icon remains visible in the squeezed state. */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 shrink-0 group ${locationOpen ? "hidden" : ""}`}
                    onClick={handleToggleViewMode}
                  >
                    {viewMode === AppointmentViewMode.MONTH ? (
                      <Grid3x2 className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    ) : (
                      <GalleryVertical className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    )}
                  </Button>

                  {/* List/Grid direct toggle — only meaningful in Day mode.
                   *  Icon represents the TARGET state (tap to switch to it). */}
                  {viewMode === AppointmentViewMode.DAY && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 shrink-0 group ${locationOpen ? "hidden" : ""}`}
                      onClick={handleToggleViewType}
                      aria-label={
                        viewType === AppointmentViewType.GRID
                          ? t("page.header.switchToList")
                          : t("page.header.switchToGrid")
                      }
                    >
                      {viewType === AppointmentViewType.GRID ? (
                        <List className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                      ) : (
                        <LayoutGrid className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 shrink-0 group relative overflow-visible ${locationOpen ? "hidden" : ""}`}
                    onClick={() => customerSearchMounted ? closeCustomerSearch() : openCustomerSearch()}
                  >
                    <Search className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    {hasCustomerFilter && !customerSearchMounted && (
                      <span className="absolute -top-0.5 -right-0.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
                        1
                      </span>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 relative overflow-visible"
                    onClick={handlePlusMenuOpen}
                  >
                    <Plus className="!h-6 !w-6 text-primary" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Plus menu list */}
                {plusMenuExpanded && <div className="overflow-hidden view-mode-list-enter">
                  <div className="p-1">
                    {plusItems.map((item, index) => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer whitespace-nowrap
                          transition-transform duration-150 active:scale-[0.97]
                          ${plusMenuExpanded ? "view-mode-item-stagger" : ""}`}
                        style={plusMenuExpanded ? { animationDelay: `${index * 25}ms` } : undefined}
                      >
                        <item.icon className={`h-6 w-6 shrink-0 ${item.primary ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-foreground">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>}
              </div>
                );
              })()}

            </>
          );
        })()}
      </div>

      {/* Customer search — fullscreen overlay. Portaled to document.body so
       *  `fixed inset-0` actually covers the viewport: the layout's header
       *  wrapper uses `transform` for scroll-collapse, which makes it the
       *  containing block for any `fixed` descendant and would otherwise
       *  shrink this overlay to the header strip. */}
      {customerSearchMounted && createPortal(
        <div className="fixed inset-0 z-[90] flex flex-col">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-250 ease-out ${
              customerSearchVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeCustomerSearch}
          />
          {/* Search panel */}
          <div
            className={`relative z-[95] bg-white dark:bg-surface px-3 pt-3 pb-3 shadow-lg transition-all duration-250 ease-out ${
              customerSearchVisible
                ? "translate-y-0 opacity-100"
                : "-translate-y-full opacity-0"
            }`}
          >
            <CustomerSearchPopover
              onSelectCustomer={handleSelectCustomer}
              resetTrigger={customerSearchMounted}
              autoFocus
              inputRef={customerInputRef}
              popoverClassName="!z-[100]"
            />
            {hasCustomerFilter && (() => {
              const nameParts = (dayFilters.customerFullName ?? "").trim().split(" ");
              const firstName = nameParts[0] ?? "";
              const lastName = nameParts.slice(1).join(" ");
              const avatarColorKey =
                dayFilters.customerEmail?.trim() ||
                `${firstName}-${lastName}-${dayFilters.customerPhone ?? ""}-${dayFilters.customerId}`;
              return (
                <div className="mt-2 flex items-center gap-3 rounded-md border border-border bg-muted/30 p-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className="text-sm font-medium"
                      style={{ backgroundColor: getAvatarBgColor(avatarColorKey) }}
                    >
                      {getCustomerInitials(
                        { firstName, lastName, email: dayFilters.customerEmail ?? "", phone: dayFilters.customerPhone ?? "" },
                        "C",
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {dayFilters.customerFullName || t("page.common.unnamedCustomer")}
                    </div>
                    {(dayFilters.customerEmail || dayFilters.customerPhone) && (
                      <div className="text-xs text-muted-foreground truncate">
                        {dayFilters.customerEmail || dayFilters.customerPhone}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 shrink-0"
                    onClick={handleClearCustomer}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body,
      )}

      {/* Filter drawer — controlled, no trigger, opens after dropdown unmounts */}
      <CalendarHeaderFilters
        externalOpen={filtersOpen}
        onExternalOpenChange={setFiltersOpen}
      />

      {/* Hidden proxy input — focused synchronously on tap to claim keyboard on mobile */}
      <input
        ref={proxyInputRef}
        className="fixed -top-[100px] left-0 w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden
        readOnly
      />
    </>
  );
};
