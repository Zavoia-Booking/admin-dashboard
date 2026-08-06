import { buffers } from "redux-saga";
import {
  actionChannel,
  all,
  call,
  cancelled,
  flush,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  fetchWebsiteBuilderAction,
  enterWebsiteBuilderAction,
  saveWebsiteDraftAction,
  uploadWebsiteHeroAction,
  deleteWebsiteHeroAction,
  publishWebsiteAction,
  unpublishWebsiteAction,
  fetchWebsiteVariantCatalogAction,
  createWebsiteVariantCheckoutAction,
  cancelWebsiteMutationIntentsAction,
} from "./actions";
import type {
  SetWebsiteHeroPayload,
  WebsiteMutationScope,
  WebsiteScope,
} from "./actions";
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
  WebsiteSaveFailureKind,
  WebsiteUnownedPublishItems,
  UpdateWebsiteDraftPayload,
} from "./types";
import { createAction, getType, type ActionType } from "typesafe-actions";
import i18n from "../../shared/lib/i18n";
import { websiteToast as toast } from "./websiteToast";
import {
  getErrorMessage,
  wasGlobalHttpErrorToastHandled,
} from "../../shared/utils/error";
import { isNativeApp } from "../../app/config/env";
import type { RootState } from "../../app/providers/store";
import { BRAND_ACCENT_CATALOG, FONT_CATALOG } from "./components/builder/theme";

function normalizeScopeBusinessId(value: string | number | null | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

function* getWebsiteScope(): Generator<any, WebsiteScope, any> {
  return yield select((state: RootState) => ({
    scopeBusinessId: state.website.scopeBusinessId,
    scopeRevision: state.website.scopeRevision,
  }));
}

function* getWebsiteMutationScope(): Generator<any, WebsiteMutationScope, any> {
  return yield select((state: RootState) => ({
    scopeBusinessId: state.website.scopeBusinessId,
    scopeRevision: state.website.scopeRevision,
    mutationGeneration: state.website.mutationGeneration,
  }));
}

function* isCurrentWebsiteScope(scope: WebsiteScope): Generator<any, boolean, any> {
  return yield select(
    (state: RootState) =>
      state.website.scopeBusinessId === scope.scopeBusinessId &&
      state.website.scopeRevision === scope.scopeRevision &&
      normalizeScopeBusinessId(state.auth.businessId) === scope.scopeBusinessId,
  );
}

function* isCurrentWebsiteMutationScope(
  scope: WebsiteMutationScope,
): Generator<any, boolean, any> {
  return yield select(
    (state: RootState) =>
      state.website.scopeBusinessId === scope.scopeBusinessId &&
      state.website.scopeRevision === scope.scopeRevision &&
      state.website.mutationGeneration === scope.mutationGeneration &&
      normalizeScopeBusinessId(state.auth.businessId) === scope.scopeBusinessId,
  );
}

/** Raw backend error codes (the `{ message: [code] }` array envelope), untranslated. */
function extractErrorCodes(error: unknown): string[] {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.filter((m): m is string => typeof m === 'string');
  return typeof message === 'string' ? [message] : [];
}

const hasHttpResponse = (error: unknown): boolean =>
  !!(error as { response?: unknown })?.response;

const isAmbiguousMutationFailure = (error: unknown): boolean => {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return !hasHttpResponse(error) || (typeof status === "number" && status >= 500);
};

const browserIsOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

const shouldShowFeatureErrorToast = (error: unknown): boolean =>
  !wasGlobalHttpErrorToastHandled(error, "subscription_required");

// A feature block on a mutation means entitlements changed mid-session; refetch so the
// access flags (and the gated UI) resync instead of retry-looping the same failure.
function* resyncAccessAfterFeatureBlock(codes: string[]): Generator<any, void, any> {
  if (codes.includes("WEBSITE_BUILDER.E01") || codes.includes("WEBSITE_BUILDER.E09")) {
    yield put(fetchWebsiteBuilderAction.request());
  }
}

const showDraftConflictToast = () =>
  toast.warning(i18n.t("website:page.toasts.draftConflict"), {
    id: "website-draft-conflict",
  });

function canonicalJson(value: unknown): string {
  const normalize = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (entry && typeof entry === "object") {
      return Object.fromEntries(
        Object.entries(entry as Record<string, unknown>)
          .filter(([, item]) => item !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, normalize(item)]),
      );
    }
    return entry;
  };
  return JSON.stringify(normalize(value));
}

const normalizeThemeAssetKey = (value: string | null | undefined): string | null =>
  value?.trim().toLowerCase() || null;

const normalizeThemeHex = (value: string | null | undefined): string | null =>
  value?.trim().toUpperCase() || null;

/** Compare only fields written by PUT /website-builder. Hero and publish metadata are
 * intentionally excluded because they belong to separate versioned commands. */
