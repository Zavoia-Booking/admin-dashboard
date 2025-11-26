import { takeLatest, call, put } from 'redux-saga/effects';
import { fetchCurrentBusinessAction, updateBusinessAction } from './actions';
import { getCurrentBusinessApi, updateBusinessApi } from './api';
import type { Business } from './types';
import type { ActionType } from 'typesafe-actions';
import { toast } from 'sonner';

function* handleFetchCurrentBusiness(): Generator<any, void, any> {
  try {
    const { business }: { business: Business } = yield call(getCurrentBusinessApi);
    yield put(fetchCurrentBusinessAction.success(business));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch business';
    yield put(fetchCurrentBusinessAction.failure({ message }));
  }
}

function* handleUpdateBusiness(action: ActionType<typeof updateBusinessAction.request>): Generator<any, void, any> {
  try {
    const response: { message: string } = yield call(updateBusinessApi, action.payload);
    yield put(updateBusinessAction.success({ message: response.message }));
    toast.success('Business information updated successfully');
    // Refresh the business data
    yield put(fetchCurrentBusinessAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to update business';
    yield put(updateBusinessAction.failure({ message }));
    toast.error(message);
  }
}

export function* businessSaga(): Generator<any, void, any> {
  yield takeLatest(fetchCurrentBusinessAction.request, handleFetchCurrentBusiness);
  yield takeLatest(updateBusinessAction.request, handleUpdateBusiness);
}

