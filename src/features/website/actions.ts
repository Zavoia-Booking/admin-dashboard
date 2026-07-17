import { createAction, createAsyncAction } from "typesafe-actions";
import type {
  WebsiteBuilderResponse,
  WebsiteDraft,
  WebsiteDraftConflict,
  WebsiteCatalogResponse,
  WebsiteVariantCheckoutPayload,
  WebsitePublishState,
  WebsiteSaveFailureKind,
  WebsiteUnownedPublishItems,
  UpdateWebsiteDraftBody,
} from "./types";

export interface WebsiteScope {
  scopeBusinessId: string | null;
  scopeRevision: number;
}

export interface WebsiteMutationScope extends WebsiteScope {
  mutationGeneration: number;
}

export type ScopedWebsiteResult<T> = T & WebsiteScope;
export type ScopedWebsiteError = WebsiteScope & { message: string };

export interface SaveWebsiteDraftRequest {
  requestId: string;
  /** Exact local working-state signature represented by this immutable payload. */
  workingSignature: string;
  /** Canonical signature of the normalized versionless API body. */
  bodySignature: string;
  body: UpdateWebsiteDraftBody;
  /** Recovery after an ambiguous failure must prove state with GET before another PUT. */
  reconcileFirst?: boolean;
}

/** Primary editing data: identity + draft + locations + access (review highlights load separately). */
export const fetchWebsiteBuilderAction = createAsyncAction(
  'website/FETCH_BUILDER_REQUEST',
  'website/FETCH_BUILDER_SUCCESS',
  'website/FETCH_BUILDER_FAILURE',
)<void, ScopedWebsiteResult<WebsiteBuilderResponse>, ScopedWebsiteError>();

/** Versioned draft save. A 409 carries the conflict metadata instead of a plain message. */
export const saveWebsiteDraftAction = createAsyncAction(
  'website/SAVE_DRAFT_REQUEST',
  'website/SAVE_DRAFT_SUCCESS',
  'website/SAVE_DRAFT_FAILURE',
)<
  SaveWebsiteDraftRequest,
  ScopedWebsiteResult<{ draft: WebsiteDraft; requestId: string }>,
  ScopedWebsiteError & {
    requestId: string;
    workingSignature: string;
    failureKind: WebsiteSaveFailureKind | 'conflict';
    conflict?: WebsiteDraftConflict;
    lockedItems?: WebsiteUnownedPublishItems;
  }
>();

/**
 * Local sync after an immediate hero mutation: the server version advanced but unsaved
 * text/layout edits in the form must be preserved — only the stored draft's hero fields
 * and version/updatedAt move.
 */
export interface SetWebsiteHeroPayload {
  heroImageUrl: string | null;
  version: number;
  updatedAt: string | null;
}

export interface UploadWebsiteHeroRequest {
  file: File;
}

export const uploadWebsiteHeroAction = createAsyncAction(
  'website/UPLOAD_HERO_REQUEST',
  'website/UPLOAD_HERO_SUCCESS',
  'website/UPLOAD_HERO_FAILURE',
)<UploadWebsiteHeroRequest, ScopedWebsiteResult<SetWebsiteHeroPayload>, ScopedWebsiteError & { conflict?: WebsiteDraftConflict }>();

export const deleteWebsiteHeroAction = createAsyncAction(
  'website/DELETE_HERO_REQUEST',
  'website/DELETE_HERO_SUCCESS',
  'website/DELETE_HERO_FAILURE',
)<void, ScopedWebsiteResult<SetWebsiteHeroPayload>, ScopedWebsiteError & { conflict?: WebsiteDraftConflict }>();

/** Clear the 409 conflict state after the user resolved it (reloaded or discarded). */
export const clearWebsiteConflictAction = createAction('website/CLEAR_CONFLICT')();

/**
 * Invalidates every active or queued Website write captured for the current scope. The mutation
 * coordinator suppresses any late response, settles queued request state, then reloads the
 * authoritative builder after the active HTTP call has finished. This is the state-layer API used
 * by navigation/logout flows that intentionally abandon pending Website work.
 */
export const cancelWebsiteMutationIntentsAction = createAction(
  'website/CANCEL_MUTATION_INTENTS',
)();

