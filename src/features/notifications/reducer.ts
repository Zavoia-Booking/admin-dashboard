import type { NotificationsState } from "./types";
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
  error: null,
  hasMore: true,
};

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
        notifications: data,
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
        notifications: [...state.notifications, ...data],
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

    default:
      return state;
  }
};
