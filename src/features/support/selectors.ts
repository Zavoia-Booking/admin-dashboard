import { createSelector } from "@reduxjs/toolkit";
import { getSupportStateSelector } from "../../app/providers/selectors";

export const getTicketsSelector = createSelector(
  getSupportStateSelector,
  (state) => state.tickets,
);

export const getCurrentTicketSelector = createSelector(
  getSupportStateSelector,
  (state) => state.currentTicket,
);

export const getTicketsLoadingSelector = createSelector(
  getSupportStateSelector,
  (state) => state.isLoading,
);

export const getIsFetchingTicketSelector = createSelector(
  getSupportStateSelector,
  (state) => state.isFetchingTicket,
);

export const getIsCreatingTicketSelector = createSelector(
  getSupportStateSelector,
  (state) => state.isCreating,
);

export const getIsSendingMessageSelector = createSelector(
  getSupportStateSelector,
  (state) => state.isSendingMessage,
);

export const getIsClosingTicketSelector = createSelector(
  getSupportStateSelector,
  (state) => state.isClosing,
);

export const getSupportErrorSelector = createSelector(
  getSupportStateSelector,
  (state) => state.error,
);

export const getTicketsListErrorSelector = createSelector(
  getSupportStateSelector,
  (state) => state.listError,
);

export const getTicketDetailErrorSelector = createSelector(
  getSupportStateSelector,
  (state) => state.detailError,
);