/**
 * Save-then-publish: when the form is dirty, `save` carries the draft payload and the saga
 * saves it first (dispatching saveWebsiteDraftAction.success so the form baseline reconciles),
 * then publishes the just-saved version. Version selection happens inside the serialized
 * mutation coordinator, immediately before the network call.
 */
export interface PublishWebsiteRequest {
  save: SaveWebsiteDraftRequest | null;
}

/** Why a publish intent terminated. Only `publish` represents a retryable failure from
 * POST /publish; every other kind is handled by a more specific recovery flow. */
export type PublishWebsiteFailureKind =
  | 'publish'
  | 'save'
  | 'conflict'
  | 'locked'
  | 'cancelled';

export const publishWebsiteAction = createAsyncAction(
  'website/PUBLISH_REQUEST',
  'website/PUBLISH_SUCCESS',
  'website/PUBLISH_FAILURE',
)<
  PublishWebsiteRequest,
  ScopedWebsiteResult<{ publish: WebsitePublishState }>,
  // Structured E07 details are kept so an inactive or otherwise unavailable item that disappeared from the
  // catalog still has an actionable recovery path in the publish review.
  ScopedWebsiteError & {
    failureKind: PublishWebsiteFailureKind;
    conflict?: WebsiteDraftConflict;
    lockedItems?: WebsiteUnownedPublishItems;
  }
>();

/** Takes the site offline; the snapshot is kept so re-publishing is instant. */
export const unpublishWebsiteAction = createAsyncAction(
  'website/UNPUBLISH_REQUEST',
  'website/UNPUBLISH_SUCCESS',
  'website/UNPUBLISH_FAILURE',
)<void, ScopedWebsiteResult<{ publish: WebsitePublishState }>, ScopedWebsiteError>();

// Store offering (sections + variants + theme assets): catalog with per-business ownership.
// Fetched on builder load (and again after checkout reconciliation) so locked/owned
// states always reflect current ownership.
export const fetchWebsiteVariantCatalogAction = createAsyncAction(
  'website/FETCH_VARIANT_CATALOG_REQUEST',
  'website/FETCH_VARIANT_CATALOG_SUCCESS',
  'website/FETCH_VARIANT_CATALOG_FAILURE',
)<void, ScopedWebsiteResult<WebsiteCatalogResponse>, ScopedWebsiteError>();

// One-time Stripe checkout for paid variants, sections, and/or theme assets; the saga redirects.
export const createWebsiteVariantCheckoutAction = createAsyncAction(
  'website/CREATE_VARIANT_CHECKOUT_REQUEST',
  'website/CREATE_VARIANT_CHECKOUT_SUCCESS',
  'website/CREATE_VARIANT_CHECKOUT_FAILURE',
)<
  WebsiteVariantCheckoutPayload,
  ScopedWebsiteResult<{ url: string }>,
  ScopedWebsiteError
>();

/** Browser Back can restore the pre-Stripe page from BFCache with its redirect latch intact. */
export const releaseWebsiteCheckoutBusyAction = createAction(
  'website/RELEASE_CHECKOUT_BUSY',
)();

// Shopping cart (client-side; persisted to localStorage per business).
// Variants, section unlocks, and theme assets queue separately but check out in ONE Stripe
// session; clearVariantCartAction remains the compatibility name for clearing the full cart.
export const addVariantToCartAction = createAction('website/VARIANT_CART_ADD')<number>();
export const removeVariantFromCartAction = createAction('website/VARIANT_CART_REMOVE')<number>();
export const clearVariantCartAction = createAction('website/VARIANT_CART_CLEAR')();
export const addSectionToCartAction = createAction('website/SECTION_CART_ADD')<number>();
export const removeSectionFromCartAction = createAction('website/SECTION_CART_REMOVE')<number>();
export const addThemeAssetToCartAction = createAction('website/THEME_ASSET_CART_ADD')<number>();
export const removeThemeAssetFromCartAction = createAction('website/THEME_ASSET_CART_REMOVE')<number>();

/** Hydration is atomic so persistence can prove which business owns the in-memory cart. */
export interface HydrateWebsiteCartPayload {
  businessId: string;
  variantIds: number[];
  sectionIds: number[];
  /** Optional until every mounted builder surface supplies the new persisted cart. */
  themeAssetIds?: number[];
}

export const hydrateWebsiteCartAction = createAction(
  'website/CART_HYDRATE',
)<HydrateWebsiteCartPayload>();
