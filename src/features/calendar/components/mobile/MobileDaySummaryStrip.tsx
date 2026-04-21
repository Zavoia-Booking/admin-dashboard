import { type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DayListItem } from "../../hooks/useDayAppointmentList";

interface MobileDaySummaryStripProps {
  items: DayListItem[];
}

export const MobileDaySummaryStrip: FC<MobileDaySummaryStripProps> = ({ items }) => {
  const { t } = useTranslation("calendar");

  const { total, hours, minutes, confirmed, pending, cancelled } = useMemo(() => {
    const appts = items.flatMap((i) => (i.type === "appointment" ? [i.data] : []));
    const cancelled = appts.filter((a) => a.status === "cancelled").length;
    const total = appts.length - cancelled;
    const totalMinutes = appts
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + (a.duration ?? 0), 0);
    const confirmed = appts.filter((a) => a.status === "confirmed").length;
    const pending = appts.filter((a) => a.status === "pending").length;
    return {
      total,
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      confirmed,
      pending,
      cancelled,
    };
  }, [items]);

  const bookingsWord = total === 1
    ? t("page.appointments.summary.bookingWord")
    : t("page.appointments.summary.bookingsWord");

  const durationText =
    hours > 0 && minutes > 0
      ? `${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h`
        : `${minutes}m`;

  const totalMinutes = hours * 60 + minutes;
  const showTotal = total > 0;
  const showDuration = totalMinutes > 0;
  const showConfirmed = confirmed > 0;
  const showPending = pending > 0;
  const showCancelled = cancelled > 0;

  if (!showTotal && !showDuration && !showConfirmed && !showPending && !showCancelled) return null;

  // Render a dot separator between non-adjacent metric groups only when both
  // sides actually render — avoids dangling dots at the edges.
  const leftGroupShown = showTotal || showDuration;
  const rightGroupShown = showConfirmed || showPending || showCancelled;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 bg-white dark:bg-surface">
      {showTotal && (
        <span className="text-[11px] font-medium text-foreground-3 whitespace-nowrap">
          <b className="text-foreground-1 font-semibold">{total}</b> {bookingsWord}
        </span>
      )}
      {showTotal && showDuration && (
        <span className="h-0.5 w-0.5 rounded-full bg-foreground-4" aria-hidden />
      )}
      {showDuration && (
        <span className="text-[11px] font-medium text-foreground-3 whitespace-nowrap">
          <b className="text-foreground-1 font-semibold">{durationText}</b>{" "}
          {t("page.appointments.summary.bookedLabel")}
        </span>
      )}
      {leftGroupShown && rightGroupShown && (
        <span className="h-0.5 w-0.5 rounded-full bg-foreground-4" aria-hidden />
      )}
      {showConfirmed && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground-2 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
          {confirmed} {t("page.appointments.summary.confirmedLabel")}
        </span>
      )}
      {showPending && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground-2 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden />
          {pending} {t("page.appointments.summary.pendingLabel")}
        </span>
      )}
      {showCancelled && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground-2 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden />
          {cancelled} {t("page.common.statuses.cancelled")}
        </span>
      )}
    </div>
  );
};
