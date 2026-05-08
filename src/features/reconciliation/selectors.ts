import type { ReconciliationState } from './reducer';

interface RootStateLike {
  reconciliation: ReconciliationState;
}

export const selectReconciliation = (state: RootStateLike) => state.reconciliation;
export const selectReconciliationOpen = (state: RootStateLike) => state.reconciliation.open;
export const selectReconciliationMode = (state: RootStateLike) => state.reconciliation.mode;
export const selectReconciliationUserId = (state: RootStateLike) => state.reconciliation.userId;
export const selectReconciliationLocationId = (state: RootStateLike) => state.reconciliation.locationId;
export const selectIsUnassigning = (state: RootStateLike) => state.reconciliation.isUnassigning;
export const selectUnassignError = (state: RootStateLike) => state.reconciliation.unassignError;
