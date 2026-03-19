import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MessageSquareWarning,
  Clock,
  CalendarClock,
  CalendarX2,
  CalendarSync,
  ClipboardCheck,
  Info,
  Headset,
  UserCheck,
  UserMinus,
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
  appointment_status_review: ClipboardCheck,
  team_member_accepted_invitation: UserCheck,
  team_member_left_organisation: UserMinus,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  sms_credits_low: "text-amber-500",
  trial_ending: "text-orange-500",
  schedule_updated: "text-blue-500",
  support_reply: "text-violet-500",
  appointment_cancelled_by_customer: "text-red-500",
  appointment_rescheduled_by_customer: "text-sky-500",
  appointment_status_review: "text-amber-500",
  team_member_accepted_invitation: "text-emerald-500",
  team_member_left_organisation: "text-neutral-500",
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
      return data?.appointmentId
        ? `/calendar?appointmentId=${data.appointmentId}`
        : "/calendar";

    case "appointment_status_review":
      return "/calendar";

    case "sms_credits_low":
      return "/settings?tab=billing";

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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface NotificationItemProps {
  notification: BusinessNotification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const Icon = NOTIFICATION_ICONS[notification.type] ?? Info;
  const colorClass =
    NOTIFICATION_COLORS[notification.type] ?? "text-neutral-500";

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
      className="relative rounded-lg border border-border bg-surface transition-colors cursor-pointer hover:bg-surface-hover overflow-hidden"
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className={`shrink-0 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <p
          className={`flex-1 min-w-0 text-sm truncate ${
            !notification.read
              ? "font-semibold text-foreground-1"
              : "text-foreground-2"
          }`}
        >
          {notification.title}
        </p>

        <span className="shrink-0 text-xs tabular-nums text-foreground-3">
          {formatTime(notification.createdAt)}
        </span>
      </div>

      {notification.body && (
        <div className="px-3 pb-2.5 pl-11">
          <p className="text-sm text-foreground-3 leading-relaxed">
            {notification.body}
          </p>
        </div>
      )}

      {!notification.read && (
        <span className="absolute right-0 top-0 bottom-0 w-1 rounded-l-full bg-primary" />
      )}
    </div>
  );
}
