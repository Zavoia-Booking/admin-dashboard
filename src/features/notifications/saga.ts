import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  listNotificationsAction,
  loadMoreNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationsAction,
  decrementUnreadCount,
  resetUnreadCount,
} from "./actions";
import {
  listNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
  deleteNotificationRequest,
} from "./api";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import { getErrorMessage } from "../../shared/utils/error";
import type { ListNotificationsResponse, MarkAllReadResponse } from "./types";
import type { RootState } from "../../app/providers/store";

function* handleListNotifications(
  action: ActionType<typeof listNotificationsAction.request>
): Generator<any, void, any> {
  try {
    const response: { data: ListNotificationsResponse } = yield call(
      listNotificationsRequest,
      action.payload.offset,
      action.payload.limit
    );
    if (response.data) {
      yield put(listNotificationsAction.success(response.data));
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    yield put(listNotificationsAction.failure({ message: errorMessage }));
    // With retained rows the list stays visible, so a toast is the feedback;
    // on an empty list the page renders an ErrorState with retry instead.
    const hasRetainedNotifications: boolean = yield select(
      (state: RootState) => state.notifications.notifications.length > 0,
    );
    if (hasRetainedNotifications) {
      toast.error(errorMessage);
    }
  }
}

function* handleLoadMoreNotifications(
  action: ActionType<typeof loadMoreNotificationsAction.request>
): Generator<any, void, any> {
  try {
    const response: { data: ListNotificationsResponse } = yield call(
      listNotificationsRequest,
      action.payload.offset,
      action.payload.limit
    );
    if (response.data) {
      yield put(loadMoreNotificationsAction.success(response.data));
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
    yield put(loadMoreNotificationsAction.failure({ message: errorMessage }));
  }
}

function* handleMarkNotificationRead(
  action: ActionType<typeof markNotificationReadAction.request>
): Generator<any, void, any> {
  try {
    yield call(markNotificationReadRequest, action.payload.id);
    yield put(markNotificationReadAction.success({ id: action.payload.id }));
    yield put(decrementUnreadCount(1));
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
    yield put(markNotificationReadAction.failure({ message: errorMessage }));
  }
}

function* handleMarkAllNotificationsRead(): Generator<any, void, any> {
  try {
    const response: { data: MarkAllReadResponse } = yield call(
      markAllNotificationsReadRequest
    );
    if (response.data) {
      yield put(markAllNotificationsReadAction.success(response.data));
      yield put(resetUnreadCount());
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
    yield put(markAllNotificationsReadAction.failure({ message: errorMessage }));
  }
}

function* handleDeleteNotifications(
  action: ActionType<typeof deleteNotificationsAction.request>
): Generator<any, void, any> {
  try {
    const deletedIds: number[] = [];
    let unreadDeletedCount = 0;

    for (const notification of action.payload.notifications) {
      yield call(deleteNotificationRequest, notification.id);
      deletedIds.push(notification.id);

      if (!notification.read) {
        unreadDeletedCount += 1;
      }
    }

    yield put(
      deleteNotificationsAction.success({
        ids: deletedIds,
        unreadDeletedCount,
      })
    );

    if (unreadDeletedCount > 0) {
      yield put(decrementUnreadCount(unreadDeletedCount));
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage);
    yield put(deleteNotificationsAction.failure({ message: errorMessage }));
  }
}

export function* notificationsSaga(): Generator<unknown, void, unknown> {
  yield all([
    takeLatest(listNotificationsAction.request, handleListNotifications),
    takeLatest(loadMoreNotificationsAction.request, handleLoadMoreNotifications),
    takeLatest(markNotificationReadAction.request, handleMarkNotificationRead),
    takeLatest(markAllNotificationsReadAction.request, handleMarkAllNotificationsRead),
    takeLatest(deleteNotificationsAction.request, handleDeleteNotifications),
  ]);
}
