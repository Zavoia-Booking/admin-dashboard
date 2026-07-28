import { takeLatest, call, put, all, select } from "redux-saga/effects";
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
import { getErrorMessage } from "../../shared/utils/error";
import i18n from "../../shared/lib/i18n";
import type { RootState } from "../../app/providers/store";

function* handleListTickets(): Generator<any, void, any> {
  try {
    const response: SupportApiResponse<SupportTicket[]> = yield call(listTicketsApi);
    yield put(listTicketsAction.success(response.data));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(listTicketsAction.failure({ message }));
    // With retained tickets the list stays visible, so a toast is the feedback;
    // on an empty list the page renders an ErrorState with retry instead.
    const hasRetainedTickets: boolean = yield select(
      (state: RootState) => state.support.tickets.length > 0,
    );
    if (hasRetainedTickets) {
      toast.error(message);
    }
  }
}

function* handleGetTicketById(action: ActionType<typeof getTicketByIdAction.request>) {
  try {
    const response: SupportApiResponse<SupportTicket> = yield call(getTicketByIdApi, action.payload.id);
    yield put(getTicketByIdAction.success(response.data));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(getTicketByIdAction.failure({ message }));
  }
}

function* handleCreateTicket(action: ActionType<typeof createTicketAction.request>) {
  try {
    const response: SupportApiResponse<SupportTicket> = yield call(createTicketApi, action.payload);
    yield put(createTicketAction.success(response.data));
    toast.success(i18n.t("support:page.toasts.ticketCreated"));
    yield put(listTicketsAction.request());
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(createTicketAction.failure({ message }));
    toast.error(message);
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
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(addMessageAction.failure({ message }));
    toast.error(message);
  }
}

function* handleCloseTicket(action: ActionType<typeof closeTicketAction.request>) {
  try {
    const response: SupportApiResponse<SupportTicket> = yield call(closeTicketApi, action.payload.id);
    yield put(closeTicketAction.success(response.data));
    toast.success(i18n.t("support:page.toasts.ticketClosed"));
    yield put(listTicketsAction.request());
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(closeTicketAction.failure({ message }));
    toast.error(message);
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
