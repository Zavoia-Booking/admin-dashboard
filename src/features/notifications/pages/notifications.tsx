import { useEffect, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { Button } from "../../../shared/components/ui/button";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { EmptyState } from "../../../shared/components/common/EmptyState";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { NotificationItem } from "../components/NotificationItem";
import {
  deleteNotificationsAction,
  listNotificationsAction,
  loadMoreNotificationsAction,
  markAllNotificationsReadAction,
} from "../actions";
import type { RootState } from "../../../app/providers/store";
import type { BusinessNotification } from "../types";

const LIMIT = 20;

function getDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function groupByDate(
  notifications: BusinessNotification[],
  t: (key: string) => string
): { label: string; items: BusinessNotification[] }[] {
  const now = new Date();
  const todayKey = getDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday.toISOString());

  const groups: Map<string, BusinessNotification[]> = new Map();

  for (const n of notifications) {
    const key = getDateKey(n.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }

  const result: { label: string; items: BusinessNotification[] }[] = [];

  for (const [key, items] of groups) {
    let label: string;
    if (key === todayKey) {
      label = t("dateGroup.today");
    } else if (key === yesterdayKey) {
      label = t("dateGroup.yesterday");
    } else {
      const d = new Date(items[0].createdAt);
      label = d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
    }
    result.push({ label, items });
  }

  return result;
}

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation("notifications");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    notifications,
    pagination,
    isLoading,
    isLoadingMore,
    isMarkingAllRead,
    isDeleting,
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

  const handleDeleteAllLoaded = useCallback(() => {
    if (notifications.length === 0) return;

    dispatch(
      deleteNotificationsAction.request({
        notifications: notifications.map((n) => ({
          id: n.id,
          read: n.read,
        })),
      })
    );
  }, [dispatch, notifications]);

  const hasUnread = notifications.some((n) => !n.read) || unreadCount > 0;

  const dateGroups = useMemo(
    () => groupByDate(notifications, t),
    [notifications, t]
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-4 w-full border-b border-border-strong hidden md:block">
          <h1 className="px-4 pb-3 text-xl font-medium text-foreground">
            {t("title")}
          </h1>
        </div>

        {/* Actions bar */}
        {!isLoading && notifications.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="font-medium hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isDeleting ? t("deleting") : t("deleteAllLoaded")}
            </Button>

            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
                className="font-medium hover:text-primary hover:border-primary/40 hover:bg-primary/5"
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
          <div className="flex flex-col gap-6">
            {dateGroups.map((group) => (
              <div key={group.label}>
                <h3 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-foreground-3">
                  {group.label}
                </h3>
                <div className="flex flex-col gap-2">
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2 pb-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium border-border-strong hover:bg-surface-hover hover:text-foreground-1 transition-colors"
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

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDeleteAllLoaded}
        onCancel={() => setShowDeleteConfirm(false)}
        onOpenChange={setShowDeleteConfirm}
        title={t("deleteConfirm.title")}
        description={t("deleteConfirm.description", {
          count: notifications.length,
        })}
        confirmTitle={t("deleteConfirm.confirm")}
        cancelTitle={t("deleteConfirm.cancel")}
        variant="destructive"
        showCloseButton
      />
      </div>
    </AppLayout>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g}>
          <Skeleton className="h-3 w-20 mb-3 mx-3" />
          <div className="flex flex-col gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-10 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
