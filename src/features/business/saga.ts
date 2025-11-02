import { takeLatest, call, put } from 'redux-saga/effects';
import { fetchCurrentBusinessAction } from './actions';
import { getCurrentBusinessApi } from './api';
import type { Business } from './types';

function* handleFetchCurrentBusiness(): Generator<any, void, any> {
  try {
    const { business }: { business: Business } = yield call(getCurrentBusinessApi);
    yield put(fetchCurrentBusinessAction.success(business));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch business';
    yield put(fetchCurrentBusinessAction.failure({ message }));
  }
}

export function* businessSaga(): Generator<any, void, any> {
  yield takeLatest(fetchCurrentBusinessAction.request, handleFetchCurrentBusiness);
}

