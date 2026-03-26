import { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Filter, RotateCcw } from "lucide-react";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../shared/components/ui/popover.tsx";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "../../../shared/components/ui/drawer.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
  getActiveCalendarFiltersCount,
  getDayFilters,
  getLocationStaff,
  getStaffFilter,
} from "../selectors.ts";
import { setDayFiltersAction, setStaffFilter } from "../actions.ts";
import { CalendarStaffFilter } from "./CalendarStaffFilter.tsx";
import { CalendarFiltersFields } from "./CalendarFiltersFields.tsx";
import { cn } from "../../../shared/lib/utils";
import {
  CALENDAR_FILTER_DIVIDER_GUTTER,
  CALENDAR_FILTER_DIVIDER_LINE,
  CALENDAR_FILTER_DIVIDER_OUTER,
} from "./calendarSidebarStyles.ts";
import type { CalendarDayFilters } from "../../../shared/types/calendar.ts";
import {
    areCalendarFiltersActive,
    areCalendarHeaderFilterDraftsEqual,
    dayFiltersWithoutUnassignedOnly,
} from "../calendarFilters.ts";

const filterPillClass = (isOpen: boolean) =>
  cn(
    "relative inline-flex items-center justify-center h-auto px-3 py-1.5 gap-1.5 rounded-full border border-border",
    "transition-[colors,box-shadow,background-color,color] duration-200 ease-out cursor-pointer",
    isOpen
      ? "bg-info-100 border-border-strong text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1 dark:border-border-strong"
      : "bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong dark:bg-transparent dark:text-foreground-1 dark:hover:bg-neutral-900 dark:border-border-strong",
  );

/**
 * Header filters entry: services-style pill + Popover (desktop) or Drawer (mobile).
 * Draft edits commit on Apply; Clear all (when any draft filter is active) resets Redux and draft but keeps the menu open.
 */
