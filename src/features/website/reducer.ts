import * as actions from "./actions";
import type { WebsiteState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import type { Reducer } from "redux";
import {
  hydrateSessionAction,
  logoutRequestAction,
  selectBusinessAction,
  setAuthUserAction,
} from "../auth/actions";

type Actions =
  | ActionType<typeof actions>
  | ActionType<typeof hydrateSessionAction>
  | ActionType<typeof logoutRequestAction>
  | ActionType<typeof selectBusinessAction>
  | ActionType<typeof setAuthUserAction>;

const initialState: WebsiteState = {
  scopeBusinessId: null,
  scopeRevision: 0,
  mutationGeneration: 0,
  isLoading: false,
  error: null,
  identity: null,
  draft: null,
  locations: [],
  access: null,
  publish: null,
  isPublishing: false,
  isUnpublishing: false,
  publishFailure: null,
  isSaving: false,
  isHeroMutating: false,
  lastSavedRequestId: null,
  saveFailure: null,
  conflict: null,
  publishLockedItems: null,
  variantCatalog: [],
  unavailableVariants: [],
  sectionCatalog: [],
  themeAssetCatalog: [],
  isLoadingCatalog: false,
  catalogError: null,
  catalogLoaded: false,
  isCreatingCheckout: false,
  variantCart: [],
  sectionCart: [],
  themeAssetCart: [],
  cartBusinessId: null,
};

function normalizeScopeBusinessId(value: number | string | null | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

function resetForScope(
  state: WebsiteState,
  scopeBusinessId: string | null,
  force = false,
): WebsiteState {
  return !force && state.scopeBusinessId === scopeBusinessId
    ? state
    : {
        ...initialState,
        scopeBusinessId,
        scopeRevision: state.scopeRevision + 1,
      };
}

function isCurrentScope(state: WebsiteState, scope: actions.WebsiteScope): boolean {
  return (
    scope.scopeBusinessId === state.scopeBusinessId &&
    scope.scopeRevision === state.scopeRevision
  );
}

function shouldAdoptDraft(current: WebsiteState["draft"], incoming: WebsiteState["draft"]): boolean {
  return !current || !incoming || incoming.version >= current.version;
}

function isPurchasableThemeAsset(
  asset: WebsiteState["themeAssetCatalog"][number] | undefined,
): asset is WebsiteState["themeAssetCatalog"][number] {
  return !!asset && !asset.isIncluded && !asset.owned && asset.priceMinor > 0 && asset.available;
}

function reconcileThemeAssetCart(
  ids: readonly number[],
  catalog: WebsiteState["themeAssetCatalog"],
): number[] {
  // A color and a font may be queued together, but two assets of the same kind are mutually
  // exclusive. Keep the most recently queued id per kind when hydrating old/corrupt storage.
  const seenKinds = new Set<WebsiteState["themeAssetCatalog"][number]["kind"]>();
  const reconciled: number[] = [];
  [...new Set(ids)].reverse().forEach((id) => {
    const asset = catalog.find((candidate) => candidate.id === id);
    if (!isPurchasableThemeAsset(asset) || seenKinds.has(asset.kind)) return;
    seenKinds.add(asset.kind);
    reconciled.push(id);
  });
  return reconciled.reverse();
}

export const WebsiteReducer: Reducer<WebsiteState, any> = (state: WebsiteState = initialState, action: Actions) => {
  switch (action.type) {
    case getType(setAuthUserAction):
      return resetForScope(state, normalizeScopeBusinessId(action.payload.user?.businessId));

    case getType(hydrateSessionAction.success):
      return resetForScope(
        state,
        normalizeScopeBusinessId(action.payload.businessId ?? action.payload.user?.businessId),
      );

    case getType(selectBusinessAction.success):
      return resetForScope(state, normalizeScopeBusinessId(action.payload.user?.businessId));

    case getType(logoutRequestAction.success):
      return resetForScope(state, null, true);

    case getType(actions.cancelWebsiteMutationIntentsAction):
      return {
        ...state,
        mutationGeneration: state.mutationGeneration + 1,
        isSaving: false,
        isHeroMutating: false,
        isPublishing: false,
        isUnpublishing: false,
        publishFailure: null,
        saveFailure: null,
        conflict: null,
      };

    case getType(actions.enterWebsiteBuilderAction):
      return {
        ...state,
        isLoading: true,
        error: null,
        identity: null,
        draft: null,
        locations: [],
        access: null,
        publish: null,
        publishFailure: null,
        saveFailure: null,
        conflict: null,
        publishLockedItems: null,
        lastSavedRequestId: null,
        variantCatalog: [],
        unavailableVariants: [],
        sectionCatalog: [],
        themeAssetCatalog: [],
        isLoadingCatalog: false,
        catalogError: null,
        catalogLoaded: false,
      };

    case getType(actions.fetchWebsiteBuilderAction.request):
      return { ...state, isLoading: true, error: null, publishFailure: null };

    case getType(actions.fetchWebsiteBuilderAction.success): {
      if (!isCurrentScope(state, action.payload)) return state;
      const adoptFetchedDraft = shouldAdoptDraft(state.draft, action.payload.draft);
      return {
        ...state,
        isLoading: false,
        identity: action.payload.identity,
        draft: adoptFetchedDraft ? action.payload.draft : state.draft,
        locations: action.payload.locations || [],
        access: action.payload.access,
        publish: action.payload.publish ?? null,
        publishFailure: null,
        error: null,
      };
    }

    case getType(actions.fetchWebsiteBuilderAction.failure):
      if (!isCurrentScope(state, action.payload)) return state;
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.saveWebsiteDraftAction.request):
      return {
        ...state,
        isSaving: true,
        saveFailure: null,
        lastSavedRequestId: null,
      };

    case getType(actions.saveWebsiteDraftAction.success):
      if (!isCurrentScope(state, action.payload)) return state;
      // The server returns the normalized saved draft + new version; it becomes the baseline.
      return {
        ...state,
        isSaving: false,
        conflict: null,
        saveFailure: null,
        draft: shouldAdoptDraft(state.draft, action.payload.draft)
          ? action.payload.draft
          : state.draft,
        lastSavedRequestId: action.payload.requestId,
      };

    case getType(actions.saveWebsiteDraftAction.failure):
      if (!isCurrentScope(state, action.payload)) return state;
      return {
        ...state,
        isSaving: false,
        conflict: action.payload.conflict ?? null,
        publishLockedItems: action.payload.lockedItems ?? state.publishLockedItems,
        saveFailure:
          action.payload.failureKind === 'conflict'
            ? null
            : {
                requestId: action.payload.requestId,
                workingSignature: action.payload.workingSignature,
                kind: action.payload.failureKind,
              },
      };

    case getType(actions.uploadWebsiteHeroAction.request):
    case getType(actions.deleteWebsiteHeroAction.request):
      return { ...state, isHeroMutating: true };

    case getType(actions.uploadWebsiteHeroAction.success):
    case getType(actions.deleteWebsiteHeroAction.success):
      if (!isCurrentScope(state, action.payload)) return state;
      // Immediate hero mutation: advance only the stored hero + version metadata; the form's
      // unsaved text/layout edits live in the hook and are untouched.
      return {
        ...state,
        isHeroMutating: false,
        draft: state.draft && action.payload.version >= state.draft.version
          ? {
              ...state.draft,
              heroImageUrl: action.payload.heroImageUrl,
              version: action.payload.version,
              updatedAt: action.payload.updatedAt,
            }
          : state.draft,
      };

    case getType(actions.uploadWebsiteHeroAction.failure):
    case getType(actions.deleteWebsiteHeroAction.failure):
      if (!isCurrentScope(state, action.payload)) return state;
      return {
        ...state,
        isHeroMutating: false,
        conflict: action.payload.conflict ?? null,
      };

    case getType(actions.clearWebsiteConflictAction):
      return { ...state, conflict: null };

    // Publish lifecycle. A save that the saga performs as part of save-then-publish flows
    // through the normal saveWebsiteDraftAction cases above.
    case getType(actions.publishWebsiteAction.request):
      return { ...state, isPublishing: true, publishFailure: null };

    case getType(actions.publishWebsiteAction.success):
      if (!isCurrentScope(state, action.payload)) return state;
      return {
        ...state,
        isPublishing: false,
        publish: action.payload.publish,
        publishFailure: null,
        conflict: null,
        publishLockedItems: null,
      };

    case getType(actions.publishWebsiteAction.failure):
      if (!isCurrentScope(state, action.payload)) return state;
      return {
        ...state,
        isPublishing: false,
        publishFailure:
          action.payload.failureKind === 'publish'
            ? { message: action.payload.message }
            : null,
        conflict: action.payload.conflict ?? state.conflict,
        publishLockedItems: action.payload.lockedItems ?? state.publishLockedItems,
      };

    case getType(actions.unpublishWebsiteAction.request):
      return { ...state, isUnpublishing: true, publishFailure: null };

    case getType(actions.unpublishWebsiteAction.success):
      if (!isCurrentScope(state, action.payload)) return state;
      return {
        ...state,
        isUnpublishing: false,
        publish: action.payload.publish,
        publishFailure: null,
      };

    case getType(actions.unpublishWebsiteAction.failure):
      if (!isCurrentScope(state, action.payload)) return state;
      return { ...state, isUnpublishing: false };

    // Store catalog. Failures don't touch the page-level `error` — the catalog is an
    // enhancement (locked/owned pills); ownership is enforced server-side regardless.
    case getType(actions.fetchWebsiteVariantCatalogAction.request):
      return { ...state, isLoadingCatalog: true, catalogError: null };

    case getType(actions.fetchWebsiteVariantCatalogAction.success): {
      if (!isCurrentScope(state, action.payload)) return state;
      const themeAssetCatalog = action.payload.themeAssets ?? [];
      return {
        ...state,
        isLoadingCatalog: false,
        catalogError: null,
        variantCatalog: action.payload.variants,
        sectionCatalog: action.payload.sections,
        themeAssetCatalog,
        unavailableVariants: action.payload.unavailableVariants ?? [],
        // A successful catalog read is authoritative: purchased, included, unavailable,
        // or removed theme assets must not survive into the next combined checkout.
        themeAssetCart: reconcileThemeAssetCart(state.themeAssetCart, themeAssetCatalog),
        // Latch: the catalog is now authoritative. A later failure keeps this true (and the
        // arrays above stay as last-good), so a transient error never empties the builder.
        catalogLoaded: true,
      };
    }

    case getType(actions.fetchWebsiteVariantCatalogAction.failure):
      if (!isCurrentScope(state, action.payload)) return state;
      return {
        ...state,
        isLoadingCatalog: false,
        catalogError: action.payload.message,
      };

    case getType(actions.createWebsiteVariantCheckoutAction.request):
      return { ...state, isCreatingCheckout: true };

    // Stay "in flight" on success — the saga immediately redirects to Stripe, so the buy
    // button keeps its busy state instead of flashing back to idle before navigation.
    case getType(actions.createWebsiteVariantCheckoutAction.success):
      if (!isCurrentScope(state, action.payload)) return state;
      return state;

    case getType(actions.createWebsiteVariantCheckoutAction.failure):
      if (!isCurrentScope(state, action.payload)) return state;
      return { ...state, isCreatingCheckout: false };

    case getType(actions.releaseWebsiteCheckoutBusyAction):
      return { ...state, isCreatingCheckout: false };

    // Shopping cart (deduplicated ids; localStorage sync lives in the cart hook).
    // Variants and section unlocks queue separately, check out together.
    case getType(actions.addVariantToCartAction):
      return state.variantCart.includes(action.payload)
        ? state
        : { ...state, variantCart: [...state.variantCart, action.payload] };

    case getType(actions.removeVariantFromCartAction):
      return { ...state, variantCart: state.variantCart.filter((id) => id !== action.payload) };

    case getType(actions.addSectionToCartAction):
      return state.sectionCart.includes(action.payload)
        ? state
        : { ...state, sectionCart: [...state.sectionCart, action.payload] };

    case getType(actions.removeSectionFromCartAction):
      return { ...state, sectionCart: state.sectionCart.filter((id) => id !== action.payload) };

    case getType(actions.addThemeAssetToCartAction): {
      if (state.themeAssetCart.includes(action.payload)) return state;
      const asset = state.themeAssetCatalog.find((candidate) => candidate.id === action.payload);
      if (!isPurchasableThemeAsset(asset)) return state;
      return {
        ...state,
        themeAssetCart: [
          ...state.themeAssetCart.filter((id) =>
            state.themeAssetCatalog.find((candidate) => candidate.id === id)?.kind !== asset.kind
          ),
          action.payload,
        ],
      };
    }

    case getType(actions.removeThemeAssetFromCartAction):
      return {
        ...state,
        themeAssetCart: state.themeAssetCart.filter((id) => id !== action.payload),
      };

    case getType(actions.clearVariantCartAction):
      return { ...state, variantCart: [], sectionCart: [], themeAssetCart: [] };

    case getType(actions.hydrateWebsiteCartAction):
      if (action.payload.businessId !== state.scopeBusinessId) return state;
      {
        const hydratedThemeAssetIds = [...new Set(action.payload.themeAssetIds ?? [])];
        return {
          ...state,
          variantCart: [...new Set(action.payload.variantIds)],
          sectionCart: [...new Set(action.payload.sectionIds)],
          themeAssetCart: state.catalogLoaded
            ? reconcileThemeAssetCart(hydratedThemeAssetIds, state.themeAssetCatalog)
            : hydratedThemeAssetIds,
          cartBusinessId: action.payload.businessId,
        };
      }

    default:
      return state;
  }
};
