export interface BusinessNotification {
  id: number;
  businessId: number;
  userId: number | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPagination {
  offset: number;
  limit: number;
  total: number;
}

export interface ListNotificationsResponse {
  data: BusinessNotification[];
  pagination: NotificationsPagination;
}

export interface MarkReadResponse {
  message: string;
}

export interface MarkAllReadResponse {
  message: string;
  data: {
    updated: number;
  };
}

export interface DeleteNotificationResponse {
  message: string;
}

export interface DeleteNotificationRequestItem {
  id: number;
  read: boolean;
}

export interface DeleteNotificationsSuccessPayload {
  batchId: string;
  ids: number[];
  unreadDeletedCount: number;
}

/** Rows removed from the list but not yet deleted server-side — the undo window's
 *  holding area. Restoring a batch puts these back exactly where they were. */
export interface PendingDeletionBatch {
  batchId: string;
  items: BusinessNotification[];
}

export interface NotificationsState {
  notifications: BusinessNotification[];
  pagination: NotificationsPagination;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMarkingRead: boolean;
  isMarkingAllRead: boolean;
  isDeleting: boolean;
  error: string | null;
  hasMore: boolean;
  pendingDeletions: PendingDeletionBatch[];
}
