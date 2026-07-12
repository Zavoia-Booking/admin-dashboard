import { takeLatest, call, put, all, select } from "redux-saga/effects";
import {
  fetchWebsiteBuilderAction,
  saveWebsiteDraftAction,
  uploadWebsiteHeroAction,
  deleteWebsiteHeroAction,
  publishWebsiteAction,
  unpublishWebsiteAction,
  fetchWebsiteVariantCatalogAction,
  createWebsiteVariantCheckoutAction,
} from "./actions";
import type { SetWebsiteHeroPayload } from "./actions";
import {
  getWebsiteBuilderApi,
  updateWebsiteDraftApi,
  uploadWebsiteHeroApi,
  deleteWebsiteHeroApi,
  publishWebsiteApi,
  unpublishWebsiteApi,
  getWebsiteVariantCatalogApi,
  createWebsiteVariantCheckoutApi,
} from "./api";
import type {
  WebsiteBuilderResponse,
  WebsiteCatalogResponse,
  WebsiteDraft,
  WebsiteDraftConflict,
  WebsitePublishState,
  WebsiteUnownedPublishItems,
} from "./types";
import type { ActionType } from "typesafe-actions";
import { toast } from "sonner";
import i18n from "../../shared/lib/i18n";
import { getErrorMessage } from "../../shared/utils/error";
import { isNativeApp } from "../../app/config/env";
import type { RootState } from "../../app/providers/store";

function* getWebsiteScopeBusinessId(): Generator<any, string | null, any> {
  return yield select((state: RootState) => state.auth.businessId);
}

function* isCurrentWebsiteScope(scopeBusinessId: string | null): Generator<any, boolean, any> {
  const currentScopeBusinessId: string | null = yield select(
    (state: RootState) => state.auth.businessId,
  );
  return currentScopeBusinessId === scopeBusinessId;
}

/** Raw backend error codes (the `{ message: [code] }` array envelope), untranslated. */
function extractErrorCodes(error: unknown): string[] {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === 'string');
  return typeof message === 'string' ? [message] : [];
}

function* handleFetchWebsiteBuilder() {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  try {
    const response: WebsiteBuilderResponse = yield call(getWebsiteBuilderApi);
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(fetchWebsiteBuilderAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('website:page.toasts.loadFailed'));
    yield put(fetchWebsiteBuilderAction.failure({ message, scopeBusinessId }));
  }
}

function* handleSaveWebsiteDraft(action: ActionType<typeof saveWebsiteDraftAction.request>) {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  try {
    const response: { draft: WebsiteDraft } = yield call(
      updateWebsiteDraftApi,
      action.payload.payload,
    );
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(
      saveWebsiteDraftAction.success({
        draft: response.draft,
        requestId: action.payload.requestId,
        scopeBusinessId,
      }),
    );
    toast.success(i18n.t('website:page.toasts.draftSaved'));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    // 409 WEBSITE_BUILDER.E02: a newer draft exists (another tab saved first). Surface the
    // conflict state — the page offers reload/discard; never silently overwrite.
    if (extractErrorCodes(error).includes('WEBSITE_BUILDER.E02')) {
      const details = (error as { response?: { data?: { details?: WebsiteDraftConflict } } })?.response?.data?.details;
      toast.error(i18n.t('website:page.toasts.draftConflict'));
      yield put(
        saveWebsiteDraftAction.failure({
          message,
          scopeBusinessId,
          conflict: {
            currentVersion: details?.currentVersion ?? 0,
            updatedAt: details?.updatedAt ?? null,
          },
        }),
      );
      return;
    }
    toast.error(message || i18n.t('website:page.toasts.draftSaveFailed'));
    yield put(saveWebsiteDraftAction.failure({ message, scopeBusinessId }));
  }
}

