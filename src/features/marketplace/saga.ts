import { takeLatest, takeEvery, call, put, all } from "redux-saga/effects";
import {
  fetchMarketplaceListingAction,
  publishMarketplaceListingAction,
  updateLocationMarketplaceFlagsAction,
  updateBookingSettingsAction,
  fetchWebsiteVariantCatalogAction,
  createWebsiteVariantCheckoutAction,
} from "./actions";
import {
  getMarketplaceListingApi,
  publishMarketplaceListingApi,
  updateLocationMarketplaceFlagsApi,
  updateBookingSettingsApi,
  getWebsiteVariantCatalogApi,
  createWebsiteVariantCheckoutApi,
  type LocationMarketplaceFlagsResponse,
} from "./api";
import type { MarketplaceListingResponse, BookingSettings, WebsiteCatalogResponse } from "./types";
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

/** Raw backend error codes (the `{ message: [code] }` array envelope), untranslated. */
function extractErrorCodes(error: unknown): string[] {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === 'string');
  return typeof message === 'string' ? [message] : [];
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
    // 403 MARKETPLACE_LISTING.E18: the layout uses paid variants the business doesn't own
    // (e.g. the catalog changed after the builder loaded). Name the offending variants and
    // refetch the catalog so the matching layout pills lock up.
    const unownedVariants = (
      error as { response?: { data?: { details?: { unownedVariants?: Array<{ sectionType?: string; variantKey?: string; name?: string }> } } } }
    )?.response?.data?.details?.unownedVariants;
    if (extractErrorCodes(error).includes('MARKETPLACE_LISTING.E18') && Array.isArray(unownedVariants) && unownedVariants.length > 0) {
      const names = unownedVariants
        .map((v) => v.name || [v.sectionType, v.variantKey].filter(Boolean).join(' / '))
        .filter(Boolean)
        .join(', ');
      toast.error(i18n.t('marketplace:page.toasts.publishUnownedVariants', { variants: names }));
      yield put(fetchWebsiteVariantCatalogAction.request());
      yield put(publishMarketplaceListingAction.failure({ message }));
      return;
    }
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

/**
 * Website catalog fetch (sections + variants). Deliberately silent on failure: without it
 * the builder falls back to its code-side defaults and the server still enforces ownership
 * at publish (MARKETPLACE_LISTING.E18/E19).
 */
function* handleFetchWebsiteVariantCatalog() {
  try {
    const catalog: WebsiteCatalogResponse = yield call(getWebsiteVariantCatalogApi);
    yield put(fetchWebsiteVariantCatalogAction.success(catalog));
  } catch (error: unknown) {
    yield put(fetchWebsiteVariantCatalogAction.failure({ message: getErrorMessage(error) }));
  }
}

function* handleCreateWebsiteVariantCheckout(action: ActionType<typeof createWebsiteVariantCheckoutAction.request>) {
  try {
    const response: { url: string } = yield call(createWebsiteVariantCheckoutApi, action.payload);
    yield put(createWebsiteVariantCheckoutAction.success(response));
    if (response.url) {
      // Mirrors the SMS/subscription checkout flow: hand the tab to Stripe; successUrl
      // brings the owner back to the builder.
      window.location.href = response.url;
    }
  } catch (error: unknown) {
    // WEBSITE_VARIANTS / WEBSITE_SECTIONS codes (not found/inactive, free, already
    // owned, needs the Plus plan) translate to specific copy via the `messages` namespace.
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('marketplace:page.toasts.variantCheckoutFailed'));
    // Already owned / no longer purchasable — refresh ownership so the UI corrects itself.
    const codes = extractErrorCodes(error);
    const staleOwnershipCodes = [
      'WEBSITE_VARIANTS.E04', 'WEBSITE_VARIANTS.E01', 'WEBSITE_VARIANTS.E03',
      'WEBSITE_SECTIONS.E05', 'WEBSITE_SECTIONS.E01', 'WEBSITE_SECTIONS.E04',
    ];
    if (codes.some((c: string) => staleOwnershipCodes.includes(c))) {
      yield put(fetchWebsiteVariantCatalogAction.request());
    }
    yield put(createWebsiteVariantCheckoutAction.failure({ message }));
  }
}

export function* marketplaceSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchMarketplaceListingAction.request, handleFetchMarketplaceListing),
    takeLatest(publishMarketplaceListingAction.request, handlePublishMarketplaceListing),
    takeEvery(updateLocationMarketplaceFlagsAction.request, handleUpdateLocationMarketplaceFlags),
    takeLatest(updateBookingSettingsAction.request, handleUpdateBookingSettings),
    takeLatest(fetchWebsiteVariantCatalogAction.request, handleFetchWebsiteVariantCatalog),
    takeLatest(createWebsiteVariantCheckoutAction.request, handleCreateWebsiteVariantCheckout),
  ]);
}
