import { type FC, useCallback, useRef, useState } from "react";
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
  Columns3,
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

  // View mode and plus menu inline expansion (mutually exclusive)
  const [viewModeExpanded, setViewModeExpanded] = useState(false);
  const [plusMenuExpanded, setPlusMenuExpanded] = useState(false);
  const hasExpandedOnce = useRef(false);
  if (viewModeExpanded || plusMenuExpanded) hasExpandedOnce.current = true;

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

  const handleSetMode = useCallback(
    (mode: AppointmentViewMode) => {
      if (mode === viewMode) return;
      dispatch(setViewModeAction(mode));
    },
    [dispatch, viewMode],
  );

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
      <div className="relative flex items-center gap-2 px-3 bg-white dark:bg-surface border-b border-border overflow-visible" style={{ height: 62 }}>
        {/* Location selector */}
        <div className="shrink min-w-0 flex-1">
          <LocationSelector closedClassName="!rounded-2xl" mobile />
        </div>

        {/* Actions container — morphs between icon row / view mode list / plus menu */}
        {(() => {
          const isExpanded = viewModeExpanded || plusMenuExpanded;
          const closeAll = () => { setViewModeExpanded(false); setPlusMenuExpanded(false); };

          // Build plus menu items
          const plusItems: { icon: typeof Plus; label: string; onClick: () => void; primary?: boolean; badge?: number }[] = [
            { icon: CalendarPlus, label: t("page.header.addEvent"), onClick: () => { handleOpenAddForm(); closeAll(); }, primary: true },
            { icon: ShieldBan, label: t("page.header.block"), onClick: () => { handleOpenBlockForm(); closeAll(); } },
            { icon: SlidersHorizontal, label: t("page.header.filters"), onClick: () => { closeAll(); setTimeout(() => setFiltersOpen(true), 150); }, badge: activeFiltersCount > 0 ? activeFiltersCount : undefined },
            ...((viewMode === AppointmentViewMode.DAY || viewMode === AppointmentViewMode.WEEK) ? [{
              icon: viewType === AppointmentViewType.GRID ? List : LayoutGrid,
              label: viewType === AppointmentViewType.GRID ? t("page.header.switchToList") : t("page.header.switchToGrid"),
              onClick: () => { handleToggleViewType(); closeAll(); },
            }] : []),
            { icon: Settings, label: t("page.header.calendarSettings"), onClick: () => { onOpenSettings(); closeAll(); } },
          ];

          return (
            <>
              <div
                className={`rounded-2xl border border-border z-20 min-w-[132px] transition-[background-color,box-shadow] duration-200 mobile-morph-container ${
                  isExpanded
                    ? "overflow-hidden self-start mt-1 bg-white dark:bg-surface shadow-lg mobile-morph-expanded"
                    : `overflow-visible self-center bg-muted/30 dark:bg-muted/10 shadow-none ${hasExpandedOnce.current ? "mobile-morph-collapsed" : ""}`
                }`}
                style={{
                  "--morph-collapsed-width": "132px",
                  "--morph-expanded-width": plusMenuExpanded ? "200px" : "140px",
                } as React.CSSProperties}
              >
                {/* Icons row */}
                <div className={`flex items-center justify-center gap-0 transition-all duration-100 ${
                  isExpanded ? "h-0 opacity-0 pointer-events-none overflow-hidden" : "opacity-100 overflow-visible"
                }`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 group"
                    onClick={() => { setPlusMenuExpanded(false); setViewModeExpanded(true); }}
                  >
                    {viewMode === AppointmentViewMode.DAY ? (
                      <GalleryVertical className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    ) : viewMode === AppointmentViewMode.WEEK ? (
                      <Columns3 className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    ) : (
                      <Grid3x2 className="!h-6 !w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 group relative overflow-visible"
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
                    onClick={() => { setViewModeExpanded(false); setPlusMenuExpanded(true); }}
                  >
                    <Plus className="!h-6 !w-6 text-primary" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </div>

                {/* View mode list */}
                {viewModeExpanded && <div className="overflow-hidden view-mode-list-enter">
                  <div className="p-1">
                    {(
                      [
                        [AppointmentViewMode.DAY, t("page.header.day"), GalleryVertical],
                        [AppointmentViewMode.WEEK, t("page.header.week"), Columns3],
                        [AppointmentViewMode.MONTH, t("page.header.month"), Grid3x2],
                      ] as const
                    ).map(([mode, label, Icon], index) => (
                      <button
                        key={mode}
                        onClick={() => {
                          handleSetMode(mode);
                          closeAll();
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer whitespace-nowrap
                          transition-transform duration-150 active:scale-[0.97]
                          ${viewModeExpanded ? "view-mode-item-stagger" : ""}`}
                        style={viewModeExpanded ? { animationDelay: `${index * 30}ms` } : undefined}
                      >
                        <Icon className={`h-6 w-6 shrink-0 ${viewMode === mode ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={viewMode === mode ? "font-medium text-foreground" : "text-muted-foreground"}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>}

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

              {/* Backdrop to dismiss */}
              {isExpanded && (
                <div className="fixed inset-0 z-10" onClick={closeAll} />
              )}
            </>
          );
        })()}
      </div>

      {/* Customer search — fullscreen overlay */}
      {customerSearchMounted && (
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
        </div>
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
