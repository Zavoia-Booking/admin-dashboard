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

function* handleFetchMarketplaceListing() {
  try {
    const response: MarketplaceListingResponse = yield call(getMarketplaceListingApi);
    yield put(fetchMarketplaceListingAction.success(response));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to fetch marketplace listing";
    yield put(fetchMarketplaceListingAction.failure({ message }));
  }
}

function* handlePublishMarketplaceListing(action: ActionType<typeof publishMarketplaceListingAction.request>) {
  try {
    yield call(publishMarketplaceListingApi, action.payload);
    yield put(publishMarketplaceListingAction.success());
    toast.success('Marketplace listing published successfully!');
    // Refetch the listing data to get updated state
    yield put(fetchMarketplaceListingAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to publish marketplace listing";
    toast.error(message);
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
      toast.success(isPublic ? 'Location is now public on the marketplace' : 'Location is hidden from the marketplace');
    } else if (allowOnlineBooking !== undefined) {
      toast.success(allowOnlineBooking ? 'Online appointments enabled for this location' : 'Online appointments disabled for this location');
    }
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to update location";
    toast.error(message);
    yield put(updateLocationMarketplaceFlagsAction.failure({ locationId, message }));
  }
}

function* handleUpdateBookingSettings(action: ActionType<typeof updateBookingSettingsAction.request>) {
  try {
    const response: BookingSettings = yield call(updateBookingSettingsApi, action.payload);
    yield put(updateBookingSettingsAction.success(response));
    toast.success('Booking settings saved successfully!');
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to save booking settings";
    toast.error(message);
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
