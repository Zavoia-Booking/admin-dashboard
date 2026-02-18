import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { Button } from "../../../shared/components/ui/button";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { EmptyState } from "../../../shared/components/common/EmptyState";
import { NotificationItem } from "../components/NotificationItem";
import {
  listNotificationsAction,
  loadMoreNotificationsAction,
  markAllNotificationsReadAction,
} from "../actions";
import type { RootState } from "../../../app/providers/store";

const LIMIT = 20;

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation("notifications");

  const {
    notifications,
    pagination,
    isLoading,
    isLoadingMore,
    isMarkingAllRead,
    hasMore,
  } = useSelector((state: RootState) => state.notifications);

  const unreadCount = useSelector(
    (state: RootState) => state.auth.user?.unreadNotificationsCount ?? 0
  );

  useEffect(() => {
    dispatch(listNotificationsAction.request({ offset: 0, limit: LIMIT }));
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      dispatch(
        loadMoreNotificationsAction.request({
          offset: pagination.offset + LIMIT,
          limit: LIMIT,
        })
      );
    }
  }, [dispatch, isLoadingMore, hasMore, pagination.offset]);

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllNotificationsReadAction.request());
  }, [dispatch]);

  const hasUnread = notifications.some((n) => !n.read) || unreadCount > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-4 w-full border-b border-border-strong hidden md:block">
          <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
            {t("title")}
          </h1>
        </div>

        {/* Actions bar */}
        {!isLoading && notifications.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-foreground-3">
              {pagination.total > 0
                ? t("subtitle", { count: pagination.total })
                : t("subtitleEmpty")}
            </p>
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
              >
                {isMarkingAllRead ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="mr-2 h-4 w-4" />
                )}
                {t("markAllAsRead")}
              </Button>
            )}
          </div>
        )}

        {/* Notifications list */}
        {isLoading ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t("empty.title")}
            description={t("empty.description")}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoadingMore ? t("loadingMore") : t("loadMore")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-lg border border-border bg-surface p-4"
        >
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