export const CalendarHeaderFilters: FC = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const activeCount = useSelector(getActiveCalendarFiltersCount);
  const appliedDayFilters = useSelector(getDayFilters);
  const appliedStaffFilter = useSelector(getStaffFilter);
  const staffList = useSelector(getLocationStaff);

  const [open, setOpen] = useState(false);
  const [draftDay, setDraftDay] = useState<CalendarDayFilters>({});
  const [draftStaff, setDraftStaff] = useState<number[]>([]);
  const [baselineDay, setBaselineDay] = useState<CalendarDayFilters>({});
  const [baselineStaff, setBaselineStaff] = useState<number[]>([]);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const initialStaff = (() => {
        const fromDay = appliedDayFilters.staffUserIds?.filter((id) =>
          staffList.some((s) => s.id === id),
        );
        if (fromDay?.length) return fromDay;
        const fromRedux = appliedStaffFilter.filter((id) => staffList.some((s) => s.id === id));
        if (fromRedux.length > 0) return fromRedux;
        if (staffList.length === 1) return [staffList[0].id];
        return [];
      })();
      const initialDay = { ...appliedDayFilters };
      setDraftDay(initialDay);
      setDraftStaff(initialStaff);
      setBaselineDay({ ...initialDay });
      setBaselineStaff([...initialStaff]);
    }
    wasOpenRef.current = open;
  }, [open, appliedDayFilters, appliedStaffFilter, staffList]);

    const handleStaffDraftChange = useCallback(
        (nextIds: number[]) => {
            const allSelectedForApi =
                nextIds.length === 0 || nextIds.length === staffList.length;
            setDraftStaff(nextIds);
            setDraftDay((prev) => ({
                ...dayFiltersWithoutUnassignedOnly(prev),
                staffUserIds: allSelectedForApi ? undefined : nextIds,
                staffUserId: undefined,
            }));
        },
        [staffList],
    );

  const handleApply = useCallback(() => {
    const allSelected = draftStaff.length === 0 || draftStaff.length === staffList.length;
    dispatch(setStaffFilter(draftStaff));
    dispatch(
      setDayFiltersAction({
        ...dayFiltersWithoutUnassignedOnly(draftDay),
        staffUserIds: allSelected ? undefined : draftStaff,
        staffUserId: undefined,
      }),
    );
    setOpen(false);
  }, [dispatch, draftDay, draftStaff, staffList.length]);

  const hasDraftFiltersActive = useMemo(
    () =>
      areCalendarFiltersActive(
        draftDay,
        draftStaff,
        staffList.map((s) => s.id),
      ),
    [draftDay, draftStaff, staffList],
  );

  const hasDraftChanges = useMemo(
    () =>
      !areCalendarHeaderFilterDraftsEqual(baselineDay, baselineStaff, draftDay, draftStaff),
    [baselineDay, baselineStaff, draftDay, draftStaff],
  );

  const handleClearAll = useCallback(() => {
    const resetDraftOnly = () => {
      if (staffList.length === 1) {
        setDraftDay({});
        setDraftStaff([staffList[0].id]);
        return;
      }
      setDraftDay({});
      setDraftStaff([]);
    };

    // If there are un-applied edits in the popover, clear only local draft state.
    if (hasDraftChanges) {
      resetDraftOnly();
      return;
    }

    dispatch(setDayFiltersAction({}));
    if (staffList.length === 1) {
      const id = staffList[0].id;
      dispatch(setStaffFilter([id]));
      setDraftDay({});
      setDraftStaff([id]);
      setBaselineDay({});
      setBaselineStaff([id]);
      return;
    }
    dispatch(setStaffFilter([]));
    setDraftDay({});
    setDraftStaff([]);
    setBaselineDay({});
    setBaselineStaff([]);
  }, [dispatch, hasDraftChanges, staffList]);

  const trigger = (
    <button
      type="button"
      className={filterPillClass(open)}
      aria-label="Open calendar filters"
    >
      <Filter className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
      <span className="text-xs font-medium">Filters</span>
      {activeCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground shadow">
          {activeCount}
        </span>
      ) : null}
    </button>
  );

  const filtersMenuScrollable = (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <span className="min-w-0 shrink text-sm font-semibold text-foreground-1">Filters</span>
        <div className="flex shrink-0 items-center justify-end gap-4">
          {hasDraftFiltersActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              className="group !h-9 !min-h-0 gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              onClick={handleClearAll}
            >
              <RotateCcw
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden
              />
              Clear all
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            rounded="full"
            disabled={!hasDraftChanges}
            className="!h-9 !min-h-0 shrink-0 px-6 text-xs font-semibold transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </header>
      <div className="space-y-4 px-4 pb-4 pt-4">
        {staffList.length > 0 ? (
          <>
            <CalendarStaffFilter
              showLabel
              draft={{
                staffIds: draftStaff,
                onStaffIdsChange: handleStaffDraftChange,
              }}
            />
            <div className={CALENDAR_FILTER_DIVIDER_OUTER} role="presentation">
              <div className={CALENDAR_FILTER_DIVIDER_GUTTER}>
                <div className={CALENDAR_FILTER_DIVIDER_LINE} aria-hidden />
              </div>
            </div>
          </>
        ) : null}
        <CalendarFiltersFields
          draft={{
            value: draftDay,
            onChange: setDraftDay,
          }}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            document.documentElement.style.scrollBehavior = "auto";
          } else {
            setTimeout(() => {
              document.documentElement.style.scrollBehavior = "smooth";
            }, 100);
          }
        }}
      >
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="outline-none !z-[80]" overlayClassName="!z-[75]">
          <DrawerTitle className="sr-only">Calendar filters</DrawerTitle>
          <DrawerDescription className="sr-only">
            Narrow the calendar by staff, status, service, and more. Apply to update the
            calendar.
          </DrawerDescription>
          <div className="flex max-h-[80vh] flex-col overflow-hidden p-0">{filtersMenuScrollable}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex w-[440px] min-h-[30rem] max-h-[min(38rem,78vh)] flex-col overflow-hidden border border-border bg-surface p-0 shadow-md rounded-xl !z-[80]"
      >
        {filtersMenuScrollable}
      </PopoverContent>
    </Popover>
  );
};