function* heroMutationFailure(
  isUpload: boolean,
  error: unknown,
  scopeBusinessId: string | null,
): Generator<any, void, any> {
  const message = getErrorMessage(error);
  if (extractErrorCodes(error).includes('WEBSITE_BUILDER.E02')) {
    const details = (error as { response?: { data?: { details?: WebsiteDraftConflict } } })?.response?.data?.details;
    toast.error(i18n.t('website:page.toasts.draftConflict'));
    if (isUpload) {
      yield put(
        uploadWebsiteHeroAction.failure({
          message,
          scopeBusinessId,
          conflict: {
            currentVersion: details?.currentVersion ?? 0,
            updatedAt: details?.updatedAt ?? null,
          },
        }),
      );
    } else {
      yield put(
        deleteWebsiteHeroAction.failure({
          message,
          scopeBusinessId,
          conflict: {
            currentVersion: details?.currentVersion ?? 0,
            updatedAt: details?.updatedAt ?? null,
          },
        }),
      );
    }
    return;
  }

  toast.error(message || i18n.t('website:page.toasts.draftSaveFailed'));
  if (isUpload) {
    yield put(uploadWebsiteHeroAction.failure({ message, scopeBusinessId }));
  } else {
    yield put(deleteWebsiteHeroAction.failure({ message, scopeBusinessId }));
  }
}