function draftMatchesSavePayload(
  draft: WebsiteDraft,
  payload: UpdateWebsiteDraftPayload,
): boolean {
  const compareBrandColorKey =
    payload.brandColorKey !== undefined || payload.pageTheme.brandColorKey !== undefined;
  const payloadBrandColorKey = normalizeThemeAssetKey(
    payload.brandColorKey ?? payload.pageTheme.brandColorKey,
  );
  const draftBrandColorKey = normalizeThemeAssetKey(
    draft.brandColorKey ?? draft.pageTheme?.brandColorKey,
  );

  return canonicalJson({
    tagline: draft.tagline ?? null,
    aboutContent: draft.aboutContent ?? null,
    establishedYear: draft.establishedYear ?? null,
    brandColorHex: normalizeThemeHex(draft.brandColorHex),
    ...(compareBrandColorKey ? { brandColorKey: draftBrandColorKey } : {}),
    pageLayout: draft.pageLayout ?? [],
    pageTheme: {
      brandColor: normalizeThemeHex(draft.pageTheme?.brandColor),
      fontKey: normalizeThemeAssetKey(draft.pageTheme?.fontKey),
      ...(compareBrandColorKey ? { brandColorKey: draftBrandColorKey } : {}),
    },
    faq: draft.faq ?? [],
    announcement: draft.announcement ?? null,
    layoutVersion: draft.layoutVersion,
  }) === canonicalJson({
    tagline: payload.tagline,
    aboutContent: payload.aboutContent,
    establishedYear: payload.establishedYear,
    brandColorHex: normalizeThemeHex(payload.brandColorHex),
    ...(compareBrandColorKey ? { brandColorKey: payloadBrandColorKey } : {}),
    pageLayout: payload.pageLayout,
    pageTheme: {
      brandColor: normalizeThemeHex(payload.pageTheme.brandColor),
      fontKey: normalizeThemeAssetKey(payload.pageTheme.fontKey),
      ...(compareBrandColorKey ? { brandColorKey: payloadBrandColorKey } : {}),
    },
    faq: payload.faq,
    announcement: payload.announcement,
    layoutVersion: payload.layoutVersion,
  });
}

function* getCurrentDraftVersion(
  scope: WebsiteMutationScope,
  fallback: number,
): Generator<any, number | null, any> {
  const result: { current: boolean; version: number | null | undefined } = yield select(
    (state: RootState) => ({
      current:
        state.website.scopeBusinessId === scope.scopeBusinessId &&
        state.website.scopeRevision === scope.scopeRevision &&
        state.website.mutationGeneration === scope.mutationGeneration &&
        normalizeScopeBusinessId(state.auth.businessId) === scope.scopeBusinessId,
      version: state.website.draft?.version,
    }),
  );
  if (!result.current) return null;
  return typeof result.version === "number" ? result.version : fallback;
}

type SaveAttemptResult =
  | { ok: true; draft: WebsiteDraft }
  | {
      ok: false;
      message: string;
      failureKind: WebsiteSaveFailureKind | "conflict";
      conflict?: WebsiteDraftConflict;
      lockedItems?: WebsiteUnownedPublishItems;
    };

function* handleFetchWebsiteBuilder(): Generator<any, void, any> {
  const scope = yield* getWebsiteScope();
  const abortController = new AbortController();
  try {
    const response: WebsiteBuilderResponse = yield call(getWebsiteBuilderApi, {
      signal: abortController.signal,
    });
    if (!(yield* isCurrentWebsiteScope(scope))) return;
    yield put(fetchWebsiteBuilderAction.success({ ...response, ...scope }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scope))) return;
    const message = getErrorMessage(error);
    yield put(fetchWebsiteBuilderAction.failure({ message, ...scope }));
    const hasRenderableWorkspace: boolean = yield select(
      (state: RootState) =>
        state.website.scopeBusinessId === scope.scopeBusinessId &&
        state.website.scopeRevision === scope.scopeRevision &&
        Boolean(state.website.identity && state.website.draft && state.website.access),
    );
    if (hasRenderableWorkspace && shouldShowFeatureErrorToast(error)) {
      toast.error(message || i18n.t('website:page.toasts.loadFailed'), {
        id: "website-load-failed",
      });
    }
  } finally {
    if (yield cancelled()) abortController.abort();
  }
}

function* putSaveFailure(
  request: ActionType<typeof saveWebsiteDraftAction.request>["payload"],
  scope: WebsiteScope,
  result: Exclude<SaveAttemptResult, { ok: true }>,
): Generator<any, void, any> {
  yield put(
    saveWebsiteDraftAction.failure({
      message: result.message,
      ...scope,
      requestId: request.requestId,
      workingSignature: request.workingSignature,
      failureKind: result.failureKind,
      conflict: result.conflict,
      lockedItems: result.lockedItems,
    }),
  );
}

/** One immutable save attempt. The coordinator injects the latest locally known version
 * at execution time. If the PUT loses its response, a single GET proves whether that exact
 * body committed; it is never retried blindly. */
