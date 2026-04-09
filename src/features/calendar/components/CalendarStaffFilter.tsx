import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getLocationStaff, getStaffFilter, getDayFilters } from "../selectors.ts";
import { setStaffFilter, setDayFiltersAction } from "../actions.ts";
import { type CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/components/ui/avatar.tsx";
import { cn } from "../../../shared/lib/utils";
import { dayFiltersWithoutUnassignedOnly } from "../calendarFilters.ts";
import { getAvatarBgColor } from "../../setupWizard/components/StepTeam";
import { CalendarFilterPillCheckmark } from "./CalendarFilterPillCheckmark.tsx";
import {
  CALENDAR_FILTER_SECTION_TITLE,
  CALENDAR_FILTER_CHIP_ALL_BASE,
  CALENDAR_FILTER_CHIP_ITEM_BASE,
  CALENDAR_FILTER_CHIP_LABEL,
} from "./calendarSidebarStyles.ts";

export type CalendarStaffFilterProps = {
  /** When false, omit the section label (e.g. header popover supplies its own hierarchy). */
  showLabel?: boolean;
  /** @deprecated No longer used (avatars are inline). Kept for API compatibility. */
  contentClassName?: string;
  /** Local draft mode (Apply in parent commits to Redux). */
  draft?: {
    staffIds: number[];
    onStaffIdsChange: (nextIds: number[]) => void;
  };
};

function staffInitials(member: CalendarStaffMember): string {
  const a = member.firstName?.trim()?.[0] ?? "";
  const b = member.lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

/** Same stable key pattern as calendar staff avatars elsewhere (no email on `CalendarStaffMember`). */
function staffAvatarColorKey(member: CalendarStaffMember): string {
  return `${member.id}-${member.firstName ?? ""}-${member.lastName ?? ""}`;
}

function staffFullName(member: CalendarStaffMember): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

/**
 * Multi-select staff filter for the calendar (Redux: staffFilter + dayFilters.staffUserIds).
 * Pill chips: small avatar + name (no dropdown).
 */
export const CalendarStaffFilter: FC<CalendarStaffFilterProps> = ({
  showLabel = true,
  contentClassName: _contentClassName,
  draft,
}) => {
  const dispatch = useDispatch();
  const { t: servicesT } = useTranslation("services");
  const { t } = useTranslation("calendar");
  const staff: CalendarStaffMember[] = useSelector(getLocationStaff);
  const staffFilterRaw: number[] = useSelector(getStaffFilter);
  const dayFiltersRedux = useSelector(getDayFilters);

  const staffFilterFromRedux = useMemo(
    () => staffFilterRaw.filter((id) => staff.some((s) => s.id === id)),
    [staffFilterRaw, staff],
  );

  const staffFilter = draft
    ? draft.staffIds.filter((id) => staff.some((s) => s.id === id))
    : staffFilterFromRedux;

  const isSingleStaffLocation = staff.length === 1;
  const isAllSelected = !isSingleStaffLocation && staffFilter.length === 0;

  const syncStaffFilterToDayPayload = useCallback(
    (visibleStaffIds: number[]) => {
      const allSelected =
        visibleStaffIds.length === 0 || visibleStaffIds.length === staff.length;
      dispatch(
        setDayFiltersAction({
          ...dayFiltersWithoutUnassignedOnly(dayFiltersRedux),
          staffUserIds: allSelected ? undefined : visibleStaffIds,
          staffUserId: undefined,
        }),
      );
    },
    [dispatch, dayFiltersRedux, staff.length],
  );

  const handleToggleStaff = useCallback(
    (staffId: number) => {
      const filterAll = staffFilter.length === 0;
      if (draft) {
        if (staffId === -1) {
          draft.onStaffIdsChange([]);
          return;
        }
        if (staff.length === 1 && staffId === staff[0].id && staffFilter.includes(staffId)) {
          return;
        }
        if (filterAll) {
          draft.onStaffIdsChange([staffId]);
        } else {
          const isSelected = staffFilter.includes(staffId);
          if (isSelected) {
            const next = staffFilter.filter((id) => id !== staffId);
            draft.onStaffIdsChange(next.length === 0 ? [] : next);
          } else {
            const next = [...staffFilter, staffId];
            draft.onStaffIdsChange(next);
          }
        }
        return;
      }
      if (staffId === -1) {
        dispatch(setStaffFilter([]));
        syncStaffFilterToDayPayload([]);
        return;
      }
      if (staff.length === 1 && staffId === staff[0].id && staffFilter.includes(staffId)) {
        return;
      }
      if (filterAll) {
        dispatch(setStaffFilter([staffId]));
        syncStaffFilterToDayPayload([staffId]);
      } else {
        const isSelected = staffFilter.includes(staffId);
        if (isSelected) {
          const next = staffFilter.filter((id) => id !== staffId);
          const nextVisible = next.length === 0 ? [] : next;
          dispatch(setStaffFilter(nextVisible));
          syncStaffFilterToDayPayload(nextVisible);
        } else {
          const next = [...staffFilter, staffId];
          dispatch(setStaffFilter(next));
          syncStaffFilterToDayPayload(next);
        }
      }
    },
    [dispatch, draft, staff, staffFilter, syncStaffFilterToDayPayload],
  );

  if (staff.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-2">
      {showLabel ? (
        <div className={CALENDAR_FILTER_SECTION_TITLE}>{servicesT("filters.byStaff")}</div>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by staff member">
        {!isSingleStaffLocation ? (
          <button
            type="button"
            onClick={() => handleToggleStaff(-1)}
            title={t("page.filters.showAllTeamMembers")}
            aria-pressed={isAllSelected}
            className={cn(
              CALENDAR_FILTER_CHIP_ALL_BASE,
              isAllSelected
                ? "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900 hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900"
                : "border-border bg-surface-hover text-muted-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900",
            )}
          >
            <Users
              className={cn(
                "size-3.5 shrink-0",
                isAllSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary",
              )}
              aria-hidden
            />
            <span className={CALENDAR_FILTER_CHIP_LABEL}>{t("page.filters.allStaff")}</span>
            {isAllSelected ? <CalendarFilterPillCheckmark /> : null}
          </button>
        ) : null}

        {staff.map((member) => {
          const selected =
            isSingleStaffLocation ||
            (!isAllSelected && staffFilter.includes(member.id));
          const name = staffFullName(member);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => handleToggleStaff(member.id)}
              title={name}
              aria-label={name}
              aria-pressed={!isAllSelected && selected}
              className={cn(
                CALENDAR_FILTER_CHIP_ITEM_BASE,
                "border-border bg-surface text-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900",
                selected &&
                "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900",
              )}
            >
              <Avatar className="size-6 shrink-0 border border-border transition-none">
                {member.profileImage ? (
                  <AvatarImage src={member.profileImage} alt="" />
                ) : null}
                <AvatarFallback
                  className="text-[10px] font-semibold leading-none text-foreground-1"
                  style={{ backgroundColor: getAvatarBgColor(staffAvatarColorKey(member)) }}
                >
                  {staffInitials(member)}
                </AvatarFallback>
              </Avatar>
              <span className={CALENDAR_FILTER_CHIP_LABEL}>{name}</span>
              {selected ? <CalendarFilterPillCheckmark /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
