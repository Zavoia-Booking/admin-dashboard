import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageSquareWarning,
  Clock,
  CalendarClock,
  Info,
  Check,
} from "lucide-react";
import { markNotificationReadAction } from "../actions";
import type { BusinessNotification } from "../types";
import { Button } from "../../../shared/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../../shared/components/ui/tooltip";

const NOTIFICATION_ICONS: Record<string, typeof Info> = {
  sms_credits_low: MessageSquareWarning,
  trial_ending: Clock,
  schedule_updated: CalendarClock,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  sms_credits_low: "text-amber-500 bg-amber-100/80 dark:bg-amber-950/40",
  trial_ending: "text-orange-500 bg-orange-100/80 dark:bg-orange-950/40",
  schedule_updated: "text-blue-500 bg-blue-100/80 dark:bg-blue-950/40",
};

function formatRelativeTime(
  dateStr: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("time.justNow");
  if (diffMins < 60) return t("time.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("time.hoursAgo", { count: diffHours });
  if (diffDays < 7) return t("time.daysAgo", { count: diffDays });

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

interface NotificationItemProps {
  notification: BusinessNotification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation("notifications");

  const Icon = NOTIFICATION_ICONS[notification.type] ?? Info;
  const colorClass =
    NOTIFICATION_COLORS[notification.type] ??
    "text-neutral-500 bg-neutral-100/80 dark:bg-neutral-900/40";

  const handleMarkRead = useCallback(() => {
    if (!notification.read) {
      dispatch(markNotificationReadAction.request({ id: notification.id }));
    }
  }, [dispatch, notification.id, notification.read]);

  const handleClick = useCallback(() => {
    if (!notification.read) {
      dispatch(markNotificationReadAction.request({ id: notification.id }));
    }
    const screen = notification.data?.screen as string | undefined;
    if (screen) {
      navigate(screen);
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
      className={`group relative flex gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
        !notification.read
          ? "border-primary/20 bg-primary/[0.04] shadow-sm hover:border-primary/30 hover:bg-primary/[0.06] dark:bg-primary/[0.08] dark:hover:bg-primary/[0.12]"
          : "border-border bg-surface hover:bg-surface-hover"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm leading-snug truncate ${
                  !notification.read
                    ? "font-semibold text-foreground-1"
                    : "font-medium text-foreground-2"
                }`}
              >
                {notification.title}
              </p>
              {!notification.read && (
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-1 text-sm text-foreground-3 leading-relaxed line-clamp-2">
              {notification.body}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            {/* Mark as read button */}
            {!notification.read && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead();
                    }}
                    aria-label={t("markAsRead")}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{t("markAsRead")}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <span className="mt-1.5 block text-xs text-foreground-3">
          {formatRelativeTime(notification.createdAt, t)}
        </span>
      </div>
    </div>
  );
}
