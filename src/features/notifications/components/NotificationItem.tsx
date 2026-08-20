import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageSquareWarning,
  Clock,
  CalendarClock,
  CalendarX2,
  CalendarSync,
  CalendarPlus,
  CalendarMinus,
  ClipboardCheck,
  Info,
  Headset,
  UserCheck,
  UserMinus,
  X,
} from "lucide-react";
import { markNotificationReadAction } from "../actions";
import type { BusinessNotification } from "../types";

const NOTIFICATION_ICONS: Record<string, typeof Info> = {
  sms_credits_low: MessageSquareWarning,
  trial_ending: Clock,
  schedule_updated: CalendarClock,
  support_reply: Headset,
  appointment_cancelled_by_customer: CalendarX2,
  appointment_rescheduled_by_customer: CalendarSync,
  appointment_rescheduled_by_team_member: CalendarSync,
  appointment_status_review: ClipboardCheck,
  team_member_accepted_invitation: UserCheck,
  team_member_left_organisation: UserMinus,
  appointment_assigned: CalendarPlus,
  appointment_unassigned: CalendarMinus,
  appointment_rescheduled: CalendarSync,
  appointment_cancelled: CalendarX2,
};

// Semantic tone tokens only (text-info/success/warning/error/primary) — these carry
// dark-mode variants, unlike raw Tailwind palette shades (amber-500, sky-500, ...).
const NOTIFICATION_COLORS: Record<string, string> = {
  sms_credits_low: "text-warning",
  trial_ending: "text-primary",
  schedule_updated: "text-info",
  support_reply: "text-info",
  appointment_cancelled_by_customer: "text-error",
  appointment_rescheduled_by_customer: "text-info",
  appointment_rescheduled_by_team_member: "text-info",
  appointment_status_review: "text-warning",
  team_member_accepted_invitation: "text-success",
  team_member_left_organisation: "text-neutral-500 dark:text-neutral-400",
  appointment_assigned: "text-success",
  appointment_unassigned: "text-neutral-500 dark:text-neutral-400",
  appointment_rescheduled: "text-info",
  appointment_cancelled: "text-error",
};

function getNavigationPath(notification: BusinessNotification): string | null {
  const data = notification.data;

  switch (notification.type) {
    case "support_reply":
      return data?.ticketId
        ? `/support?ticketId=${data.ticketId}`
        : "/support";

    case "appointment_cancelled_by_customer":
    case "appointment_rescheduled_by_customer":
    case "appointment_rescheduled_by_team_member":
    case "appointment_assigned":
    case "appointment_unassigned":
    case "appointment_rescheduled":
    case "appointment_cancelled":
      return data?.appointmentId
        ? `/calendar?appointmentId=${data.appointmentId}`
        : "/calendar";

    case "appointment_status_review":
      return "/calendar";

    case "sms_credits_low":
      return "/account?tab=billing";

    case "team_member_accepted_invitation":
      return data?.userId
        ? `/team-members?memberId=${data.userId}`
        : "/team-members";

    case "team_member_left_organisation":
      return null;

    default:
      return null;
  }
}

function formatAbsoluteTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Relative time for the first 24h (the "time" i18n keys exist for exactly this),
// then absolute clock time — the day is already established by the date-group header.
function formatNotificationTime(
  dateStr: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return t("time.justNow");
  if (diffMin < 60) return t("time.minutesAgo", { count: diffMin });
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return t("time.hoursAgo", { count: diffHours });
  return formatAbsoluteTime(dateStr);
}

interface NotificationItemProps {
  notification: BusinessNotification;
  onDelete: () => void;
}

export function NotificationItem({ notification, onDelete }: NotificationItemProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation("notifications");

  const Icon = NOTIFICATION_ICONS[notification.type] ?? Info;
  const semanticColorClass =
    NOTIFICATION_COLORS[notification.type] ?? "text-neutral-500 dark:text-neutral-400";
  // Read notifications lose their semantic color — the icon fades to the same
  // neutral caption tone the timestamp already uses, so color itself becomes
  // the read/unread signal instead of a separate dot.
  const iconColorClass = notification.read ? "text-foreground-3" : semanticColorClass;

  const handleClick = useCallback(() => {
    if (!notification.read) {
      dispatch(markNotificationReadAction.request({ id: notification.id }));
    }
    const path = getNavigationPath(notification);
    if (path) {
      navigate(path);
    }
  }, [dispatch, navigate, notification]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className="-mx-4 rounded-lg px-4 py-4 outline-none transition-[background-color] duration-150 cursor-pointer hover:bg-surface-hover active:bg-surface-active/60 focus-visible:ring-2 focus-visible:ring-border-focus/40"
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColorClass}`} />

        <div className="min-w-0 flex-1">
          {/* X sits as a direct flex sibling of the title on the same line —
              guaranteed alignment instead of a separately-stretched column. The
              min-h/min-w overrides opt out of the global 44px touch-target floor
              (globals.css) — without them the box is 44px tall and the glyph
              centres well below the title; -m-1.5 then keeps the 32px box's
              centre on the title line without adding row height. */}
          <div className="flex items-start justify-between gap-2">
            <p
              className={`min-w-0 flex-1 text-sm leading-snug ${
                !notification.read
                  ? "font-semibold text-foreground-1"
                  : "text-foreground-2"
              }`}
            >
              {notification.title}
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={t("deleteOne")}
              className="-m-1.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground-3 outline-none transition-colors !min-h-0 !min-w-0 hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-border-focus/40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notification.body && (
            <p className="mt-3 text-xs text-foreground-3 leading-relaxed">
              {notification.body}
            </p>
          )}

          {/* Same content-column width as the title/X row above, so this
              right edge lines up with the X's right edge with no separate
              coordinate system involved. */}
          <div className="mt-1.5 flex justify-end">
            <span className="text-xs tabular-nums text-foreground-3">
              {formatNotificationTime(notification.createdAt, t)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
