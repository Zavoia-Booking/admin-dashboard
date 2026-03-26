import { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getColorHex, getReadableTextColor } from "../../../shared/utils/color.ts";
import { highlightMatches } from "../../../shared/utils/highlight.tsx";
import { SearchInput } from "../../../shared/components/common/SearchInput.tsx";
import {
  getDayFilters,
  getLocationBundles,
  getLocationContextLoading,
  getLocationServices,
  getSelectedLocationId,
} from "../selectors.ts";
import { setDayFiltersAction } from "../actions.ts";
import { AppointmentBookingSource, type CalendarDayFilters } from "../../../shared/types/calendar.ts";
import {
  Check,
  Footprints,
  Globe,
  Phone,
  Store,
  Tag,
  type LucideIcon,
  UserCog,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../../shared/components/ui/command.tsx";
import { cn } from "../../../shared/lib/utils";
import {
  CALENDAR_FILTER_SECTION_TITLE,
  CALENDAR_FILTER_DIVIDER_OUTER,
  CALENDAR_FILTER_DIVIDER_GUTTER,
  CALENDAR_FILTER_DIVIDER_LINE,
  CALENDAR_FILTER_SECTION_BREAK_MT,
  CALENDAR_FILTER_CHIP_ALL_BASE,
  CALENDAR_FILTER_CHIP_ITEM_BASE,
  CALENDAR_FILTER_CHIP_LABEL,
} from "./calendarSidebarStyles.ts";
import { getStatusFilterIndicatorDotClass } from "../colors.ts";
import { STATUS_LIST } from "../utils.ts";
import { CalendarFilterPillCheckmark } from "./CalendarFilterPillCheckmark.tsx";
import "./addAppointmentSliderPopover.css";

/** Same order and labels as {@link STATUS_LIST} (excludes "all"). */
const STATUS_FILTER_ENTRIES = STATUS_LIST.filter((s) => s.value !== "all");

const BOOKING_SOURCE_OPTIONS: { value: AppointmentBookingSource; label: string; Icon: LucideIcon }[] = [
  { value: AppointmentBookingSource.ADMIN, label: "Admin", Icon: UserCog },
  { value: AppointmentBookingSource.MARKETPLACE, label: "Marketplace", Icon: Store },
  { value: AppointmentBookingSource.PHONE, label: "Phone", Icon: Phone },
  { value: AppointmentBookingSource.WALK_IN, label: "Walk-in", Icon: Footprints },
];

type LineOption = { kind: "service" | "bundle"; id: number; label: string };

function matchesLineSearch(opt: LineOption, qRaw: string): boolean {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const kindWord = opt.kind === "service" ? "service" : "bundle";
  return (
    opt.label.toLowerCase().includes(q) ||
    kindWord.includes(q) ||
    (digits.length > 0 && String(opt.id).includes(digits))
  );
}

const normalizeLineSearch = (q: string) => q.trim().replace(/\s+/g, " ");

/** Green check for selected line-item rows (matches calendar filter success affordance). */
function LineItemSelectedCheck({ visible }: { visible: boolean }) {
  return (
    <span className="flex h-4 w-5 shrink-0 items-center justify-center" aria-hidden>
      {visible ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={2.75} aria-hidden />
      ) : null}
    </span>
  );
}

/**
 * Multi-select services & bundles — same interaction shell as {@link CustomerSearchPopover}:
 * SearchInput + PopoverAnchor fused chrome, Command list with row padding, highlights, and green checks when selected.
 */
