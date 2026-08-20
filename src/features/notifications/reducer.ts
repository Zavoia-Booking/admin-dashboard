import type { BusinessNotification, NotificationsState } from "./types";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions> | ActionType<typeof logoutRequestAction>;

const LIMIT = 20;

const initialState: NotificationsState = {
  notifications: [],
  pagination: { offset: 0, limit: LIMIT, total: 0 },
  isLoading: false,
  isLoadingMore: false,
  isMarkingRead: false,
  isMarkingAllRead: false,
  isDeleting: false,
  error: null,
  hasMore: true,
  pendingDeletions: [],
};

/** Newest first — the order the API returns and the date grouping relies on. */
const byNewest = (a: BusinessNotification, b: BusinessNotification) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** Rows awaiting deletion still exist server-side, so a refetch inside the undo
 *  window would hand them straight back. */
function withoutPending(
  rows: BusinessNotification[],
  pending: NotificationsState['pendingDeletions'],
): BusinessNotification[] {
  if (pending.length === 0) return rows;
  const ids = new Set(pending.flatMap((batch) => batch.items.map((item) => item.id)));
  return rows.filter((row) => !ids.has(row.id));
}

/** Puts a batch back where it came from: re-sorted into the list, counted again
 *  in the total, and dropped from the holding area. */
function restoreBatch(state: NotificationsState, batchId: string): NotificationsState {
  const batch = state.pendingDeletions.find((b) => b.batchId === batchId);
  if (!batch) return state;

  const notifications = [...state.notifications, ...batch.items].sort(byNewest);
  const total = state.pagination.total + batch.items.length;

  return {
    ...state,
    notifications,
    pagination: { ...state.pagination, total },
    pendingDeletions: state.pendingDeletions.filter((b) => b.batchId !== batchId),
    hasMore: notifications.length < total,
  };
}

export const NotificationsReducer: Reducer<NotificationsState, any> = (
  state: NotificationsState = initialState,
  action: Actions
): NotificationsState => {
  switch (action.type) {
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(actions.listNotificationsAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.listNotificationsAction.success): {
      const { data, pagination } = action.payload;
      return {
        ...state,
        notifications: withoutPending(data, state.pendingDeletions),
        pagination,
        isLoading: false,
        error: null,
        hasMore: data.length >= pagination.limit,
      };
    }

    case getType(actions.listNotificationsAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.loadMoreNotificationsAction.request):
      return { ...state, isLoadingMore: true, error: null };

    case getType(actions.loadMoreNotificationsAction.success): {
      const { data, pagination } = action.payload;
      return {
        ...state,
        notifications: [...state.notifications, ...withoutPending(data, state.pendingDeletions)],
        pagination,
        isLoadingMore: false,
        error: null,
        hasMore: data.length >= pagination.limit,
      };
    }

    case getType(actions.loadMoreNotificationsAction.failure):
      return { ...state, isLoadingMore: false, error: action.payload.message };

    case getType(actions.markNotificationReadAction.request):
      return { ...state, isMarkingRead: true };

    case getType(actions.markNotificationReadAction.success): {
      const { id } = action.payload;
      return {
        ...state,
        isMarkingRead: false,
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      };
    }

    case getType(actions.markNotificationReadAction.failure):
      return { ...state, isMarkingRead: false };

    case getType(actions.markAllNotificationsReadAction.request):
      return { ...state, isMarkingAllRead: true };

    case getType(actions.markAllNotificationsReadAction.success):
      return {
        ...state,
        isMarkingAllRead: false,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case getType(actions.markAllNotificationsReadAction.failure):
      return { ...state, isMarkingAllRead: false };

    case getType(actions.deleteNotificationsAction.request): {
      const { batchId, notifications } = action.payload;
      const ids = new Set(notifications.map((n) => n.id));
      const remaining = state.notifications.filter((n) => !ids.has(n.id));
      const total = Math.max(0, state.pagination.total - notifications.length);

      // The rows leave the list now and the delete fires later, so the undo has
      // something to put back and the list never waits on a round trip.
      // Deliberately not `isDeleting: true`: the rows are already gone, so a
      // spinner on the toolbar would claim work the user cannot see or wait on.
      return {
        ...state,
        error: null,
        notifications: remaining,
        pagination: { ...state.pagination, total },
        hasMore: remaining.length < total,
        pendingDeletions: [...state.pendingDeletions, { batchId, items: notifications }],
      };
    }

    case getType(actions.undoDeleteNotificationsAction): {
      const restored = restoreBatch(state, action.payload.batchId);
      return { ...restored, isDeleting: restored.pendingDeletions.length > 0 };
    }

    case getType(actions.deleteNotificationsAction.success): {
      // The list already dropped these at request time; the batch just retires.
      const pendingDeletions = state.pendingDeletions.filter(
        (b) => b.batchId !== action.payload.batchId
      );
      return { ...state, isDeleting: pendingDeletions.length > 0, pendingDeletions };
    }

    case getType(actions.deleteNotificationsAction.failure): {
      const restored = restoreBatch(state, action.payload.batchId);
      return {
        ...restored,
        isDeleting: restored.pendingDeletions.length > 0,
        error: action.payload.message,
      };
    }

    default:
      return state;
  }
};
