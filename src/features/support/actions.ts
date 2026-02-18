import { createAsyncAction, createAction } from "typesafe-actions";
import type {
  SupportTicket,
  CreateTicketPayload,
  AddMessagePayload,
} from "./types";

export const listTicketsAction = createAsyncAction(
  "support/LIST_TICKETS_REQUEST",
  "support/LIST_TICKETS_SUCCESS",
  "support/LIST_TICKETS_FAILURE",
)<void, SupportTicket[], { message: string }>();

export const getTicketByIdAction = createAsyncAction(
  "support/GET_TICKET_REQUEST",
  "support/GET_TICKET_SUCCESS",
  "support/GET_TICKET_FAILURE",
)<{ id: number }, SupportTicket, { message: string }>();

export const createTicketAction = createAsyncAction(
  "support/CREATE_TICKET_REQUEST",
  "support/CREATE_TICKET_SUCCESS",
  "support/CREATE_TICKET_FAILURE",
)<CreateTicketPayload, SupportTicket, { message: string }>();

export const addMessageAction = createAsyncAction(
  "support/ADD_MESSAGE_REQUEST",
  "support/ADD_MESSAGE_SUCCESS",
  "support/ADD_MESSAGE_FAILURE",
)<AddMessagePayload, SupportTicket, { message: string }>();

export const closeTicketAction = createAsyncAction(
  "support/CLOSE_TICKET_REQUEST",
  "support/CLOSE_TICKET_SUCCESS",
  "support/CLOSE_TICKET_FAILURE",
)<{ id: number }, SupportTicket, { message: string }>();

export const clearCurrentTicketAction = createAction("support/CLEAR_CURRENT_TICKET")();
