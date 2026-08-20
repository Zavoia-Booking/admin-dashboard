import { createAsyncAction, createAction } from "typesafe-actions";
import type {
  BusinessNotification,
  ListNotificationsResponse,
  MarkAllReadResponse,
  DeleteNotificationsSuccessPayload,
} from "./types";

/** How long the undo toast stays up, and how long the saga waits before it
 *  actually deletes. The commit trails the toast so a click on the very last
 *  frame still lands before the request goes out. */
export const UNDO_TOAST_MS = 6500;
export const UNDO_COMMIT_DELAY_MS = 7000;

export const listNotificationsAction = createAsyncAction(
  "LIST/NOTIFICATIONS/REQUEST",
  "LIST/NOTIFICATIONS/SUCCESS",
  "LIST/NOTIFICATIONS/FAILURE"
)<{ offset: number; limit: number }, ListNotificationsResponse, { message: string }>();

export const loadMoreNotificationsAction = createAsyncAction(
  "LOAD_MORE/NOTIFICATIONS/REQUEST",
  "LOAD_MORE/NOTIFICATIONS/SUCCESS",
  "LOAD_MORE/NOTIFICATIONS/FAILURE"
)<{ offset: number; limit: number }, ListNotificationsResponse, { message: string }>();

export const markNotificationReadAction = createAsyncAction(
  "MARK_READ/NOTIFICATION/REQUEST",
  "MARK_READ/NOTIFICATION/SUCCESS",
  "MARK_READ/NOTIFICATION/FAILURE"
)<{ id: number }, { id: number }, { message: string }>();

export const markAllNotificationsReadAction = createAsyncAction(
  "MARK_ALL_READ/NOTIFICATIONS/REQUEST",
  "MARK_ALL_READ/NOTIFICATIONS/SUCCESS",
  "MARK_ALL_READ/NOTIFICATIONS/FAILURE"
)<void, MarkAllReadResponse, { message: string }>();

export const deleteNotificationsAction = createAsyncAction(
  "DELETE/NOTIFICATIONS/REQUEST",
  "DELETE/NOTIFICATIONS/SUCCESS",
  "DELETE/NOTIFICATIONS/FAILURE"
)<
  { batchId: string; notifications: BusinessNotification[] },
  DeleteNotificationsSuccessPayload,
  { batchId: string; message: string }
>();

export const undoDeleteNotificationsAction = createAction(
  "DELETE/NOTIFICATIONS/UNDO"
)<{ batchId: string }>();

export const decrementUnreadCount = createAction("NOTIFICATIONS/DECREMENT_UNREAD")<number>();
export const resetUnreadCount = createAction("NOTIFICATIONS/RESET_UNREAD")();
