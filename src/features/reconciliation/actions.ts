import { createAction, createAsyncAction } from 'typesafe-actions';

export type ReconciliationMode = 'seat_overflow' | 'remove_member' | 'unassign_from_location';

export interface OpenReconciliationPayload {
  mode: ReconciliationMode;
  userId?: number;
  locationId?: number;
}

export const openReconciliationAction = createAction(
  'reconciliation/OPEN',
)<OpenReconciliationPayload>();

export const closeReconciliationAction = createAction('reconciliation/CLOSE')();

export interface UnassignFromLocationPayload {
  userId: number;
  locationId: number;
  appointmentActions: Array<{
    appointmentId: number;
    newStaffUserId?: number | null;
    cancel?: boolean;
  }>;
}

export const unassignFromLocationAction = createAsyncAction(
  'reconciliation/UNASSIGN_LOCATION_REQUEST',
  'reconciliation/UNASSIGN_LOCATION_SUCCESS',
  'reconciliation/UNASSIGN_LOCATION_FAILURE',
)<UnassignFromLocationPayload, { locationId: number }, { message: string }>();
