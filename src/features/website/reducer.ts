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
  isLoading: false,
  error: null,
  identity: null,
  draft: null,
  locations: [],
  access: null,
  publish: null,
  isPublishing: false,
  isUnpublishing: false,
  isSaving: false,
  isHeroMutating: false,
  lastSavedRequestId: null,
  conflict: null,
  publishLockedItems: null,
  variantCatalog: [],
  sectionCatalog: [],
  isLoadingCatalog: false,
  catalogLoaded: false,
  isCreatingCheckout: false,
  variantCart: [],
  sectionCart: [],
  cartBusinessId: null,
};

function normalizeScopeBusinessId(value: number | string | null | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

function resetForScope(state: WebsiteState, scopeBusinessId: string | null): WebsiteState {
  return state.scopeBusinessId === scopeBusinessId
    ? state
    : { ...initialState, scopeBusinessId };
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
      return initialState;

    case getType(actions.fetchWebsiteBuilderAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.fetchWebsiteBuilderAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        isLoading: false,
        identity: action.payload.identity,
        draft: action.payload.draft,
        locations: action.payload.locations || [],
        access: action.payload.access,
        publish: action.payload.publish ?? null,
        error: null,
      };

    case getType(actions.fetchWebsiteBuilderAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.saveWebsiteDraftAction.request):
      return { ...state, isSaving: true, conflict: null, lastSavedRequestId: null };

    case getType(actions.saveWebsiteDraftAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      // The server returns the normalized saved draft + new version; it becomes the baseline.
      return {
        ...state,
        isSaving: false,
        conflict: null,
        publishLockedItems: null,
        draft: action.payload.draft,
        lastSavedRequestId: action.payload.requestId,
      };

    case getType(actions.saveWebsiteDraftAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        isSaving: false,
        conflict: action.payload.conflict ?? null,
      };

    case getType(actions.uploadWebsiteHeroAction.request):
    case getType(actions.deleteWebsiteHeroAction.request):
      return { ...state, isHeroMutating: true, conflict: null };

    case getType(actions.uploadWebsiteHeroAction.success):
    case getType(actions.deleteWebsiteHeroAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      // Immediate hero mutation: advance only the stored hero + version metadata; the form's
      // unsaved text/layout edits live in the hook and are untouched.
      return {
        ...state,
        isHeroMutating: false,
        draft: state.draft
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
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
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
      return { ...state, isPublishing: true, publishLockedItems: null };

    case getType(actions.publishWebsiteAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isPublishing: false, publish: action.payload.publish, conflict: null, publishLockedItems: null };

    case getType(actions.publishWebsiteAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        isPublishing: false,
        conflict: action.payload.conflict ?? state.conflict,
        publishLockedItems: action.payload.lockedItems ?? null,
      };

    case getType(actions.unpublishWebsiteAction.request):
      return { ...state, isUnpublishing: true };

    case getType(actions.unpublishWebsiteAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isUnpublishing: false, publish: action.payload.publish };

    case getType(actions.unpublishWebsiteAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isUnpublishing: false };

    // Store catalog. Failures don't touch the page-level `error` — the catalog is an
    // enhancement (locked/owned pills); ownership is enforced server-side regardless.
    case getType(actions.fetchWebsiteVariantCatalogAction.request):
      return { ...state, isLoadingCatalog: true };

    case getType(actions.fetchWebsiteVariantCatalogAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        isLoadingCatalog: false,
        variantCatalog: action.payload.variants,
        sectionCatalog: action.payload.sections,
        // Latch: the catalog is now authoritative. A later failure keeps this true (and the
        // arrays above stay as last-good), so a transient error never empties the builder.
        catalogLoaded: true,
      };

    case getType(actions.fetchWebsiteVariantCatalogAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isLoadingCatalog: false };

    case getType(actions.createWebsiteVariantCheckoutAction.request):
      return { ...state, isCreatingCheckout: true };

    // Stay "in flight" on success — the saga immediately redirects to Stripe, so the buy
    // button keeps its busy state instead of flashing back to idle before navigation.
    case getType(actions.createWebsiteVariantCheckoutAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return state;

    case getType(actions.createWebsiteVariantCheckoutAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
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

    case getType(actions.clearVariantCartAction):
      return { ...state, variantCart: [], sectionCart: [] };

    case getType(actions.hydrateWebsiteCartAction):
      return {
        ...state,
        variantCart: [...new Set(action.payload.variantIds)],
        sectionCart: [...new Set(action.payload.sectionIds)],
        cartBusinessId: action.payload.businessId,
      };

    default:
      return state;
  }
};
