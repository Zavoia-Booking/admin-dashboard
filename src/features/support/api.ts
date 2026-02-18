import { apiClient } from "../../shared/lib/http";
import type {
  SupportTicket,
  SupportApiResponse,
  CreateTicketPayload,
} from "./types";

export const listTicketsApi = async (): Promise<SupportApiResponse<SupportTicket[]>> => {
  const { data } = await apiClient().get<SupportApiResponse<SupportTicket[]>>("/support/tickets");
  return data;
};

export const getTicketByIdApi = async (id: number): Promise<SupportApiResponse<SupportTicket>> => {
  const { data } = await apiClient().get<SupportApiResponse<SupportTicket>>(`/support/tickets/${id}`);
  return data;
};

export const createTicketApi = async (payload: CreateTicketPayload): Promise<SupportApiResponse<SupportTicket>> => {
  const { data } = await apiClient().post<SupportApiResponse<SupportTicket>>("/support/tickets", payload);
  return data;
};

export const addMessageApi = async (ticketId: number, message: string): Promise<SupportApiResponse<SupportTicket>> => {
  const { data } = await apiClient().post<SupportApiResponse<SupportTicket>>(
    `/support/tickets/${ticketId}/messages`,
    { message },
  );
  return data;
};

export const closeTicketApi = async (id: number): Promise<SupportApiResponse<SupportTicket>> => {
  const { data } = await apiClient().put<SupportApiResponse<SupportTicket>>(`/support/tickets/${id}/close`);
  return data;
};
