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

export interface NotificationsState {
  notifications: BusinessNotification[];
  pagination: NotificationsPagination;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMarkingRead: boolean;
  isMarkingAllRead: boolean;
  error: string | null;
  hasMore: boolean;
}