const CalendarServiceBundleMultiPicker: FC<{
  serviceOptions: { id: number; label: string }[];
  bundleOptions: { id: number; label: string }[];
  serviceIds: number[];
  bundleIds: number[];
  onApplyProductFilters: (next: {
    serviceIds: number[] | undefined;
    bundleIds: number[] | undefined;
  }) => void;
  disabled?: boolean;
}> = ({ serviceOptions, bundleOptions, serviceIds, bundleIds, onApplyProductFilters, disabled }) => {
  const [open, setOpen] = useState(false);
  const [listMounted, setListMounted] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (open) {
      setListMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setListMounted(false), 250);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const filteredServices = useMemo(
    () =>
      serviceOptions
        .map((o) => ({ kind: "service" as const, id: o.id, label: o.label }))
        .filter((o) => matchesLineSearch(o, search)),
    [serviceOptions, search],
  );

  const filteredBundles = useMemo(
    () =>
      bundleOptions
        .map((o) => ({ kind: "bundle" as const, id: o.id, label: o.label }))
        .filter((o) => matchesLineSearch(o, search)),
    [bundleOptions, search],
  );

  const nothingMatches =
    search.trim() !== "" && filteredServices.length === 0 && filteredBundles.length === 0;

  const highlightQuery = useMemo(() => normalizeLineSearch(search), [search]);

  const toggleLine = useCallback(
    (opt: LineOption) => {
      if (opt.kind === "service") {
        const nextSet = new Set(serviceIds);
        if (nextSet.has(opt.id)) nextSet.delete(opt.id);
        else nextSet.add(opt.id);
        const next = [...nextSet].sort((a, b) => a - b);
        onApplyProductFilters({
          serviceIds: next.length ? next : undefined,
          bundleIds: bundleIds.length ? bundleIds : undefined,
        });
      } else {
        const nextSet = new Set(bundleIds);
        if (nextSet.has(opt.id)) nextSet.delete(opt.id);
        else nextSet.add(opt.id);
        const next = [...nextSet].sort((a, b) => a - b);
        onApplyProductFilters({
          serviceIds: serviceIds.length ? serviceIds : undefined,
          bundleIds: next.length ? next : undefined,
        });
      }
    },
    [serviceIds, bundleIds, onApplyProductFilters],
  );

  const isLineSelected = (opt: LineOption) =>
    opt.kind === "service" ? serviceIds.includes(opt.id) : bundleIds.includes(opt.id);

  const hasSelection = serviceIds.length > 0 || bundleIds.length > 0;
  const showListShell = open && !disabled;
  const showListContainer = listMounted && !disabled;

  const lastServiceIdx = filteredServices.length - 1;
  const lastBundleIdx = filteredBundles.length - 1;

  return (
    <div ref={rootRef} className={cn(disabled && "pointer-events-none opacity-50")}>
      <div
        ref={anchorRef}
        className="block w-full min-w-0 cursor-text outline-none focus:outline-none"
        onClick={() => inputRef.current?.focus()}
      >
        <SearchInput
          ref={inputRef}
          placeholder="Search services & bundles…"
          value={search}
          onChange={setSearch}
          onFocus={() => setOpen(true)}
          aria-label="Filter by service and bundle"
          aria-expanded={open}
          className="w-full"
          inputClassName={cn(
            "border-border hover:border-border-strong focus-visible:border-border-strong focus-visible:ring-0",
            showListShell &&
              "!rounded-b-none !rounded-t-[22px] border-x border-t border-b-0 border-border-strong shadow-none dark:border-border-strong",
          )}
        />
      </div>
      {showListContainer ? (
        <div
          data-state={open ? "open" : "closed"}
          className={cn(
            "w-full max-h-[min(320px,50vh)] box-border -mt-px overflow-hidden border border-t-0 bg-surface p-0 shadow-none z-[20] rounded-t-none rounded-b-[22px] dark:bg-neutral-900",
            "add-appointment-popover-expand",
            "border-border-strong dark:border-border-strong",
          )}
        >
          <Command shouldFilter={false} className="w-full min-w-0 max-w-full">
            <CommandList className="max-h-[min(260px,40vh)] w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto">
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onApplyProductFilters({ serviceIds: undefined, bundleIds: undefined });
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 p-3",
                    !hasSelection && "bg-muted/40",
                    filteredServices.length === 0 &&
                      filteredBundles.length === 0 &&
                      "rounded-b-[18px]",
                  )}
                >
                  <LineItemSelectedCheck visible={!hasSelection} />
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground-1">
                    Any service or bundle
                  </span>
                </CommandItem>
              </CommandGroup>
              {filteredServices.length > 0 ? (
                <CommandGroup heading="Services">
                  {filteredServices.map((opt, index) => (
                    <CommandItem
                      key={`svc-${opt.id}`}
                      value={`svc-${opt.id}`}
                      onSelect={() => toggleLine(opt)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 p-3",
                        isLineSelected(opt) && "bg-muted/50",
                        index === lastServiceIdx && !filteredBundles.length && "rounded-b-[18px]",
                      )}
                    >
                      <LineItemSelectedCheck visible={isLineSelected(opt)} />
                      <div className="min-w-0 flex-1 text-sm font-medium text-foreground-1">
                        {highlightMatches(opt.label, highlightQuery)}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {filteredBundles.length > 0 ? (
                <CommandGroup heading="Bundles">
                  {filteredBundles.map((opt, index) => (
                    <CommandItem
                      key={`bnd-${opt.id}`}
                      value={`bnd-${opt.id}`}
                      onSelect={() => toggleLine(opt)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 p-3",
                        isLineSelected(opt) && "bg-muted/50",
                        index === lastBundleIdx && "rounded-b-[18px]",
                      )}
                    >
                      <LineItemSelectedCheck visible={isLineSelected(opt)} />
                      <div className="min-w-0 flex-1 text-sm font-medium text-foreground-1">
                        {highlightMatches(opt.label, highlightQuery)}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {nothingMatches ? (
                <CommandEmpty className="py-6 text-sm text-muted-foreground">
                  No matching service or bundle.
                </CommandEmpty>
              ) : null}
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
};

export type CalendarFiltersFieldsDraft = {
  value: CalendarDayFilters;
  onChange: (next: CalendarDayFilters) => void;
};

export type CalendarFiltersFieldsProps = {
  /** When set, edits are local until parent commits (Apply). Omit to bind directly to Redux. */
  draft?: CalendarFiltersFieldsDraft;
};

const MAX_VISIBLE_CATEGORIES = 6;

type CategoryChip = { id: number; name: string; color?: string };

function getDisplayColor(cat: Pick<CategoryChip, "name" | "color">): string {
  if (cat.color?.startsWith("#")) return cat.color;
  return getColorHex(cat.name || "");
}

/** Distinct categories from enabled services at the location (GET /calendar/location-context). */
function categoriesFromLocationServices(
  services: Array<{ category?: { id: number; name: string; color?: string } | null }>,
): CategoryChip[] {
  const map = new Map<number, CategoryChip>();
  for (const s of services) {
    const c = s.category;
    if (c == null || c.id == null) continue;
    if (!map.has(c.id)) {
      map.set(c.id, { id: c.id, name: c.name, color: c.color });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Calendar day-filter fields (service, bundle, status, booking source, categories).
 */
export const CalendarFiltersFields: FC<CalendarFiltersFieldsProps> = ({ draft }) => {
  const dispatch = useDispatch();
  const { t: servicesT } = useTranslation("services");
  const selectedLocationId = useSelector(getSelectedLocationId);
  const dayFiltersRedux = useSelector(getDayFilters);
  const dayFilters = draft?.value ?? dayFiltersRedux;
  const locationServices = useSelector(getLocationServices);
  const locationBundles = useSelector(getLocationBundles);
  const servicesLoading = useSelector(getLocationContextLoading);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const categoryChips = useMemo(
    () => categoriesFromLocationServices(locationServices),
    [locationServices],
  );

  const serviceOptions = useMemo(
    () => locationServices.map((s) => ({ id: s.serviceId, label: s.serviceName })),
    [locationServices],
  );

  const bundleOptions = useMemo(
    () => locationBundles.map((b) => ({ id: b.bundleId, label: b.bundleName })),
    [locationBundles],
  );

  /** Merge legacy scalars into arrays for display and toggling (persist as arrays from the picker). */
  const serviceIdsForPicker = useMemo(() => {
    const s = new Set<number>([...(dayFilters.serviceIds ?? [])]);
    if (dayFilters.serviceId != null) s.add(dayFilters.serviceId);
    return [...s].sort((a, b) => a - b);
  }, [dayFilters.serviceIds, dayFilters.serviceId]);

  const bundleIdsForPicker = useMemo(() => {
    const s = new Set<number>([...(dayFilters.bundleIds ?? [])]);
    if (dayFilters.bundleId != null) s.add(dayFilters.bundleId);
    return [...s].sort((a, b) => a - b);
  }, [dayFilters.bundleIds, dayFilters.bundleId]);

  const serviceBundleSelectionPill = useMemo(() => {
    const nSvc = serviceOptions.length;
    const nBnd = bundleOptions.length;
    const available = nSvc + nBnd;
    if (available === 0) return null;
    const selSvc = serviceIdsForPicker.length;
    const selBnd = bundleIdsForPicker.length;
    const selected = selSvc + selBnd;
    const svcIdsOk =
      nSvc === 0 ||
      (selSvc === nSvc && serviceIdsForPicker.every((id) => serviceOptions.some((o) => o.id === id)));
    const bndIdsOk =
      nBnd === 0 ||
      (selBnd === nBnd && bundleIdsForPicker.every((id) => bundleOptions.some((o) => o.id === id)));
    /** Default filter = no line-item restriction (same as “Any service or bundle”). */
    const noLineFilter = selected === 0;
    /** User ticked every service and every bundle in the list. */
    const everyOptionTicked = selected > 0 && svcIdsOk && bndIdsOk;
    const label =
      noLineFilter || everyOptionTicked ? "All selected" : `${selected} selected`;
    return (
      <div
        className="inline-flex max-w-[min(100%,12rem)] shrink-0 items-center justify-center rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground"
        aria-live="polite"
      >
        {label}
      </div>
    );
  }, [
    serviceOptions,
    bundleOptions,
    serviceIdsForPicker,
    bundleIdsForPicker,
  ]);

  const patchDay = useCallback(
    (next: CalendarDayFilters) => {
      if (draft) draft.onChange(next);
      else dispatch(setDayFiltersAction(next));
    },
    [dispatch, draft],
  );

  const selectedStatuses = useMemo(() => {
    if (dayFilters.statuses?.length) return dayFilters.statuses;
    if (dayFilters.status) return [dayFilters.status];
    return [];
  }, [dayFilters.statuses, dayFilters.status]);

  const selectedBookingSources = useMemo(
    () => dayFilters.bookingSources ?? [],
    [dayFilters.bookingSources],
  );

  const toggleStatus = useCallback(
    (value: string) => {
      const next = selectedStatuses.includes(value)
        ? selectedStatuses.filter((s) => s !== value)
        : [...selectedStatuses, value];
      patchDay({
        ...dayFilters,
        statuses: next.length ? next : undefined,
        status: undefined,
      });
    },
    [dayFilters, patchDay, selectedStatuses],
  );

  const clearAllStatuses = useCallback(() => {
    patchDay({
      ...dayFilters,
      statuses: undefined,
      status: undefined,
    });
  }, [dayFilters, patchDay]);

  const toggleBookingSource = useCallback(
    (value: AppointmentBookingSource) => {
      const next = selectedBookingSources.includes(value)
        ? selectedBookingSources.filter((s) => s !== value)
        : [...selectedBookingSources, value];
      patchDay({
        ...dayFilters,
        bookingSources: next.length ? next : undefined,
      });
    },
    [dayFilters, patchDay, selectedBookingSources],
  );

  const clearAllBookingSources = useCallback(() => {
    patchDay({
      ...dayFilters,
      bookingSources: undefined,
    });
  }, [dayFilters, patchDay]);

  const toggleCategory = useCallback(
    (categoryId: number) => {
      const current = dayFilters.categoryIds ?? [];
      const isSelected = current.includes(categoryId);
      const next = isSelected ? current.filter((id) => id !== categoryId) : [...current, categoryId];
      patchDay({
        ...dayFilters,
        categoryIds: next.length ? next : undefined,
      });
    },
    [dayFilters, patchDay],
  );

  return (
    <div className="flex flex-col">
      <div className="space-y-2">
        <div className={CALENDAR_FILTER_SECTION_TITLE}>{servicesT("filters.byStatus")}</div>
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter by appointment status"
        >
          <button
            type="button"
            onClick={clearAllStatuses}
            title="Any appointment status"
            aria-pressed={selectedStatuses.length === 0}
            className={cn(
              CALENDAR_FILTER_CHIP_ALL_BASE,
              selectedStatuses.length === 0
                ? "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900 hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900"
                : "border-border bg-surface-hover text-muted-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900",
            )}
          >
            <Tag
              className={cn(
                "size-3.5 shrink-0",
                selectedStatuses.length === 0
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-primary",
              )}
              aria-hidden
            />
            <span className={CALENDAR_FILTER_CHIP_LABEL}>Any status</span>
            {selectedStatuses.length === 0 ? <CalendarFilterPillCheckmark /> : null}
          </button>
          {STATUS_FILTER_ENTRIES.map((opt) => {
            const isSelected = selectedStatuses.includes(opt.value);
            const dotClass = getStatusFilterIndicatorDotClass(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleStatus(opt.value)}
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={isSelected}
                className={cn(
                  CALENDAR_FILTER_CHIP_ITEM_BASE,
                  "border-border bg-surface text-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900",
                  isSelected &&
                    "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900",
                )}
              >
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotClass)} aria-hidden />
                <span className={CALENDAR_FILTER_CHIP_LABEL}>{opt.label}</span>
                {isSelected ? <CalendarFilterPillCheckmark /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedLocationId ? (
        <div className={cn(CALENDAR_FILTER_DIVIDER_OUTER, CALENDAR_FILTER_SECTION_BREAK_MT)}>
          <div className={CALENDAR_FILTER_DIVIDER_GUTTER} role="presentation">
            <div className={CALENDAR_FILTER_DIVIDER_LINE} aria-hidden />
          </div>
          <div className="space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className={cn(CALENDAR_FILTER_SECTION_TITLE, "min-w-0 flex-1 truncate")}>
              {servicesT("filters.byServices")}
            </div>
            {serviceBundleSelectionPill}
          </div>
          <CalendarServiceBundleMultiPicker
            serviceOptions={serviceOptions}
            bundleOptions={bundleOptions}
            serviceIds={serviceIdsForPicker}
            bundleIds={bundleIdsForPicker}
            onApplyProductFilters={({ serviceIds: nextSvc, bundleIds: nextBnd }) => {
              patchDay({
                ...dayFilters,
                serviceIds: nextSvc,
                bundleIds: nextBnd,
                serviceId: undefined,
                bundleId: undefined,
              });
            }}
            disabled={servicesLoading}
          />
          </div>
        </div>
      ) : null}

      {selectedLocationId ? (
        <div className={cn(CALENDAR_FILTER_DIVIDER_OUTER, CALENDAR_FILTER_SECTION_BREAK_MT)}>
          <div className={CALENDAR_FILTER_DIVIDER_GUTTER} role="presentation">
            <div className={CALENDAR_FILTER_DIVIDER_LINE} aria-hidden />
          </div>
          <div className="space-y-2">
          <div className={CALENDAR_FILTER_SECTION_TITLE}>{servicesT("filters.byCategory")}</div>
          {categoryChips.length === 0 ? (
            <p className="text-xs text-muted-foreground">{servicesT("filters.noCategories")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(showAllCategories
                ? categoryChips
                : categoryChips.slice(0, MAX_VISIBLE_CATEGORIES)
              ).map((category) => {
                const isSelected = (dayFilters.categoryIds ?? []).includes(category.id);
                const bgColor = getDisplayColor(category);
                const textColor = getReadableTextColor(bgColor);
                return (
                  <Button
                    key={category.id}
                    type="button"
                    variant="outline"
                    rounded="full"
                    className={cn(
                      "h-auto px-5 py-1.5 gap-2 relative !transition-none text-xs font-medium",
                      isSelected
                        ? "border-neutral-500 text-neutral-900 dark:text-neutral-900 shadow-xs focus-visible:!border-neutral-500"
                        : "border-border opacity-100",
                      "hover:!border-border",
                      isSelected && "hover:!border-neutral-500",
                    )}
                    onClick={() => toggleCategory(category.id)}
                    style={{
                      backgroundColor: bgColor,
                      color: isSelected ? undefined : textColor,
                    }}
                  >
                    {isSelected ? (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-400 dark:bg-success shadow-sm flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-foreground-inverse"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : null}
                    <span className="truncate max-w-[130px]">{category.name}</span>
                  </Button>
                );
              })}

              {categoryChips.length > MAX_VISIBLE_CATEGORIES && !showAllCategories ? (
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={() => setShowAllCategories(true)}
                  className="h-auto px-3 py-1.5 gap-1.5 border-dashed"
                >
                  {servicesT("addService.form.category.showMore", {
                    count: categoryChips.length - MAX_VISIBLE_CATEGORIES,
                  })}
                </Button>
              ) : null}

              {categoryChips.length > MAX_VISIBLE_CATEGORIES && showAllCategories ? (
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={() => setShowAllCategories(false)}
                  className="h-auto px-3 py-1.5 gap-1.5 border-dashed"
                >
                  {servicesT("addService.form.category.showLess")}
                </Button>
              ) : null}
            </div>
          )}
          </div>
        </div>
      ) : null}

      <div className={cn(CALENDAR_FILTER_DIVIDER_OUTER, CALENDAR_FILTER_SECTION_BREAK_MT)}>
        <div className={CALENDAR_FILTER_DIVIDER_GUTTER} role="presentation">
          <div className={CALENDAR_FILTER_DIVIDER_LINE} aria-hidden />
        </div>
        <div className="space-y-2">
        <div className={CALENDAR_FILTER_SECTION_TITLE}>{servicesT("filters.bySource")}</div>
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter by booking source"
        >
          <button
            type="button"
            onClick={clearAllBookingSources}
            title="Any source"
            aria-pressed={selectedBookingSources.length === 0}
            className={cn(
              CALENDAR_FILTER_CHIP_ALL_BASE,
              selectedBookingSources.length === 0
                ? "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900 hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900"
                : "border-border bg-surface-hover text-muted-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900",
            )}
          >
            <Globe
              className={cn(
                "size-3.5 shrink-0",
                selectedBookingSources.length === 0
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-primary",
              )}
              aria-hidden
            />
            <span className={CALENDAR_FILTER_CHIP_LABEL}>Any source</span>
            {selectedBookingSources.length === 0 ? <CalendarFilterPillCheckmark /> : null}
          </button>
          {BOOKING_SOURCE_OPTIONS.map((opt) => {
            const isAllSources = selectedBookingSources.length === 0;
            const isSelected = !isAllSources && selectedBookingSources.includes(opt.value);
            const Icon = opt.Icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleBookingSource(opt.value)}
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={isSelected}
                className={cn(
                  CALENDAR_FILTER_CHIP_ITEM_BASE,
                  "border-border bg-surface text-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900",
                  isSelected &&
                    "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900",
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                  )}
                  aria-hidden
                />
                <span className={CALENDAR_FILTER_CHIP_LABEL}>{opt.label}</span>
                {isSelected ? <CalendarFilterPillCheckmark /> : null}
              </button>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};
