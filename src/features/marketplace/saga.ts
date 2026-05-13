import { takeLatest, takeEvery, call, put, all } from "redux-saga/effects";
import {
  fetchMarketplaceListingAction,
  publishMarketplaceListingAction,
  updateLocationMarketplaceFlagsAction,
  updateBookingSettingsAction,
} from "./actions";
import {
  getMarketplaceListingApi,
  publishMarketplaceListingApi,
  updateLocationMarketplaceFlagsApi,
  updateBookingSettingsApi,
  type LocationMarketplaceFlagsResponse,
} from "./api";
import type { MarketplaceListingResponse, BookingSettings } from "./types";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import i18n from "../../shared/lib/i18n";
import { getErrorMessage } from "../../shared/utils/error";

function* handleFetchMarketplaceListing() {
  try {
    const response: MarketplaceListingResponse = yield call(getMarketplaceListingApi);
    yield put(fetchMarketplaceListingAction.success(response));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('marketplace:page.toasts.listingDataLoadFailed'));
    yield put(fetchMarketplaceListingAction.failure({ message }));
  }
}

function* handlePublishMarketplaceListing(action: ActionType<typeof publishMarketplaceListingAction.request>) {
  try {
    yield call(publishMarketplaceListingApi, action.payload);
    yield put(publishMarketplaceListingAction.success());
    toast.success(i18n.t('marketplace:page.toasts.listingPublished'));
    // Refetch the listing data to get updated state
    yield put(fetchMarketplaceListingAction.request());
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('marketplace:page.toasts.listingPublishFailed'));
    yield put(publishMarketplaceListingAction.failure({ message }));
  }
}

function* handleUpdateLocationMarketplaceFlags(action: ActionType<typeof updateLocationMarketplaceFlagsAction.request>) {
  const { locationId, isPublic, allowOnlineBooking } = action.payload;
  try {
    const result: LocationMarketplaceFlagsResponse = yield call(
      updateLocationMarketplaceFlagsApi,
      locationId,
      { isPublic, allowOnlineBooking },
    );
    yield put(updateLocationMarketplaceFlagsAction.success({
      locationId: result.id,
      isPublic: result.isPublic,
      allowOnlineBooking: result.allowOnlineBooking,
    }));
    if (isPublic !== undefined) {
      toast.success(i18n.t(isPublic ? 'marketplace:page.toasts.locationPublic' : 'marketplace:page.toasts.locationHidden'));
    } else if (allowOnlineBooking !== undefined) {
      toast.success(i18n.t(allowOnlineBooking ? 'marketplace:page.toasts.onlineEnabled' : 'marketplace:page.toasts.onlineDisabled'));
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    const fallbackKey = allowOnlineBooking !== undefined
      ? 'marketplace:page.toasts.onlineBookingUpdateFailed'
      : 'marketplace:page.toasts.locationVisibilityUpdateFailed';
    toast.error(message || i18n.t(fallbackKey));
    yield put(updateLocationMarketplaceFlagsAction.failure({ locationId, message }));
  }
}

function* handleUpdateBookingSettings(action: ActionType<typeof updateBookingSettingsAction.request>) {
  try {
    const response: BookingSettings = yield call(updateBookingSettingsApi, action.payload);
    yield put(updateBookingSettingsAction.success(response));
    toast.success(i18n.t('marketplace:page.toasts.bookingSettingsSaved'));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('marketplace:page.toasts.bookingSettingsSaveFailed'));
    yield put(updateBookingSettingsAction.failure({ message }));
  }
}

export function* marketplaceSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchMarketplaceListingAction.request, handleFetchMarketplaceListing),
    takeLatest(publishMarketplaceListingAction.request, handlePublishMarketplaceListing),
    takeEvery(updateLocationMarketplaceFlagsAction.request, handleUpdateLocationMarketplaceFlags),
    takeLatest(updateBookingSettingsAction.request, handleUpdateBookingSettings),
  ]);
}