function* performSaveWebsiteDraft(
  request: ActionType<typeof saveWebsiteDraftAction.request>["payload"],
  scope: WebsiteMutationScope,
): Generator<any, SaveAttemptResult | null, any> {
  const expectedVersion = yield* getCurrentDraftVersion(scope, 0);
  if (expectedVersion === null) return null;
  const payload: UpdateWebsiteDraftPayload = { ...request.body, expectedVersion };

  if (request.reconcileFirst) {
    try {
      const current: WebsiteBuilderResponse = yield call(getWebsiteBuilderApi);
      if (!(yield* isCurrentWebsiteMutationScope(scope))) return null;

      if (draftMatchesSavePayload(current.draft, payload)) {
        yield put(
          saveWebsiteDraftAction.success({
            draft: current.draft,
            requestId: request.requestId,
            ...scope,
          }),
        );
        return { ok: true, draft: current.draft };
      }

      if (current.draft.version !== expectedVersion) {
        const result: Exclude<SaveAttemptResult, { ok: true }> = {
          ok: false,
          message: i18n.t("website:page.toasts.draftConflict"),
          failureKind: "conflict",
          conflict: {
            currentVersion: current.draft.version,
            updatedAt: current.draft.updatedAt,
          },
        };
        showDraftConflictToast();
        yield* putSaveFailure(request, scope, result);
        return result;
      }
    } catch (error: unknown) {
      if (!(yield* isCurrentWebsiteMutationScope(scope))) return null;
      const result: Exclude<SaveAttemptResult, { ok: true }> = {
        ok: false,
        message: getErrorMessage(error),
        // A failed reconciliation read does not establish that the browser is offline.
        // `navigator.onLine` is only a hint, but it is the one distinction the UI can
        // safely make here; every other case stays retryable as a generic failure.
        failureKind: browserIsOffline() ? "offline" : "failed",
      };
      yield* putSaveFailure(request, scope, result);
      return result;
    }
  }

  try {
    const response: { draft: WebsiteDraft } = yield call(updateWebsiteDraftApi, payload);
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return null;
    yield put(
      saveWebsiteDraftAction.success({
        draft: response.draft,
        requestId: request.requestId,
        ...scope,
      }),
    );
    return { ok: true, draft: response.draft };
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return null;
    const message = getErrorMessage(error);

    const errorCodes = extractErrorCodes(error);

    if (errorCodes.includes("WEBSITE_BUILDER.E02")) {
      const details = (error as { response?: { data?: { details?: WebsiteDraftConflict } } })
        ?.response?.data?.details;
      const result: Exclude<SaveAttemptResult, { ok: true }> = {
        ok: false,
        message,
        failureKind: "conflict",
        conflict: {
          currentVersion: details?.currentVersion ?? 0,
          updatedAt: details?.updatedAt ?? null,
        },
      };
      if (shouldShowFeatureErrorToast(error)) {
        showDraftConflictToast();
      }
      yield* putSaveFailure(request, scope, result);
      return result;
    }

    const themeOwnershipDrift = errorCodes.some((code) =>
      ["WEBSITE_THEME_ASSETS.E01", "WEBSITE_THEME_ASSETS.E03", "WEBSITE_THEME_ASSETS.E04"].includes(code),
    );
    let lockedItems: WebsiteUnownedPublishItems | undefined;
    if (themeOwnershipDrift) {
      const details = (error as {
        response?: { data?: { details?: { themeAssetId?: unknown; assetKey?: unknown } } };
      })?.response?.data?.details;
      const assetKey = typeof details?.assetKey === "string" ? details.assetKey.trim().toLowerCase() : "";
      const colorKey = payload.brandColorKey?.trim().toLowerCase() ?? "";
      const colorHex = payload.brandColorHex?.trim().toLowerCase() ?? "";
      const fontKey = payload.pageTheme.fontKey?.trim().toLowerCase() ?? "";
      const knownColor = BRAND_ACCENT_CATALOG.find((accent) => accent.key === assetKey);
      const knownFont = FONT_CATALOG.find((font) => font.key === assetKey);
      const kind =
        assetKey &&
        (assetKey === colorKey ||
          (!!knownColor &&
            !!colorHex &&
            knownColor.hex.toLowerCase() === colorHex))
          ? "color"
          : assetKey && (assetKey === fontKey || !!knownFont)
            ? "font"
            : null;
      const id = Number(details?.themeAssetId);
      if (kind && Number.isInteger(id) && id > 0) {
        lockedItems = {
          unownedVariants: [],
          unownedSections: [],
          unownedThemeAssets: [{
            id,
            kind,
            assetKey,
            value: kind === "color" ? knownColor?.hex ?? payload.brandColorHex ?? undefined : assetKey,
            name: knownColor?.name ?? knownFont?.name ?? assetKey,
          }],
        };
      }
      // A refund or admin catalog change may race a last-good catalog snapshot. Refresh it
      // immediately; the exact failed local save remains available for recovery/retry.
      yield put(fetchWebsiteVariantCatalogAction.request());
    }

    if (isAmbiguousMutationFailure(error)) {
      try {
        const current: WebsiteBuilderResponse = yield call(getWebsiteBuilderApi);
        if (!(yield* isCurrentWebsiteMutationScope(scope))) return null;

        if (
          current.draft.version > expectedVersion &&
          draftMatchesSavePayload(current.draft, payload)
        ) {
          yield put(
            saveWebsiteDraftAction.success({
              draft: current.draft,
              requestId: request.requestId,
              ...scope,
            }),
          );
          return { ok: true, draft: current.draft };
        }

        if (current.draft.version > expectedVersion) {
          const result: Exclude<SaveAttemptResult, { ok: true }> = {
            ok: false,
            message,
            failureKind: "conflict",
            conflict: {
              currentVersion: current.draft.version,
              updatedAt: current.draft.updatedAt,
            },
          };
          if (shouldShowFeatureErrorToast(error)) {
            showDraftConflictToast();
          }
          yield* putSaveFailure(request, scope, result);
          return result;
        }
      } catch {
        // The reconciliation read also failed. Preserve the exact local snapshot and wait
        // for an explicit online event or user retry; never issue another PUT from here.
      }
    }

    // A reconciliation GET that fails is still ambiguous, but it is not necessarily an
    // offline condition (a 5xx or an intermediary may be the cause). Preserve the local
    // snapshot and require an explicit GET-first retry; only show `offline` when the
    // browser itself reports no network.
    const failureKind: WebsiteSaveFailureKind = browserIsOffline()
      ? "offline"
      : "failed";
    const result: Exclude<SaveAttemptResult, { ok: true }> = {
      ok: false,
      message,
      failureKind,
      lockedItems,
    };
    if (failureKind === "failed" && shouldShowFeatureErrorToast(error)) {
      if (themeOwnershipDrift) {
        toast.warning(i18n.t("website:page.toasts.themeAccessChanged"), {
          id: "website-theme-access-changed",
        });
      } else {
        // Access-block copy references plans/billing — never surface it in the native app.
        const neutralNativeBlock =
          isNativeApp() && errorCodes.includes("WEBSITE_BUILDER.E01");
        toast.error(
          neutralNativeBlock
            ? i18n.t("website:page.toasts.draftSaveFailed")
            : message || i18n.t("website:page.toasts.draftSaveFailed"),
          {
            id: "website-save-failed",
          },
        );
      }
    }
    yield* putSaveFailure(request, scope, result);
    yield* resyncAccessAfterFeatureBlock(errorCodes);
    return result;
  }
}

