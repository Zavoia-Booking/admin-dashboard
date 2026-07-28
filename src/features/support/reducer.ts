import * as actions from "./actions";
import type { SupportState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions> | ActionType<typeof logoutRequestAction>;

const initialState: SupportState = {
  tickets: [],
  currentTicket: null,
  isLoading: false,
  isFetchingTicket: false,
  isCreating: false,
  isSendingMessage: false,
  isClosing: false,
  error: null,
  listError: null,
  detailError: null,
};

export const SupportReducer: Reducer<SupportState, any> = (
  state: SupportState = initialState,
  action: Actions,
) => {
  switch (action.type) {
    case getType(logoutRequestAction.success):
      return { ...initialState };

    // List tickets
    case getType(actions.listTicketsAction.request):
      return { ...state, isLoading: true, listError: null };
    case getType(actions.listTicketsAction.success):
      return { ...state, isLoading: false, tickets: action.payload, listError: null };
    case getType(actions.listTicketsAction.failure):
      return { ...state, isLoading: false, listError: action.payload.message };

    // Get ticket by ID
    case getType(actions.getTicketByIdAction.request):
      return { ...state, isFetchingTicket: true, detailError: null };
    case getType(actions.getTicketByIdAction.success):
      return { ...state, isFetchingTicket: false, currentTicket: action.payload, detailError: null };
    case getType(actions.getTicketByIdAction.failure):
      return { ...state, isFetchingTicket: false, detailError: action.payload.message };

    // Create ticket
    case getType(actions.createTicketAction.request):
      return { ...state, isCreating: true, error: null };
    case getType(actions.createTicketAction.success):
      return { ...state, isCreating: false, error: null };
    case getType(actions.createTicketAction.failure):
      return { ...state, isCreating: false, error: action.payload.message };

    // Add message
    case getType(actions.addMessageAction.request):
      return { ...state, isSendingMessage: true, error: null };
    case getType(actions.addMessageAction.success):
      return { ...state, isSendingMessage: false, currentTicket: action.payload, error: null };
    case getType(actions.addMessageAction.failure):
      return { ...state, isSendingMessage: false, error: action.payload.message };

    // Close ticket
    case getType(actions.closeTicketAction.request):
      return { ...state, isClosing: true, error: null };
    case getType(actions.closeTicketAction.success): {
      const closed = action.payload;
      return {
        ...state,
        isClosing: false,
        currentTicket: state.currentTicket?.id === closed.id
          ? { ...state.currentTicket, ...closed }
          : state.currentTicket,
        error: null,
      };
    }
    case getType(actions.closeTicketAction.failure):
      return { ...state, isClosing: false, error: action.payload.message };

    // Clear
    case getType(actions.clearCurrentTicketAction):
      return { ...state, currentTicket: null, error: null, detailError: null };

    default:
      return state;
  }
};
