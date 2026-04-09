import { type FC } from "react";
import { useTranslation } from "react-i18next";
import type { SlimAppointment, CalendarStaffMember } from "../../../shared/types/calendar.ts";
import {
  formatTimeRange,
  formatDurationHuman,
  getStatusBadge,
  getBookedViaLabel,
  getNoCustomerDisplayLabel,
} from "./utils.tsx";
import { ShieldAlert, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/components/ui/avatar.tsx";
import { cn } from "../../../shared/lib/utils";
import { calendarPreferences } from "../calendarPreferences.ts";
import {
  getAppointmentBlockColors,
  getGroupDotColor,
  type AppointmentBlockColorPair,
  getStaffAvatarColor,
} from "../colors.ts";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Aligned with `CalendarStaffFilter` (filters popover → by staff). */
function staffInitials(member: CalendarStaffMember): string {
  const a = member.firstName?.trim()?.[0] ?? "";
  const b = member.lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function staffAvatarColorKey(member: CalendarStaffMember): string {
    return `${member.id}-${member.firstName ?? ""}-${member.lastName ?? ""}`;
}


/** List row grid: customer column may stack notes below name; time-onward tracks align with BlockCard. */
export const CALENDAR_LIST_ROW_GRID_TEMPLATE =
  "minmax(7.2rem, 3fr) minmax(6rem, 3fr) minmax(7rem, 3fr) minmax(7rem, 3fr) minmax(6.5rem, 2.5fr) minmax(6.75rem, 0.85fr) 1rem";

export const StaffAvatarCluster: FC<{ staffIds: number[]; staff: CalendarStaffMember[]; maxVisible?: number; staffColorMap?: Map<string, AppointmentBlockColorPair> | null }> = ({
  staffIds, staff, maxVisible = 2, staffColorMap,
}) => {
  const resolved = staffIds
    .map((id) => staff.find((s) => s.id === id))
    .filter((m): m is CalendarStaffMember => m != null);

  const visible = resolved.slice(0, maxVisible);
  const overflowCount = resolved.length - maxVisible;

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1">
      {visible.map((member) => (
        <Avatar
          key={member.id}
          className="h-6 w-6 shrink-0 border border-border ring-1 ring-white dark:ring-gray-800 transition-none"
          title={`${member.firstName} ${member.lastName}`}
        >
          {member.profileImage ? (
            <AvatarImage src={member.profileImage} alt="" className="object-cover" />
          ) : null}
          <AvatarFallback
            className="text-[10px] font-semibold leading-none text-foreground-1"
            style={{ backgroundColor: getStaffAvatarColor(member.id, staffAvatarColorKey(member), staffColorMap) }}
          >
            {staffInitials(member)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflowCount > 0 && (
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-1 ring-white dark:ring-gray-800">
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SlimAppointmentCard
// ─────────────────────────────────────────────────────────────

interface SlimAppointmentCardProps {
  appointment: SlimAppointment;
  /** From calendar location context (`getLocationStaff`); staff user ids match `id`. */
  locationStaff: CalendarStaffMember[];
  groupSize?: number;
  onClick: () => void;
  /** Built from visible appointments for this list (service/staff coding). */
  colorMap?: Map<string, AppointmentBlockColorPair> | null;
}

export const SlimAppointmentCard: FC<SlimAppointmentCardProps> = ({
  appointment,
  locationStaff,
  groupSize,
  onClick,
  colorMap,
}) => {
  const { t } = useTranslation("calendar");
  const timeRange = formatTimeRange(appointment.scheduledAt, appointment.endsAt);
  const colorCoding = calendarPreferences.getColorCoding();
  const { backgroundColor } = getAppointmentBlockColors(appointment, colorCoding, colorMap);

  const isGroupSegment = !!appointment.bookingGroupId && (groupSize ?? 1) > 1;
  const order = appointment.bookingGroupOrder ?? 1;
  const duration = formatDurationHuman(appointment.duration);

  const viaLabel = getBookedViaLabel(appointment.bookingSource, t);

  const resolvedStaff = appointment.staffUserIds
    .map((id) => locationStaff.find((s) => s.id === id))
    .filter((s): s is CalendarStaffMember => s != null);
  const staffLabel = resolvedStaff.length > 0
    ? resolvedStaff.map((s) => `${s.firstName} ${s.lastName}`).join(', ')
    : t("page.common.unassigned");

  const hasCustomerName = !!appointment.customerName;
  const displayName = appointment.customerName ?? getNoCustomerDisplayLabel(t);

  return (
    <div
      className={cn(
        "relative grid items-center gap-x-3 rounded-xl border border-border bg-white shadow-sm cursor-pointer overflow-hidden",
        "transition-all duration-200 hover:border-border-strong hover:shadow-md",
        "dark:bg-neutral-900/30 dark:bg-card",
        "w-full min-w-0 pl-3 pr-3 py-2.5",
      )}
      style={{
        borderLeftWidth: 4,
        borderLeftStyle: "solid",
        borderLeftColor: backgroundColor,
        gridTemplateColumns: CALENDAR_LIST_ROW_GRID_TEMPLATE,
      }}
      onClick={onClick}
    >
      {/* ── Group pill + customer (title) + optional notes below ── */}
      <div className="flex min-w-0 flex-col justify-center gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {isGroupSegment && (
            <span
              className={cn(
                "inline-flex items-center gap-1 shrink-0 rounded-full border border-border",
                "bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-foreground-3",
              )}
              title={`Booking ${order} of ${groupSize}`}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0 ring-1 ring-background"
                style={{ backgroundColor: getGroupDotColor(appointment.bookingGroupId!) }}
              />
              {order}/{groupSize}
            </span>
          )}
          <span
            className={cn(
              "min-w-0 text-sm font-semibold truncate leading-tight",
              hasCustomerName ? "capitalize text-foreground-1" : "text-muted-foreground",
            )}
          >
            {displayName}
          </span>
        </div>
        {appointment.notes?.trim() ? (
          <span
            className="min-w-0 truncate text-[11px] leading-snug text-muted-foreground"
            title={appointment.notes.trim()}
          >
            {appointment.notes.trim()}
          </span>
        ) : null}
      </div>

      {/* ── Service ── */}
      <span className="min-w-0 overflow-hidden border-l border-border pl-3 text-xs text-foreground-3 text-ellipsis whitespace-nowrap">
        {appointment.bookedItemName}
      </span>

      {/* ── Time + duration ── */}
      <div className="flex min-w-0 items-center gap-0.5 overflow-hidden border-l border-border pl-3 text-xs font-medium text-foreground-1 tabular-nums">
        <span className="truncate">{timeRange}</span>
        <span className="shrink-0 text-[11px] font-normal tabular-nums leading-none text-foreground-3">
          ({duration})
        </span>
      </div>

      {/* ── Staff ── */}
      <div className="flex min-w-0 items-center gap-2 border-l border-border pl-3">
        {appointment.staffUserIds.length > 0 ? (
          <StaffAvatarCluster
            staffIds={appointment.staffUserIds}
            staff={locationStaff}
            maxVisible={2}
            staffColorMap={colorCoding === 'staff' ? colorMap : null}
          />
        ) : (
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span
          className={cn(
            "min-w-0 truncate text-xs",
            appointment.isUnassigned ? "text-orange-600 font-medium" : "text-foreground-3",
          )}
        >
          {staffLabel}
        </span>
      </div>

      {/* ── Booked via ── */}
      <span className="min-w-0 overflow-hidden border-l border-border pl-3 text-xs text-foreground-3 text-ellipsis whitespace-nowrap">
        {viaLabel}
      </span>

      {/* ── Status ── */}
      <div className="flex min-w-0 justify-end border-l border-border pl-3">
        {getStatusBadge(appointment.status, t)}
      </div>

      {/* ── Override (fixed column so status column stays aligned) ── */}
      <div className="flex min-w-0 justify-center border-l border-border pl-2">
        {appointment.overrideReason ? (
          <span
            className="inline-flex shrink-0"
            title={`Override: ${appointment.overrideReason}`}
            aria-label={`Override: ${appointment.overrideReason}`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
};
