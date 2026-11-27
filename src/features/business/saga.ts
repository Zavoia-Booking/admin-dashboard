import { takeLatest, call, put } from 'redux-saga/effects';
import { fetchCurrentBusinessAction } from './actions';
import { getCurrentBusinessApi } from './api';
import type { Business } from './types';
import { getErrorMessage } from '../../shared/utils/error';

function* handleFetchCurrentBusiness(): Generator<any, void, any> {
  try {
    const { business }: { business: Business } = yield call(getCurrentBusinessApi);
    yield put(fetchCurrentBusinessAction.success(business));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(fetchCurrentBusinessAction.failure({ message }));
  }
}

export function* businessSaga(): Generator<any, void, any> {
  yield takeLatest(fetchCurrentBusinessAction.request, handleFetchCurrentBusiness);
}
