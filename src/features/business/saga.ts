import { takeLatest, call, put } from 'redux-saga/effects';
import { fetchCurrentBusinessAction, updateBusinessAction } from './actions';
import { getCurrentBusinessApi, updateBusinessApi } from './api';
import { fetchCurrentUserAction } from '../auth/actions';
import type { Business } from './types';
import type { ActionType } from 'typesafe-actions';
import { toast } from 'sonner';
import { getErrorMessage } from '../../shared/utils/error';
import i18n from '../../shared/lib/i18n';

function* handleFetchCurrentBusiness(): Generator<any, void, any> {
  try {
    const { business }: { business: Business } = yield call(getCurrentBusinessApi);
    yield put(fetchCurrentBusinessAction.success(business));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(fetchCurrentBusinessAction.failure({ message }));
  }
}

function* handleUpdateBusiness(action: ActionType<typeof updateBusinessAction.request>): Generator<any, void, any> {
  try {
    const response = yield call(updateBusinessApi, action.payload);
    yield put(updateBusinessAction.success({
      message: response.message,
      shouldRedirectToMarketplace: response.shouldRedirectToMarketplace,
    }));
    toast.success(i18n.t('business:page.toasts.updateSuccess'));
    // Refresh the business data and current user (for updated business phone/email)
    yield put(fetchCurrentBusinessAction.request());
    yield put(fetchCurrentUserAction.request());
    if (response.shouldRedirectToMarketplace) {
      window.location.href = '/marketplace?tab=profile#industry';
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(updateBusinessAction.failure({ message }));
    toast.error(message);
  }
}

export function* businessSaga(): Generator<any, void, any> {
  yield takeLatest(fetchCurrentBusinessAction.request, handleFetchCurrentBusiness);
  yield takeLatest(updateBusinessAction.request, handleUpdateBusiness);
}

