import { takeLatest, call, put, all } from "redux-saga/effects";
import {
  listTicketsAction,
  getTicketByIdAction,
  createTicketAction,
  addMessageAction,
  closeTicketAction,
} from "./actions";
import {
  listTicketsApi,
  getTicketByIdApi,
  createTicketApi,
  addMessageApi,
  closeTicketApi,
} from "./api";
import type { SupportTicket, SupportApiResponse } from "./types";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";

function* handleListTickets() {
  try {
    const response: SupportApiResponse<SupportTicket[]> = yield call(listTicketsApi);
    yield put(listTicketsAction.success(response.data));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || "Failed to fetch tickets";
    yield put(listTicketsAction.failure({ message }));
  }
}

function* handleGetTicketById(action: ActionType<typeof getTicketByIdAction.request>) {
  try {
    const response: SupportApiResponse<SupportTicket> = yield call(getTicketByIdApi, action.payload.id);
    yield put(getTicketByIdAction.success(response.data));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || "Failed to fetch ticket";
    yield put(getTicketByIdAction.failure({ message }));
  }
}

function* handleCreateTicket(action: ActionType<typeof createTicketAction.request>) {
  try {
    const response: SupportApiResponse<SupportTicket> = yield call(createTicketApi, action.payload);
    yield put(createTicketAction.success(response.data));
    toast.success("Ticket created successfully");
    yield put(listTicketsAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || "Failed to create ticket";
    yield put(createTicketAction.failure({ message }));
    toast.error("Failed to create ticket");
  }
}

function* handleAddMessage(action: ActionType<typeof addMessageAction.request>) {
  try {
    const response: SupportApiResponse<SupportTicket> = yield call(
      addMessageApi,
      action.payload.ticketId,
      action.payload.message,
    );
    yield put(addMessageAction.success(response.data));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || "Failed to send message";
    yield put(addMessageAction.failure({ message }));
    toast.error("Failed to send message");
  }
}

function* handleCloseTicket(action: ActionType<typeof closeTicketAction.request>) {
  try {
    const response: SupportApiResponse<SupportTicket> = yield call(closeTicketApi, action.payload.id);
    yield put(closeTicketAction.success(response.data));
    toast.success("Ticket closed");
    yield put(listTicketsAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || "Failed to close ticket";
    yield put(closeTicketAction.failure({ message }));
    toast.error("Failed to close ticket");
  }
}

export function* supportSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(listTicketsAction.request, handleListTickets),
    takeLatest(getTicketByIdAction.request, handleGetTicketById),
    takeLatest(createTicketAction.request, handleCreateTicket),
    takeLatest(addMessageAction.request, handleAddMessage),
    takeLatest(closeTicketAction.request, handleCloseTicket),
  ]);
}
