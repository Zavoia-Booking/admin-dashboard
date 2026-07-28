import { call, put, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';
import i18n from '../../shared/lib/i18n';
import { getErrorMessage } from '../../shared/utils/error';
import { unassignFromLocationApi } from '../teamMembers/api';
import { fetchLocationFullAssignmentAction } from '../assignments/actions';
import {
  closeReconciliationAction,
  unassignFromLocationAction,
} from './actions';

function* handleUnassignFromLocation(
  action: ReturnType<typeof unassignFromLocationAction.request>,
) {
  try {
    yield call(
      unassignFromLocationApi,
      action.payload.userId,
      action.payload.locationId,
      action.payload.appointmentActions,
    );
    yield put(unassignFromLocationAction.success({ locationId: action.payload.locationId }));
    toast.success(i18n.t('teamMembers:seatOverflow.unassignSuccess'));
    yield put(closeReconciliationAction());
    yield put(
      fetchLocationFullAssignmentAction.request({
        locationId: action.payload.locationId,
        skipLoading: true,
      }),
    );
  } catch (error: unknown) {
    const message = getErrorMessage(error, i18n.t('teamMembers:seatOverflow.unassignFailed'));
    toast.error(message);
    yield put(unassignFromLocationAction.failure({ message }));
  }
}

export function* reconciliationSaga() {
  yield takeLatest(unassignFromLocationAction.request, handleUnassignFromLocation);
}