function* handleUploadWebsiteHero(action: ActionType<typeof uploadWebsiteHeroAction.request>) {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  try {
    const response: SetWebsiteHeroPayload = yield call(
      uploadWebsiteHeroApi,
      action.payload.file,
      action.payload.expectedVersion,
    );
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(uploadWebsiteHeroAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield* heroMutationFailure(true, error, scopeBusinessId);
  }
}

function* handleDeleteWebsiteHero(action: ActionType<typeof deleteWebsiteHeroAction.request>) {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  try {
    const response: SetWebsiteHeroPayload = yield call(
      deleteWebsiteHeroApi,
      action.payload.expectedVersion,
    );
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(deleteWebsiteHeroAction.success({ ...response, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield* heroMutationFailure(false, error, scopeBusinessId);
  }
}

/**
 * Save-then-publish: a dirty form's draft is saved first (its success flows through the
 * normal save reducer/baseline reconciliation), then the just-saved version is frozen into
 * the published snapshot. E07 (locked paid content) refreshes the catalog so the builder's
 * lock states correct themselves; E02 surfaces the standard conflict dialog.
 */
function* handlePublishWebsite(action: ActionType<typeof publishWebsiteAction.request>) {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  try {
    let expectedVersion = action.payload.expectedVersion;
    if (action.payload.save) {
      const saveResponse: { draft: WebsiteDraft } = yield call(
        updateWebsiteDraftApi,
        action.payload.save.payload,
      );
      if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
      yield put(
        saveWebsiteDraftAction.success({
          draft: saveResponse.draft,
          requestId: action.payload.save.requestId,
          scopeBusinessId,
        }),
      );
      expectedVersion = saveResponse.draft.version;
    }

    const response: { publish: WebsitePublishState } = yield call(publishWebsiteApi, expectedVersion);
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(publishWebsiteAction.success({ publish: response.publish, scopeBusinessId }));
    toast.success(i18n.t('website:page.toasts.published'));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    const codes = extractErrorCodes(error);
    if (codes.includes('WEBSITE_BUILDER.E02')) {
      const details = (error as { response?: { data?: { details?: WebsiteDraftConflict } } })?.response?.data?.details;
      toast.error(i18n.t('website:page.toasts.draftConflict'));
      yield put(
        publishWebsiteAction.failure({
          message,
          scopeBusinessId,
          conflict: {
            currentVersion: details?.currentVersion ?? 0,
            updatedAt: details?.updatedAt ?? null,
          },
        }),
      );
      return;
    }
    if (codes.includes('WEBSITE_BUILDER.E07')) {
      const details = (error as { response?: { data?: { details?: WebsiteUnownedPublishItems } } })?.response?.data?.details;
      // Name the blocking items right in the toast — "unlock styles" alone doesn't say which.
      const lockedNames = [
        ...(details?.unownedVariants ?? []).map((v) => v.name),
        ...(details?.unownedSections ?? []).map((s) => s.name),
      ];
      toast.error(i18n.t('website:page.toasts.publishLockedItems'), {
        description: lockedNames.length > 0 ? lockedNames.join(' · ') : undefined,
      });
      // Ownership drifted (refund/admin change) — refresh so lock states re-render truthfully.
      yield put(fetchWebsiteVariantCatalogAction.request());
      yield put(
        publishWebsiteAction.failure({
          message,
          scopeBusinessId,
          lockedItems: lockedNames.length > 0 ? lockedNames : undefined,
        }),
      );
      return;
    }
    toast.error(message || i18n.t('website:page.toasts.publishFailed'));
    yield put(publishWebsiteAction.failure({ message, scopeBusinessId }));
  }
}

function* handleUnpublishWebsite() {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  try {
    const response: { publish: WebsitePublishState } = yield call(unpublishWebsiteApi);
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(unpublishWebsiteAction.success({ publish: response.publish, scopeBusinessId }));
    toast.success(i18n.t('website:page.toasts.unpublished'));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('website:page.toasts.unpublishFailed'));
    yield put(unpublishWebsiteAction.failure({ message, scopeBusinessId }));
  }
}

/**
 * Store catalog fetch (sections + variants). Deliberately silent on failure: without it
 * the builder falls back to its code-side defaults and the server still enforces ownership
 * at publish/delivery.
 */
function* handleFetchWebsiteVariantCatalog() {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  try {
    const catalog: WebsiteCatalogResponse = yield call(getWebsiteVariantCatalogApi);
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(fetchWebsiteVariantCatalogAction.success({ ...catalog, scopeBusinessId }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(fetchWebsiteVariantCatalogAction.failure({ message: getErrorMessage(error), scopeBusinessId }));
  }
}

function* handleCreateWebsiteVariantCheckout(action: ActionType<typeof createWebsiteVariantCheckoutAction.request>) {
  const scopeBusinessId: string | null = yield* getWebsiteScopeBusinessId();
  if (isNativeApp()) {
    // Store policy: no Stripe web checkout inside the native webview — purchase UI is hidden,
    // but this backstops any action that slips through.
    yield put(createWebsiteVariantCheckoutAction.failure({ message: "", scopeBusinessId }));
    return;
  }
  try {
    const response: { url: string } = yield call(createWebsiteVariantCheckoutApi, action.payload);
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    yield put(createWebsiteVariantCheckoutAction.success({ ...response, scopeBusinessId }));
    if (response.url) {
      // Mirrors the SMS/subscription checkout flow: hand the tab to Stripe; successUrl
      // brings the owner back to /website with the session id for reconciliation.
      window.location.href = response.url;
    }
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scopeBusinessId))) return;
    // WEBSITE_VARIANTS / WEBSITE_SECTIONS codes (not found/inactive, free, already
    // owned, needs the Plus plan) translate to specific copy via the `messages` namespace.
    const message = getErrorMessage(error);
    toast.error(message || i18n.t('website:page.toasts.checkoutFailed'));
    // Already owned / no longer purchasable — refresh ownership so the UI corrects itself.
    const codes = extractErrorCodes(error);
    const staleOwnershipCodes = [
      'WEBSITE_VARIANTS.E04', 'WEBSITE_VARIANTS.E01', 'WEBSITE_VARIANTS.E03', 'WEBSITE_VARIANTS.E13',
      'WEBSITE_SECTIONS.E05', 'WEBSITE_SECTIONS.E01', 'WEBSITE_SECTIONS.E04',
    ];
    if (codes.some((c: string) => staleOwnershipCodes.includes(c))) {
      yield put(fetchWebsiteVariantCatalogAction.request());
    }
    yield put(createWebsiteVariantCheckoutAction.failure({ message, scopeBusinessId }));
  }
}

export function* websiteSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchWebsiteBuilderAction.request, handleFetchWebsiteBuilder),
    takeLatest(saveWebsiteDraftAction.request, handleSaveWebsiteDraft),
    takeLatest(uploadWebsiteHeroAction.request, handleUploadWebsiteHero),
    takeLatest(deleteWebsiteHeroAction.request, handleDeleteWebsiteHero),
    takeLatest(publishWebsiteAction.request, handlePublishWebsite),
    takeLatest(unpublishWebsiteAction.request, handleUnpublishWebsite),
    takeLatest(fetchWebsiteVariantCatalogAction.request, handleFetchWebsiteVariantCatalog),
    takeLatest(createWebsiteVariantCheckoutAction.request, handleCreateWebsiteVariantCheckout),
  ]);
}