function* handleSaveWebsiteDraft(
  action: ActionType<typeof saveWebsiteDraftAction.request>,
  scope: WebsiteMutationScope,
) {
  yield* performSaveWebsiteDraft(action.payload, scope);
}

function* heroMutationFailure(
  isUpload: boolean,
  error: unknown,
  scope: WebsiteMutationScope,
  expectedVersion: number,
): Generator<any, void, any> {
  const message = getErrorMessage(error);
  if (extractErrorCodes(error).includes('WEBSITE_BUILDER.E02')) {
    const details = (error as { response?: { data?: { details?: WebsiteDraftConflict } } })?.response?.data?.details;
    if (shouldShowFeatureErrorToast(error)) {
      showDraftConflictToast();
    }
    if (isUpload) {
      yield put(
        uploadWebsiteHeroAction.failure({
          message,
          ...scope,
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
          ...scope,
          conflict: {
            currentVersion: details?.currentVersion ?? 0,
            updatedAt: details?.updatedAt ?? null,
          },
        }),
      );
    }
    return;
  }

  if (isAmbiguousMutationFailure(error)) {
    try {
      const current: WebsiteBuilderResponse = yield call(getWebsiteBuilderApi);
      if (!(yield* isCurrentWebsiteMutationScope(scope))) return;

      if (
        !isUpload &&
        current.draft.version > expectedVersion &&
        current.draft.heroImageUrl === null &&
        current.draft.heroImageKey === null
      ) {
        yield put(
          deleteWebsiteHeroAction.success({
            heroImageUrl: null,
            version: current.draft.version,
            updatedAt: current.draft.updatedAt,
            ...scope,
          }),
        );
        return;
      }

      // A lost upload response cannot be attributed to this file from GET alone.
      // Any changed version/hero is therefore a conflict, never an assumed success.
      if (current.draft.version > expectedVersion) {
        const conflict = {
          currentVersion: current.draft.version,
          updatedAt: current.draft.updatedAt,
        };
        if (shouldShowFeatureErrorToast(error)) {
          showDraftConflictToast();
        }
        if (isUpload) {
          yield put(uploadWebsiteHeroAction.failure({ message, ...scope, conflict }));
        } else {
          yield put(deleteWebsiteHeroAction.failure({ message, ...scope, conflict }));
        }
        return;
      }
    } catch {
      // The read could not prove the result. Keep the local draft and require a new intent.
    }
  }

  if (shouldShowFeatureErrorToast(error)) {
    // Access-block copy references plans/billing — never surface it in the native app.
    const neutralNativeBlock =
      isNativeApp() && extractErrorCodes(error).includes("WEBSITE_BUILDER.E01");
    toast.error(
      neutralNativeBlock
        ? i18n.t("website:page.toasts.draftSaveFailed")
        : message || i18n.t("website:page.toasts.draftSaveFailed"),
      {
        id: "website-hero-update-failed",
      },
    );
  }
  if (isUpload) {
    yield put(uploadWebsiteHeroAction.failure({ message, ...scope }));
  } else {
    yield put(deleteWebsiteHeroAction.failure({ message, ...scope }));
  }
  yield* resyncAccessAfterFeatureBlock(extractErrorCodes(error));
}

