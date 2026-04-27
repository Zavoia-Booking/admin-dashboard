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
  formatClockAndMeridiem,
  formatDurationCompact,
  getStatusLabelText,
  getStatusLabelClass,
  getStatusDotClass,
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
  const { stripeColor } = getAppointmentBlockColors(appointment, colorCoding, colorMap);

  const { clock, meridiem } = formatClockAndMeridiem(appointment.scheduledAt, timezone);
  const durationCompact = formatDurationCompact(appointment.duration);
  const metaLabel = meridiem ? `${meridiem} · ${durationCompact}` : durationCompact;

  const isGroupSegment = !!appointment.bookingGroupId && (groupSize ?? 1) > 1;
  const order = appointment.bookingGroupOrder ?? 1;

  const viaLabel = getBookedViaLabel(appointment.bookingSource, t);
  const statusLabel = getStatusLabelText(appointment.status, t);

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
      aria-label={`${statusLabel} ${appointment.bookedItemName} at ${clock}${meridiem ? ` ${meridiem}` : ''}`}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-white dark:bg-neutral-900/30 dark:bg-card",
        "shadow-sm active:scale-[0.98] transition-all duration-150",
        "overflow-hidden",
      )}
      style={{
        borderLeftWidth: 4,
        borderLeftStyle: "solid",
        borderLeftColor: stripeColor,
      }}
    >
      <div className="grid grid-cols-[auto_1fr] gap-3 px-3 py-3 items-start">
        {/* Left column: clock + meridiem/duration */}
        <div className="flex flex-col items-start min-w-[56px]">
          <span className="text-[17px] font-bold leading-none tabular-nums text-foreground-1">
            {clock}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-3">
            {metaLabel}
          </span>
        </div>

        {/* Right column: status row, service, customer, notes, staff */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Status dot row */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusDotClass(appointment.status))} aria-hidden />
            <span className={cn("text-[10px] font-bold uppercase tracking-wide truncate", getStatusLabelClass(appointment.status))}>
              {statusLabel}
            </span>
            <span className="ml-auto shrink-0 text-[10px] font-medium text-foreground-3">
              {viaLabel}
            </span>
          </div>

          {/* Service name (with optional group pill) */}
          <div className="flex items-center gap-2 min-w-0">
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
            <span className="flex-1 min-w-0 text-sm font-semibold text-foreground-1 truncate leading-tight">
              {appointment.bookedItemName}
            </span>
          </div>

          {/* Customer name */}
          <span
            className={cn(
              "text-sm truncate leading-tight",
              hasCustomerName ? "capitalize text-foreground-1" : "text-muted-foreground italic",
            )}
          >
            {customerName}
          </span>

          {/* Notes (subtle, single-line with ellipsis) */}
          {notes && (
            <span
              className="text-[11px] leading-snug text-muted-foreground truncate"
              title={notes}
            >
              {notes}
            </span>
          )}

          {/* Staff row */}
          <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
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
                appointment.isUnassigned ? "text-primary font-medium" : "text-foreground-3",
              )}
            >
              {staffLabel}
            </span>
            {appointment.overrideReason && (
              <span
                className="inline-flex shrink-0 ml-auto"
                title={`Override: ${appointment.overrideReason}`}
                aria-label={`Override: ${appointment.overrideReason}`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
