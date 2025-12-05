import { takeLatest, call, put, all } from "redux-saga/effects";
import { 
  fetchMarketplaceListingAction, 
  publishMarketplaceListingAction, 
  updateMarketplaceVisibilityAction,
  fetchBookingSettingsAction,
  updateBookingSettingsAction,
} from "./actions";
import { 
  getMarketplaceListingApi, 
  publishMarketplaceListingApi, 
  updateMarketplaceVisibilityApi,
  getBookingSettingsApi,
  updateBookingSettingsApi,
} from "./api";
import type { MarketplaceListingResponse, BookingSettings } from "./types";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";

function* handleFetchMarketplaceListing(action: ActionType<typeof fetchMarketplaceListingAction.request>) {
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

function* handleUpdateMarketplaceVisibility(action: ActionType<typeof updateMarketplaceVisibilityAction.request>) {
  try {
    const result: { isVisible: boolean } = yield call(updateMarketplaceVisibilityApi, action.payload.isVisible);
    yield put(updateMarketplaceVisibilityAction.success({ isVisible: result.isVisible }));
    toast.success(result.isVisible ? 'Listing is now visible to users' : 'Listing is now hidden from users');
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to update visibility";
    toast.error(message);
    yield put(updateMarketplaceVisibilityAction.failure({ message }));
  }
}

function* handleFetchBookingSettings() {
  try {
    const response: BookingSettings = yield call(getBookingSettingsApi);
    yield put(fetchBookingSettingsAction.success(response));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Failed to fetch booking settings";
    yield put(fetchBookingSettingsAction.failure({ message }));
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
    takeLatest(updateMarketplaceVisibilityAction.request, handleUpdateMarketplaceVisibility),
    takeLatest(fetchBookingSettingsAction.request, handleFetchBookingSettings),
    takeLatest(updateBookingSettingsAction.request, handleUpdateBookingSettings),
  ]);
}