function* handleUploadWebsiteHero(
  action: ActionType<typeof uploadWebsiteHeroAction.request>,
  scope: WebsiteMutationScope,
) {
  const expectedVersion = yield* getCurrentDraftVersion(scope, 0);
  if (expectedVersion === null) return;
  try {
    const response: SetWebsiteHeroPayload = yield call(
      uploadWebsiteHeroApi,
      action.payload.file,
      expectedVersion,
    );
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    yield put(uploadWebsiteHeroAction.success({ ...response, ...scope }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    yield* heroMutationFailure(true, error, scope, expectedVersion);
  }
}

function* handleDeleteWebsiteHero(scope: WebsiteMutationScope) {
  const expectedVersion = yield* getCurrentDraftVersion(scope, 0);
  if (expectedVersion === null) return;
  try {
    const response: SetWebsiteHeroPayload = yield call(
      deleteWebsiteHeroApi,
      expectedVersion,
    );
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    yield put(deleteWebsiteHeroAction.success({ ...response, ...scope }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    yield* heroMutationFailure(false, error, scope, expectedVersion);
  }
}

/**
 * Save-then-publish: a dirty form's draft is saved first (its success flows through the
 * normal save reducer/baseline reconciliation), then the just-saved version is frozen into
 * the published snapshot. E07 (locked paid content) refreshes the catalog so the builder's
 * lock states correct themselves; E02 surfaces the standard conflict dialog.
 */
function* handlePublishWebsite(
  action: ActionType<typeof publishWebsiteAction.request>,
  scope: WebsiteMutationScope,
) {
  let expectedVersion = yield* getCurrentDraftVersion(scope, 0);
  if (expectedVersion === null) return;

  if (action.payload.save) {
    const saveResult = yield* performSaveWebsiteDraft(
      action.payload.save,
      scope,
    );
    if (!saveResult) return;
    if (!saveResult.ok) {
      yield put(
        publishWebsiteAction.failure({
          message: saveResult.message,
          ...scope,
          failureKind: saveResult.conflict ? 'conflict' : 'save',
          conflict: saveResult.conflict,
        }),
      );
      return;
    }
    expectedVersion = saveResult.draft.version;
  }
  if (!(yield* isCurrentWebsiteMutationScope(scope))) return;

  try {
    const response: { publish: WebsitePublishState } = yield call(publishWebsiteApi, expectedVersion);
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    yield put(publishWebsiteAction.success({ publish: response.publish, ...scope }));
    toast.success(i18n.t('website:page.toasts.published'), {
      id: "website-published",
    });
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    const message = getErrorMessage(error);
    const codes = extractErrorCodes(error);
    yield* resyncAccessAfterFeatureBlock(codes);

    // A lost response is ambiguous: publishing may have committed. Read once and
    // acknowledge only the exact published version; never replay POST automatically.
    if (isAmbiguousMutationFailure(error)) {
      try {
        const current: WebsiteBuilderResponse = yield call(getWebsiteBuilderApi);
        if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
        if (
          current.publish.isPublished &&
          current.publish.publishedVersion === expectedVersion
        ) {
          yield put(
            publishWebsiteAction.success({
              publish: current.publish,
              ...scope,
            }),
          );
          return;
        }
        if (current.draft.version !== expectedVersion) {
          const conflict = {
            currentVersion: current.draft.version,
            updatedAt: current.draft.updatedAt,
          };
          if (shouldShowFeatureErrorToast(error)) {
            showDraftConflictToast();
          }
          yield put(
            publishWebsiteAction.failure({
              message,
              ...scope,
              failureKind: 'conflict',
              conflict,
            }),
          );
          return;
        }
      } catch {
        // Surface the failure below. A retry is a new explicit publish intent.
      }
    }

    if (codes.includes('WEBSITE_BUILDER.E02')) {
      const details = (error as { response?: { data?: { details?: WebsiteDraftConflict } } })?.response?.data?.details;
      if (shouldShowFeatureErrorToast(error)) {
        showDraftConflictToast();
      }
      yield put(
        publishWebsiteAction.failure({
          message,
          ...scope,
          failureKind: 'conflict',
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
        ...(details?.unownedThemeAssets ?? []).map((asset) => asset.name),
      ];
      if (shouldShowFeatureErrorToast(error)) {
        toast.warning(i18n.t('website:page.toasts.publishLockedItems'), {
          id: "website-publish-locked-items",
          description: lockedNames.length > 0 ? lockedNames.join(' · ') : undefined,
        });
      }
      // Ownership drifted (refund/admin change) — refresh so lock states re-render truthfully.
      yield put(fetchWebsiteVariantCatalogAction.request());
      yield put(
        publishWebsiteAction.failure({
          message,
          ...scope,
          failureKind: 'locked',
          lockedItems: details,
        }),
      );
      return;
    }
    if (codes.includes('WEBSITE_BUILDER.E09')) {
      // Plan-gated publish. The web UI intercepts with the upgrade dialog before any
      // request, so this backstops mid-session downgrades; native gets neutral copy only.
      if (shouldShowFeatureErrorToast(error)) {
        toast.error(
          isNativeApp()
            ? i18n.t('website:page.toasts.publishUnavailable')
            : message || i18n.t('website:page.toasts.publishFailed'),
          { id: "website-publish-failed" },
        );
      }
      yield put(
        publishWebsiteAction.failure({
          message,
          ...scope,
          failureKind: 'publish',
        }),
      );
      return;
    }
    if (shouldShowFeatureErrorToast(error)) {
      // E01 (no Web Studio access) copy references billing — keep it off native toasts.
      const neutralNativeBlock = isNativeApp() && codes.includes('WEBSITE_BUILDER.E01');
      toast.error(
        neutralNativeBlock
          ? i18n.t('website:page.toasts.publishFailed')
          : message || i18n.t('website:page.toasts.publishFailed'),
        {
          id: "website-publish-failed",
        },
      );
    }
    yield put(
      publishWebsiteAction.failure({
        message,
        ...scope,
        failureKind: 'publish',
      }),
    );
  }
}

function* handleUnpublishWebsite(scope: WebsiteMutationScope) {
  try {
    const response: { publish: WebsitePublishState } = yield call(unpublishWebsiteApi);
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    yield put(unpublishWebsiteAction.success({ publish: response.publish, ...scope }));
    toast.success(i18n.t('website:page.toasts.unpublished'), {
      id: "website-unpublished",
    });
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteMutationScope(scope))) return;
    const message = getErrorMessage(error);
    if (shouldShowFeatureErrorToast(error)) {
      toast.error(message || i18n.t('website:page.toasts.unpublishFailed'), {
        id: "website-unpublish-failed",
      });
    }
    yield put(unpublishWebsiteAction.failure({ message, ...scope }));
  }
}

/**
 * Store catalog fetch (sections + variants). Deliberately silent on failure: without it
 * the builder falls back to its code-side defaults and the server still enforces ownership
 * at publish/delivery.
 */
function* handleFetchWebsiteVariantCatalog(action: { type: string }): Generator<any, void, any> {
  // ENTER is part of this takeLatest lane only to invalidate/suppress an older same-business
  // catalog request. The fresh workspace starts the replacement read after primary access loads.
  if (action.type === getType(enterWebsiteBuilderAction)) return;
  const scope = yield* getWebsiteScope();
  const abortController = new AbortController();
  try {
    const catalog: WebsiteCatalogResponse = yield call(getWebsiteVariantCatalogApi, {
      signal: abortController.signal,
    });
    if (!(yield* isCurrentWebsiteScope(scope))) return;
    yield put(fetchWebsiteVariantCatalogAction.success({ ...catalog, ...scope }));
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scope))) return;
    yield put(fetchWebsiteVariantCatalogAction.failure({
      message: getErrorMessage(error),
      ...scope,
    }));
  } finally {
    if (yield cancelled()) abortController.abort();
  }
}

function usableCheckoutRedirectUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function* handleCreateWebsiteVariantCheckout(action: ActionType<typeof createWebsiteVariantCheckoutAction.request>) {
  const scope = yield* getWebsiteScope();
  if (isNativeApp()) {
    // Store policy: no Stripe web checkout inside the native webview — purchase UI is hidden,
    // but this backstops any action that slips through.
    yield put(createWebsiteVariantCheckoutAction.failure({ message: "", ...scope }));
    return;
  }
  try {
    const response: { url: string } = yield call(createWebsiteVariantCheckoutApi, action.payload);
    if (!(yield* isCurrentWebsiteScope(scope))) return;
    const redirectUrl = usableCheckoutRedirectUrl(response.url);
    if (!redirectUrl) {
      const message = i18n.t('website:page.toasts.checkoutFailed');
      toast.error(message, { id: "website-checkout-start-failed" });
      yield put(createWebsiteVariantCheckoutAction.failure({ message, ...scope }));
      return;
    }
    yield put(createWebsiteVariantCheckoutAction.success({ url: redirectUrl, ...scope }));
    // Mirrors the SMS/subscription checkout flow: hand the tab to Stripe; successUrl
    // brings the owner back to /website with the session id for reconciliation.
    window.location.href = redirectUrl;
  } catch (error: unknown) {
    if (!(yield* isCurrentWebsiteScope(scope))) return;
    // WEBSITE_VARIANTS / WEBSITE_SECTIONS codes (not found/inactive, free, already
    // owned, needs the Plus plan) translate to specific copy via the `messages` namespace.
    const message = getErrorMessage(error);
    if (shouldShowFeatureErrorToast(error)) {
      toast.error(message || i18n.t('website:page.toasts.checkoutFailed'), {
        id: "website-checkout-start-failed",
      });
    }
    // Already owned / no longer purchasable — refresh ownership so the UI corrects itself.
    const codes = extractErrorCodes(error);
    const staleOwnershipCodes = [
      'WEBSITE_VARIANTS.E04', 'WEBSITE_VARIANTS.E01', 'WEBSITE_VARIANTS.E03', 'WEBSITE_VARIANTS.E13',
      'WEBSITE_VARIANTS.E08', 'WEBSITE_VARIANTS.E18',
      'WEBSITE_SECTIONS.E05', 'WEBSITE_SECTIONS.E01', 'WEBSITE_SECTIONS.E04', 'WEBSITE_SECTIONS.E07',
      'WEBSITE_THEME_ASSETS.E01', 'WEBSITE_THEME_ASSETS.E02', 'WEBSITE_THEME_ASSETS.E03',
      'WEBSITE_THEME_ASSETS.E04',
    ];
    if (codes.some((c: string) => staleOwnershipCodes.includes(c))) {
      yield put(fetchWebsiteVariantCatalogAction.request());
    }
    yield put(createWebsiteVariantCheckoutAction.failure({ message, ...scope }));
  }
}

type WebsiteMutationAction =
  | ActionType<typeof saveWebsiteDraftAction.request>
  | ActionType<typeof uploadWebsiteHeroAction.request>
  | ActionType<typeof deleteWebsiteHeroAction.request>
  | ActionType<typeof publishWebsiteAction.request>
  | ActionType<typeof unpublishWebsiteAction.request>;

const mutationIntentTypes = [
  getType(saveWebsiteDraftAction.request),
  getType(uploadWebsiteHeroAction.request),
  getType(deleteWebsiteHeroAction.request),
  getType(publishWebsiteAction.request),
  getType(unpublishWebsiteAction.request),
];

type ScopedMutationIntent = {
  kind: "intent";
  action: WebsiteMutationAction;
  scope: WebsiteMutationScope;
};

type ScopedMutationCancellation = {
  kind: "cancel";
  scope: WebsiteMutationScope;
};

type WebsiteMutationQueueEvent = ScopedMutationIntent | ScopedMutationCancellation;

const enqueueWebsiteMutationEventAction = createAction(
  'website/ENQUEUE_SCOPED_MUTATION_EVENT_INTERNAL',
)<WebsiteMutationQueueEvent>();

const isDraftSaveIntent = (
  action: WebsiteMutationAction,
): action is ActionType<typeof saveWebsiteDraftAction.request> =>
  action.type === getType(saveWebsiteDraftAction.request);

function sameMutationScope(left: WebsiteMutationScope, right: WebsiteMutationScope): boolean {
  return (
    left.scopeBusinessId === right.scopeBusinessId &&
    left.scopeRevision === right.scopeRevision &&
    left.mutationGeneration === right.mutationGeneration
  );
}

const isDraftSaveEvent = (event: WebsiteMutationQueueEvent): event is ScopedMutationIntent =>
  event.kind === "intent" && isDraftSaveIntent(event.action);

type MutationIntentDisposition = "current" | "cancelled" | "stale";

function* getMutationIntentDisposition(
  scope: WebsiteMutationScope,
): Generator<any, MutationIntentDisposition, any> {
  if (scope.scopeBusinessId === null || !(yield* isCurrentWebsiteScope(scope))) {
    return "stale";
  }
  const currentGeneration: number = yield select(
    (state: RootState) => state.website.mutationGeneration,
  );
  return currentGeneration === scope.mutationGeneration ? "current" : "cancelled";
}

function* settleSaveRequest(
  request: ActionType<typeof saveWebsiteDraftAction.request>["payload"],
  scope: WebsiteScope,
  failureKind: "cancelled" | "conflict",
  conflict?: WebsiteDraftConflict,
): Generator<any, void, any> {
  const settled: { saved: boolean; failureKind: WebsiteSaveFailureKind | null } = yield select(
    (state: RootState) => ({
      saved: state.website.lastSavedRequestId === request.requestId,
      failureKind:
        state.website.saveFailure?.requestId === request.requestId
          ? state.website.saveFailure.kind
          : null,
    }),
  );
  if (settled.saved || settled.failureKind === failureKind) return;
  yield* putSaveFailure(request, scope, {
    ok: false,
    message: "",
    failureKind,
    conflict,
  });
}

/** Settle a request that cannot execute, including a save embedded in Publish. Request reducers
 * mark busy state before capture, so every abandoned intent needs an explicit terminal action. */
function* settleMutationIntent(
  intent: ScopedMutationIntent,
  failureKind: "cancelled" | "conflict",
  conflict?: WebsiteDraftConflict,
): Generator<any, void, any> {
  const { action, scope } = intent;
  if (action.type === getType(saveWebsiteDraftAction.request)) {
    yield* settleSaveRequest(
      (action as ActionType<typeof saveWebsiteDraftAction.request>).payload,
      scope,
      failureKind,
      conflict,
    );
  } else if (action.type === getType(uploadWebsiteHeroAction.request)) {
    yield put(uploadWebsiteHeroAction.failure({ message: "", ...scope, conflict }));
  } else if (action.type === getType(deleteWebsiteHeroAction.request)) {
    yield put(deleteWebsiteHeroAction.failure({ message: "", ...scope, conflict }));
  } else if (action.type === getType(publishWebsiteAction.request)) {
    const publishAction = action as ActionType<typeof publishWebsiteAction.request>;
    if (publishAction.payload.save) {
      yield* settleSaveRequest(
        publishAction.payload.save,
        scope,
        failureKind,
        conflict,
      );
    }
    yield put(
      publishWebsiteAction.failure({
        message: "",
        ...scope,
        failureKind,
        conflict,
      }),
    );
  } else {
    yield put(unpublishWebsiteAction.failure({ message: "", ...scope }));
  }
}

/** Capture auth scope and mutation generation as soon as Redux emits an intent. This watcher is
 * independent of the network-bound FIFO worker, so buffered work never resolves scope at dequeue. */
function* captureWebsiteMutationEvents(): Generator<any, void, any> {
  const captureTypes = [
    ...mutationIntentTypes,
    getType(cancelWebsiteMutationIntentsAction),
  ];
  while (true) {
    const action: WebsiteMutationAction | ActionType<typeof cancelWebsiteMutationIntentsAction> =
      yield take(captureTypes);
    const scope = yield* getWebsiteMutationScope();
    if (action.type === getType(cancelWebsiteMutationIntentsAction)) {
      yield put(enqueueWebsiteMutationEventAction({ kind: "cancel", scope }));
    } else {
      yield put(enqueueWebsiteMutationEventAction({
        kind: "intent",
        action: action as WebsiteMutationAction,
        scope,
      }));
    }
  }
}

/** Single FIFO lane for every command that reads or changes the Website draft version.
 * Adjacent queued draft snapshots collapse to the newest one; hero and publish actions
 * are barriers and retain their exact order. Scope changes and explicit cancellation make
 * old work terminal without ever issuing it under a new session. */
function* handleWebsiteMutationQueue(): Generator<any, void, any> {
  const channel: any = yield actionChannel(
    getType(enqueueWebsiteMutationEventAction),
    buffers.expanding<ActionType<typeof enqueueWebsiteMutationEventAction>>(),
  );
  const queue: WebsiteMutationQueueEvent[] = [];

  while (true) {
    if (queue.length === 0) {
      const next: ActionType<typeof enqueueWebsiteMutationEventAction> = yield take(channel);
      queue.push(next.payload);
    }
    const buffered: ActionType<typeof enqueueWebsiteMutationEventAction>[] = yield flush(channel);
    queue.push(...buffered.map((entry) => entry.payload));

    let event = queue.shift()!;
    if (isDraftSaveEvent(event)) {
      while (
        queue[0] &&
        isDraftSaveEvent(queue[0]) &&
        sameMutationScope(event.scope, queue[0].scope)
      ) {
        event = queue.shift() as ScopedMutationIntent;
      }
    }

    if (event.kind === "cancel") {
      // The cancel reducer has already advanced the generation. Reconcile only the latest
      // cancellation for a still-current authenticated scope, after the active HTTP call settled.
      if (
        event.scope.scopeBusinessId !== null &&
        (yield* isCurrentWebsiteMutationScope(event.scope))
      ) {
        yield put(fetchWebsiteBuilderAction.request());
      }
      continue;
    }

    const disposition = yield* getMutationIntentDisposition(event.scope);
    if (disposition === "stale") continue;
    if (disposition === "cancelled") {
      yield* settleMutationIntent(event, "cancelled");
      continue;
    }

    const conflict: WebsiteDraftConflict | null = yield select(
      (state: RootState) => state.website.conflict,
    );
    if (conflict) {
      yield* settleMutationIntent(event, "conflict", conflict);
      continue;
    }

    const { action, scope } = event;
    if (action.type === getType(saveWebsiteDraftAction.request)) {
      yield* handleSaveWebsiteDraft(
        action as ActionType<typeof saveWebsiteDraftAction.request>,
        scope,
      );
    } else if (action.type === getType(uploadWebsiteHeroAction.request)) {
      yield* handleUploadWebsiteHero(
        action as ActionType<typeof uploadWebsiteHeroAction.request>,
        scope,
      );
    } else if (action.type === getType(deleteWebsiteHeroAction.request)) {
      yield* handleDeleteWebsiteHero(scope);
    } else if (action.type === getType(publishWebsiteAction.request)) {
      yield* handlePublishWebsite(
        action as ActionType<typeof publishWebsiteAction.request>,
        scope,
      );
    } else {
      yield* handleUnpublishWebsite(scope);
    }

    // Explicit cancellation can arrive while a non-abortable Axios call is active. Every handler
    // suppresses its late result; settle its request state here. The later cancel marker performs
    // the authoritative GET only after that promise has finished, avoiding a reconciliation race.
    if ((yield* getMutationIntentDisposition(scope)) === "cancelled") {
      yield* settleMutationIntent(event, "cancelled");
    }
  }
}

export function* websiteSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(
      [fetchWebsiteBuilderAction.request, enterWebsiteBuilderAction],
      handleFetchWebsiteBuilder,
    ),
    call(captureWebsiteMutationEvents),
    call(handleWebsiteMutationQueue),
    takeLatest(
      [fetchWebsiteVariantCatalogAction.request, enterWebsiteBuilderAction],
      handleFetchWebsiteVariantCatalog,
    ),
    takeLatest(createWebsiteVariantCheckoutAction.request, handleCreateWebsiteVariantCheckout),
  ]);
}
