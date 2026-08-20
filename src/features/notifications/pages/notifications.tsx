import { useEffect, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { Button } from "../../../shared/components/ui/button";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { EmptyState } from "../../../shared/components/common/EmptyState";
import { ErrorState } from "../../../shared/components/common/ErrorState";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { NotificationItem } from "../components/NotificationItem";
import { NotificationsMoreSheet } from "../components/NotificationsMoreSheet";
import {
  deleteNotificationsAction,
  listNotificationsAction,
  loadMoreNotificationsAction,
  markAllNotificationsReadAction,
  undoDeleteNotificationsAction,
  UNDO_TOAST_MS,
} from "../actions";
import { toast } from "sonner";
import type { RootState } from "../../../app/providers/store";
import type { BusinessNotification } from "../types";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import { selectCurrentUser } from "../../auth/selectors";
import { maybeShowPushPrimer } from "../../push-notifications/primer";
import "../components/Notifications.css";

const LIMIT = 20;

// Temporary design-review aid — visit /notifications?mockAll=1 in dev to see every
// notification type + read/unread state at once, spread across Today/Yesterday/older
// so the date grouping and relative-time formatting are exercised too. Dev-gated,
// never reachable in production. Remove once the redesign is signed off.
function buildMockNotifications(locale: "ro" | "en"): BusinessNotification[] {
  const now = Date.now();
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  const copy: Record<
    string,
    { title: { ro: string; en: string }; body?: { ro: string; en: string } }
  > = {
    trial_ending: {
      title: { ro: "Perioada de probă se încheie curând", en: "Your trial is ending soon" },
      body: { ro: "Mai ai 3 zile pentru a face upgrade și a păstra accesul la toate funcțiile.", en: "You have 3 days left to upgrade and keep full access." },
    },
    appointment_cancelled_by_customer: {
      title: { ro: "Programare anulată de client", en: "Appointment cancelled by customer" },
      body: { ro: "Maria Ionescu a anulat programarea de mâine, 10:00, pentru Tuns clasic.", en: "Maria Ionescu cancelled tomorrow's 10:00 appointment for Classic Haircut." },
    },
    sms_credits_low: {
      title: { ro: "Credite SMS pe terminate", en: "SMS credits running low" },
      body: { ro: "Mai ai 12 credite SMS rămase. Reîncarcă pentru a evita întreruperea notificărilor.", en: "You have 12 SMS credits left. Top up to avoid interrupting notifications." },
    },
    appointment_status_review: {
      title: { ro: "Programări de verificat", en: "Appointments need review" },
      body: { ro: "3 programări din trecut nu au fost marcate ca finalizate sau neprezentate.", en: "3 past appointments haven't been marked completed or no-show." },
    },
    schedule_updated: {
      title: { ro: "Program actualizat", en: "Schedule updated" },
      body: { ro: "Andrei Pop și-a modificat programul de lucru pentru săptămâna viitoare.", en: "Andrei Pop updated their working hours for next week." },
    },
    support_reply: {
      title: { ro: "Răspuns nou de la Suport", en: "New reply from Support" },
      body: { ro: "Echipa de suport a răspuns la tichetul tău #4821.", en: "The support team replied to your ticket #4821." },
    },
    appointment_rescheduled_by_customer: {
      title: { ro: "Programare reprogramată de client", en: "Appointment rescheduled by customer" },
      body: { ro: "Elena Radu a mutat programarea din 22 aug. în 24 aug., 14:30.", en: "Elena Radu moved their appointment from Aug 22 to Aug 24, 2:30 PM." },
    },
    team_member_accepted_invitation: {
      title: { ro: "Membru de echipă a acceptat invitația", en: "Team member accepted invitation" },
      body: { ro: "Alex Marin s-a alăturat echipei tale.", en: "Alex Marin has joined your team." },
    },
    appointment_assigned: {
      title: { ro: "Programare nouă alocată", en: "New appointment assigned" },
      body: { ro: "Ți-a fost alocată o programare pentru Manichiură, joi, 11:00.", en: "You've been assigned an appointment for Manicure, Thursday, 11:00 AM." },
    },
    appointment_rescheduled_by_team_member: {
      title: { ro: "Programare reprogramată de coleg", en: "Appointment rescheduled by team member" },
      body: { ro: "Diana Stan a mutat una dintre programările tale în 25 aug.", en: "Diana Stan moved one of your appointments to Aug 25." },
    },
    team_member_left_organisation: {
      title: { ro: "Membru de echipă a plecat", en: "Team member left the organisation" },
      body: { ro: "Bogdan Ilie nu mai face parte din echipa ta.", en: "Bogdan Ilie is no longer part of your team." },
    },
    appointment_unassigned: {
      title: { ro: "Programare dealocată", en: "Appointment unassigned" },
      body: { ro: "O programare de vineri a fost eliminată din calendarul tău.", en: "A Friday appointment was removed from your calendar." },
    },
    appointment_rescheduled: {
      title: { ro: "Programare reprogramată", en: "Appointment rescheduled" },
      body: { ro: "Programarea pentru Coafură a fost mutată în 26 aug., 09:30.", en: "The Hairstyling appointment was moved to Aug 26, 9:30 AM." },
    },
    appointment_cancelled: {
      title: { ro: "Programare anulată", en: "Appointment cancelled" },
      body: { ro: "Programarea pentru Bărbierit din 20 aug. a fost anulată.", en: "The Aug 20 Shaving appointment was cancelled." },
    },
  };

  const rows: { type: string; read: boolean; createdAt: string }[] = [
    // Today
    { type: "trial_ending", read: false, createdAt: ago(30_000) },
    { type: "appointment_cancelled_by_customer", read: false, createdAt: ago(5 * MIN) },
    { type: "sms_credits_low", read: false, createdAt: ago(45 * MIN) },
    { type: "appointment_status_review", read: true, createdAt: ago(2 * HOUR) },
    { type: "schedule_updated", read: false, createdAt: ago(6 * HOUR) },
    { type: "support_reply", read: true, createdAt: ago(10 * HOUR) },
    { type: "appointment_rescheduled_by_customer", read: false, createdAt: ago(20 * HOUR) },
    // Yesterday
    { type: "team_member_accepted_invitation", read: true, createdAt: ago(DAY + 3 * HOUR) },
    { type: "appointment_assigned", read: false, createdAt: ago(DAY + 8 * HOUR) },
    { type: "appointment_rescheduled_by_team_member", read: true, createdAt: ago(DAY + 15 * HOUR) },
    { type: "team_member_left_organisation", read: true, createdAt: ago(DAY + 20 * HOUR) },
    // Older
    { type: "appointment_unassigned", read: true, createdAt: ago(4 * DAY) },
    { type: "appointment_rescheduled", read: false, createdAt: ago(4 * DAY + 5 * HOUR) },
    { type: "appointment_cancelled", read: true, createdAt: ago(6 * DAY) },
  ];

  return rows.map((r, i) => ({
    id: i + 1,
    businessId: 1,
    userId: 1,
    type: r.type,
    title: copy[r.type].title[locale],
    body: copy[r.type].body?.[locale] ?? "",
    data: null,
    read: r.read,
    createdAt: r.createdAt,
  }));
}

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
  const { t, i18n } = useTranslation("notifications");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isMobile = useIsMobile();

  const isMockAll =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("mockAll") === "1";
  const mockNotifications = useMemo(
    () => (isMockAll ? buildMockNotifications(i18n.language === "ro" ? "ro" : "en") : null),
    [isMockAll, i18n.language]
  );

  const {
    notifications: realNotifications,
    pagination,
    isLoading: realIsLoading,
    isLoadingMore,
    isMarkingAllRead,
    isDeleting,
    hasMore: realHasMore,
    error,
  } = useSelector((state: RootState) => state.notifications);

  const notifications = mockNotifications ?? realNotifications;
  const isLoading = mockNotifications ? false : realIsLoading;
  const hasMore = mockNotifications ? false : realHasMore;

  const unreadCount = useSelector(
    (state: RootState) => state.auth.user?.unreadNotificationsCount ?? 0
  );

  // Mirrors BusinessSetupGate's condition. The list fetch lives at page level, outside the
  // gate, so without this it fires while the setup prompt is up and the guaranteed 403
  // ("You need a business account…") toasts over a screen that already says the same thing.
  const currentUser = useSelector(selectCurrentUser);
  const hasBusiness = Boolean(currentUser?.businessId);

  useEffect(() => {
    if (!hasBusiness || isMockAll) return;
    dispatch(listNotificationsAction.request({ offset: 0, limit: LIMIT }));
    // The literal "alert bell" moment from Android's guidance — a value moment
    // for the push-permission soft ask (policy-gated no-op when ineligible).
    void maybeShowPushPrimer("notifications-page");
  }, [dispatch, hasBusiness, isMockAll]);

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

  // The rows leave the list immediately and the delete only fires once the toast
  // expires, so Undo is a cancel rather than a restore.
  const requestDelete = useCallback(
    (items: BusinessNotification[]) => {
      if (items.length === 0) return;

      const batchId = `${Date.now()}-${items[0].id}-${items.length}`;
      dispatch(deleteNotificationsAction.request({ batchId, notifications: items }));

      // House toast, not a custom card: sonner's own action row is what
      // toast.css styles app-wide, and it is what the builder's undo uses too.
      toast.message(
        items.length === 1
          ? t("deleteToast.one")
          : t("deleteToast.many", { count: items.length }),
        {
          closeButton: false,
          duration: UNDO_TOAST_MS,
          action: {
            label: t("undo"),
            onClick: () => dispatch(undoDeleteNotificationsAction({ batchId })),
          },
        }
      );
    },
    [dispatch, t]
  );

  const handleDeleteAllLoaded = useCallback(
    () => requestDelete(notifications),
    [requestDelete, notifications]
  );

  const handleDeleteOne = useCallback(
    (notification: BusinessNotification) => requestDelete([notification]),
    [requestDelete]
  );

  const hasUnread = notifications.some((n) => !n.read) || unreadCount > 0;

  const dateGroups = useMemo(
    () => groupByDate(notifications, t),
    [notifications, t]
  );

  return (
    <AppLayout
      headerRightContent={
        isMobile && notifications.length > 0 ? (
          <NotificationsMoreSheet
            onDeleteAll={() => setShowDeleteConfirm(true)}
            onMarkAllRead={handleMarkAllRead}
            showMarkAllRead={hasUnread}
            busy={isDeleting || isMarkingAllRead}
          />
        ) : undefined
      }
    >
      <BusinessSetupGate>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-4 w-full border-b border-border-strong hidden md:block">
          <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
            {t("title")}
          </h1>
        </div>

        {/* Notifications list */}
        {isLoading ? (
          <NotificationsSkeleton />
        ) : error && notifications.length === 0 ? (
          <ErrorState
            variant="page"
            body={error}
            onRetry={() =>
              dispatch(listNotificationsAction.request({ offset: 0, limit: LIMIT }))
            }
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t("empty.title")}
            description={t("empty.description")}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* One bounded panel for the whole list — the toolbar is its own first
                section (border-b, same divider token the date groups below use as
                border-t), so bulk actions read as part of this list, not a floating
                row above it. Matches the SubscriptionInfo / StatRow convention: a
                single card, hairline rules between rows. */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="hidden items-center justify-end gap-2 border-b border-border px-4 py-3 md:flex">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    rounded="full"
                    onClick={() => setShowDeleteConfirm(true)}
                    loading={isDeleting}
                    className="!h-7 !min-h-0 gap-1.5 bg-surface px-3 text-xs font-medium border-border hover:bg-surface-hover hover:border-border-strong active:bg-surface-active active:scale-[0.97] transition-[transform,background-color,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0 text-error" />
                    {t("deleteAllLoaded")}
                  </Button>

                  {hasUnread && (
                    <Button
                      variant="outline"
                      size="sm"
                      rounded="full"
                      onClick={handleMarkAllRead}
                      loading={isMarkingAllRead}
                      className="!h-7 !min-h-0 gap-1.5 bg-surface px-3 text-xs font-medium border-border hover:bg-surface-hover hover:border-border-strong active:bg-surface-active active:scale-[0.97] transition-[transform,background-color,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    >
                      <CheckCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                      {t("markAllAsRead")}
                    </Button>
                  )}
                </div>
              </div>

              {dateGroups.map((group, groupIndex) => (
                <div
                  key={group.label}
                  className={groupIndex > 0 ? "border-t border-border" : ""}
                >
                  <h3 className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-foreground-3">
                    {group.label}
                  </h3>
                  <div className="notifications-list-stagger flex flex-col divide-y divide-border-subtle px-4 pb-2">
                    {group.items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onDelete={() => handleDeleteOne(notification)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-2 pb-8">
                <Button
                  variant="outline"
                  size="sm"
                  rounded="full"
                  className="font-medium px-6 border-border-strong hover:bg-surface-hover hover:text-foreground-1 transition-[transform,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                  onClick={handleLoadMore}
                  loading={isLoadingMore}
                >
                  {t("loadMore")}
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
      </BusinessSetupGate>
    </AppLayout>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="skeleton-delayed-reveal rounded-xl border border-border bg-surface overflow-hidden">
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className={g > 0 ? "border-t border-border" : ""}>
          <Skeleton className="h-3 w-20 mx-4 mt-4 mb-3" />
          <div className="flex flex-col divide-y divide-border-subtle px-4 pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-4"
              >
                <Skeleton className="h-4 w-4 rounded shrink-0" />
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
