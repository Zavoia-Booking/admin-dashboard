import { takeLatest, takeEvery, call, put, all, select } from "redux-saga/effects";
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
import type { RootState } from "../../app/providers/store";

function* getMarketplaceScopeBusinessId(): Generator<any, string | null, any> {
  return yield select((state: RootState) => state.auth.businessId);
}

function* isCurrentMarketplaceScope(scopeBusinessId: string | null): Generator<any, boolean, any> {
  const currentScopeBusinessId: string | null = yield select(
    (state: RootState) => state.auth.businessId,
  );
  return currentScopeBusinessId === scopeBusinessId;
}

function* handleFetchMarketplaceListing() {
  const scopeBusinessId: string | null = yield* getMarketplaceScopeBusinessId();
  try {
    const response: MarketplaceListingResponse = yield call(getMarketplaceListingApi);
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    yield put(fetchMarketplaceListingAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    yield put(fetchMarketplaceListingAction.failure({ message, scopeBusinessId }));
    const hasRetainedListing: boolean = yield select(
      (state: RootState) =>
        state.marketplace.scopeBusinessId === scopeBusinessId &&
        state.marketplace.listing !== null,
    );
    if (hasRetainedListing) {
      toast.error(message || i18n.t('marketplace:page.toasts.listingDataLoadFailed'));
    }
  }
}

function* handlePublishMarketplaceListing(action: ActionType<typeof publishMarketplaceListingAction.request>) {
  const scopeBusinessId: string | null = yield* getMarketplaceScopeBusinessId();
  try {
    yield call(publishMarketplaceListingApi, action.payload);
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    yield put(publishMarketplaceListingAction.success({ scopeBusinessId }));
    toast.success(i18n.t('marketplace:page.toasts.listingPublished'));
    // Refetch the listing data to get updated state
    yield put(fetchMarketplaceListingAction.request());
  } catch (error: unknown) {
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('marketplace:page.toasts.listingPublishFailed'));
    yield put(publishMarketplaceListingAction.failure({ message, scopeBusinessId }));
  }
}

function* handleUpdateLocationMarketplaceFlags(action: ActionType<typeof updateLocationMarketplaceFlagsAction.request>) {
  const scopeBusinessId: string | null = yield* getMarketplaceScopeBusinessId();
  const { locationId, isPublic, allowOnlineBooking } = action.payload;
  try {
    const result: LocationMarketplaceFlagsResponse = yield call(
      updateLocationMarketplaceFlagsApi,
      locationId,
      { isPublic, allowOnlineBooking },
    );
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    yield put(updateLocationMarketplaceFlagsAction.success({
      locationId: result.id,
      isPublic: result.isPublic,
      allowOnlineBooking: result.allowOnlineBooking,
      scopeBusinessId,
    }));
    if (isPublic !== undefined) {
      toast.success(i18n.t(isPublic ? 'marketplace:page.toasts.locationPublic' : 'marketplace:page.toasts.locationHidden'));
    } else if (allowOnlineBooking !== undefined) {
      toast.success(i18n.t(allowOnlineBooking ? 'marketplace:page.toasts.onlineEnabled' : 'marketplace:page.toasts.onlineDisabled'));
    }
  } catch (error: unknown) {
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    const fallbackKey = allowOnlineBooking !== undefined
      ? 'marketplace:page.toasts.onlineBookingUpdateFailed'
      : 'marketplace:page.toasts.locationVisibilityUpdateFailed';
    toast.error(message || i18n.t(fallbackKey));
    yield put(updateLocationMarketplaceFlagsAction.failure({ locationId, message, scopeBusinessId }));
  }
}

function* handleUpdateBookingSettings(action: ActionType<typeof updateBookingSettingsAction.request>) {
  const scopeBusinessId: string | null = yield* getMarketplaceScopeBusinessId();
  try {
    const response: BookingSettings = yield call(updateBookingSettingsApi, action.payload);
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    yield put(updateBookingSettingsAction.success({ ...response, scopeBusinessId }));
    toast.success(i18n.t('marketplace:page.toasts.bookingSettingsSaved'));
  } catch (error: unknown) {
    if (!(yield* isCurrentMarketplaceScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('marketplace:page.toasts.bookingSettingsSaveFailed'));
    yield put(updateBookingSettingsAction.failure({ message, scopeBusinessId }));
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
