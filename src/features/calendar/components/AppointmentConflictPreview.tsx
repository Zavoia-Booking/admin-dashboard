import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { PersonAvatar } from "../../../shared/components/common/PersonAvatar.tsx";
import { modalHelperSmall } from "../../../shared/components/ui/modal-tokens.ts";
import { cn } from "../../../shared/lib/utils.ts";
import type { BlockConflictAppointment } from "../../../shared/types/calendar.ts";
import { formatDateInTimezone, getCalendarLocale } from "../timezone.ts";
import { formatTime, getNoCustomerDisplayLabel } from "./utils.tsx";

interface AppointmentConflictPreviewProps {
  /** The soonest affected appointment. */
  appointment: BlockConflictAppointment | null;
  /** How many are affected in total; the rest show as "and N others". */
  total: number;
  fallbackTimezone: string;
  /** An appointment at another location shows that location's name. */
  currentLocationId: number | null;
}

/** The soonest appointment a save would affect, in full, plus how many others there are. */
export const AppointmentConflictPreview: FC<AppointmentConflictPreviewProps> = ({
  appointment,
  total,
  fallbackTimezone,
  currentLocationId,
}) => {
  const { t } = useTranslation("calendar");
  if (!appointment) return null;

  const timezone = appointment.timezone || fallbackTimezone;
  const start = new Date(appointment.scheduledAt);
  const sameYear =
    formatDateInTimezone(start, timezone).slice(0, 4) === formatDateInTimezone(new Date(), timezone).slice(0, 4);
  const day = start.toLocaleDateString(getCalendarLocale(), {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const staffNames = appointment.staff
    .map((member) => `${member.firstName} ${member.lastName}`.trim())
    .filter(Boolean)
    .join(", ");
  // A staff block also covers the person's appointments at their other locations.
  const otherLocation =
    appointment.location && appointment.location.id !== currentLocationId ? appointment.location.name : "";
  const withWhom = [staffNames, otherLocation].filter(Boolean).join(" · ");
  const others = total - 1;

  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-foreground-3">
        {day}
      </p>
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-white px-3.5 py-3 dark:border-border-subtle dark:bg-white/[0.03]">
        <div className="min-w-[3.5rem] shrink-0 whitespace-nowrap tabular-nums">
          <p className="text-[15px] font-semibold leading-tight text-neutral-900 dark:text-foreground-1">
            {formatTime(appointment.scheduledAt, timezone)}
          </p>
          <p className="mt-0.5 text-[12px] leading-tight text-neutral-500 dark:text-foreground-3">
            – {formatTime(appointment.endsAt, timezone)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-snug text-neutral-900 dark:text-foreground-1">
            {appointment.itemName}
          </p>
          <p
            className={cn(
              "truncate text-[13px] leading-snug",
              appointment.customerName
                ? "text-neutral-600 dark:text-foreground-2"
                : "italic text-neutral-500 dark:text-foreground-3",
            )}
          >
            {appointment.customerName ?? getNoCustomerDisplayLabel(t)}
          </p>
          {(appointment.staff.length > 0 || otherLocation) && (
            <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
              {appointment.staff.length > 0 && (
                <div className="flex shrink-0 items-center -space-x-1">
                  {appointment.staff.slice(0, 2).map((member) => (
                    <PersonAvatar
                      key={member.userId}
                      id={member.userId}
                      firstName={member.firstName}
                      lastName={member.lastName}
                      profileImage={member.profileImage ?? null}
                      className="size-5 ring-2 ring-white dark:ring-surface"
                      initialsClassName="text-[8px] font-semibold"
                    />
                  ))}
                </div>
              )}
              <span className="truncate text-[12px] text-neutral-500 dark:text-foreground-3">{withWhom}</span>
            </div>
          )}
        </div>
      </div>
      {others > 0 && (
        <p className={cn(modalHelperSmall, "mt-3")}>{t("page.blocks.conflict.others", { count: others })}</p>
      )}
    </div>
  );
};
