export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "REOPENED";
export type TicketCategory = "bug" | "question";

export interface TicketHistoryEntry {
  message: string;
  createdBy: string;
}

export interface TicketDetails {
  history: TicketHistoryEntry[];
}

export interface SupportTicket {
  id: number;
  uuid: string;
  sourceType: string;
  businessId: number;
  details: TicketDetails;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  createdBy: string;
  priority: TicketPriority;
  category: TicketCategory;
  status: TicketStatus;
  seen: boolean;
  seenByAdmin?: boolean;
  hasUnread?: boolean;
}

export interface CreateTicketPayload {
  category: TicketCategory;
  message: string;
}

export interface AddMessagePayload {
  ticketId: number;
  message: string;
}

export interface SupportApiResponse<T> {
  message: string;
  data: T;
}

export interface SupportState {
  tickets: SupportTicket[];
  currentTicket: SupportTicket | null;
  isLoading: boolean;
  isFetchingTicket: boolean;
  isCreating: boolean;
  isSendingMessage: boolean;
  isClosing: boolean;
  error: string | null;
}
