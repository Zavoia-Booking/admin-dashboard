import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, User } from "lucide-react";
import type { SlimAppointment, CalendarStaffMember } from "../../../../shared/types/calendar";
import {
  getAppointmentBlockColors,
  getGroupDotColor,
  type AppointmentBlockColorPair,
} from "../../colors";
import { calendarPreferences } from "../../calendarPreferences";
import {
  formatTimeRange,
  formatDurationHuman,
  getStatusBadge,
  getBookedViaLabel,
  getNoCustomerDisplayLabel,
} from "../utils";
import { StaffAvatarCluster } from "../SlimAppointmentCard";
import { cn } from "../../../../shared/lib/utils";

/**
 * Mobile list card for an appointment — input-compatible with desktop's SlimAppointmentCard.
 * Logic (staff resolution, group detection, colors) is identical; only the visual layout differs.
 */
interface MobileDayEventCardProps {
  appointment: SlimAppointment;
  locationStaff: CalendarStaffMember[];
  groupSize?: number;
  colorMap?: Map<string, AppointmentBlockColorPair> | null;
  timezone?: string;
  onClick: () => void;
}

export const MobileDayEventCard: FC<MobileDayEventCardProps> = ({
  appointment,
  locationStaff,
  groupSize,
  colorMap,
  timezone,
  onClick,
}) => {
  const { t } = useTranslation("calendar");
  const colorCoding = calendarPreferences.getColorCoding();
  const { backgroundColor } = getAppointmentBlockColors(appointment, colorCoding, colorMap);

  const timeRange = formatTimeRange(appointment.scheduledAt, appointment.endsAt, timezone);
  const duration = formatDurationHuman(appointment.duration);

  const isGroupSegment = !!appointment.bookingGroupId && (groupSize ?? 1) > 1;
  const order = appointment.bookingGroupOrder ?? 1;

  const viaLabel = getBookedViaLabel(appointment.bookingSource, t);

  const resolvedStaff = appointment.staffUserIds
    .map((id) => locationStaff.find((s) => s.id === id))
    .filter((s): s is CalendarStaffMember => s != null);
  const staffLabel = resolvedStaff.length > 0
    ? resolvedStaff.map((s) => `${s.firstName} ${s.lastName}`).join(", ")
    : t("page.common.unassigned");
  const hasAssignedStaff = appointment.staffUserIds.length > 0;

  const hasCustomerName = !!appointment.customerName;
  const customerName = appointment.customerName ?? getNoCustomerDisplayLabel(t);

  const notes = appointment.notes?.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-white dark:bg-neutral-900/30 dark:bg-card",
        "shadow-sm active:scale-[0.98] transition-all duration-150",
        "overflow-hidden",
      )}
      style={{
        borderLeftWidth: 4,
        borderLeftStyle: "solid",
        borderLeftColor: backgroundColor,
      }}
    >
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        {/* Row 1: time + duration (left) · status badge + override (right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-xs font-medium text-foreground-1 tabular-nums">{timeRange}</span>
            <span className="text-[11px] text-foreground-3 tabular-nums shrink-0">({duration})</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {getStatusBadge(appointment.status, t)}
            {appointment.overrideReason && (
              <span
                className="inline-flex shrink-0"
                title={`Override: ${appointment.overrideReason}`}
                aria-label={`Override: ${appointment.overrideReason}`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              </span>
            )}
          </div>
        </div>

        {/* Row 2: customer name + optional group pill · notes below */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {isGroupSegment && (
              <span
                className="inline-flex items-center gap-1 shrink-0 rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-foreground-3"
                title={`Booking ${order} of ${groupSize}`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0 ring-1 ring-background"
                  style={{ backgroundColor: getGroupDotColor(appointment.bookingGroupId!) }}
                  aria-hidden
                />
                {order}/{groupSize}
              </span>
            )}
            <span
              className={cn(
                "text-sm font-semibold truncate leading-tight",
                hasCustomerName ? "capitalize text-foreground-1" : "text-muted-foreground",
              )}
            >
              {customerName}
            </span>
          </div>
          {notes && (
            <span
              className="text-[11px] leading-snug text-muted-foreground truncate"
              title={notes}
            >
              {notes}
            </span>
          )}
        </div>

        {/* Row 3: service name */}
        <span className="text-xs text-foreground-3 truncate">{appointment.bookedItemName}</span>

        {/* Row 4: staff (left) · booked via (right) */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {hasAssignedStaff ? (
              <StaffAvatarCluster
                staffIds={appointment.staffUserIds}
                staff={locationStaff}
                maxVisible={2}
                staffColorMap={colorCoding === "staff" ? colorMap : null}
              />
            ) : (
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span
              className={cn(
                "text-xs truncate min-w-0",
                appointment.isUnassigned ? "text-orange-600 font-medium" : "text-foreground-3",
              )}
            >
              {staffLabel}
            </span>
          </div>
          <span className="text-[11px] text-foreground-3 shrink-0 truncate max-w-[50%]">
            {viaLabel}
          </span>
        </div>
      </div>
    </button>
  );
};
