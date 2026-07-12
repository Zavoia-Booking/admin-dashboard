import { createAction, createAsyncAction } from "typesafe-actions";
import type {
  WebsiteBuilderResponse,
  UpdateWebsiteDraftPayload,
  WebsiteDraft,
  WebsiteDraftConflict,
  WebsiteCatalogResponse,
  WebsiteVariantCheckoutPayload,
  WebsitePublishState,
} from "./types";

export interface WebsiteScope {
  scopeBusinessId: string | null;
}

export type ScopedWebsiteResult<T> = T & WebsiteScope;
export type ScopedWebsiteError = WebsiteScope & { message: string };

export interface SaveWebsiteDraftRequest {
  requestId: string;
  payload: UpdateWebsiteDraftPayload;
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
  ScopedWebsiteError & { conflict?: WebsiteDraftConflict }
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
  expectedVersion: number;
}

export interface DeleteWebsiteHeroRequest {
  expectedVersion: number;
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
)<DeleteWebsiteHeroRequest, ScopedWebsiteResult<SetWebsiteHeroPayload>, ScopedWebsiteError & { conflict?: WebsiteDraftConflict }>();

/** Clear the 409 conflict state after the user resolved it (reloaded or discarded). */
export const clearWebsiteConflictAction = createAction('website/CLEAR_CONFLICT')();

/**
 * Save-then-publish: when the form is dirty, `save` carries the draft payload and the saga
 * saves it first (dispatching saveWebsiteDraftAction.success so the form baseline reconciles),
 * then publishes the just-saved version. When clean, `save` is null and `expectedVersion`
 * is the current baseline version.
 */
export interface PublishWebsiteRequest {
  save: SaveWebsiteDraftRequest | null;
  expectedVersion: number;
}

export const publishWebsiteAction = createAsyncAction(
  'website/PUBLISH_REQUEST',
  'website/PUBLISH_SUCCESS',
  'website/PUBLISH_FAILURE',
)<
  PublishWebsiteRequest,
  ScopedWebsiteResult<{ publish: WebsitePublishState }>,
  // lockedItems: names of unowned premium sections/styles (E07), kept in state so the
  // publish-blocker panel outlives the toast.
  ScopedWebsiteError & { conflict?: WebsiteDraftConflict; lockedItems?: string[] }
>();

/** Takes the site offline; the snapshot is kept so re-publishing is instant. */
export const unpublishWebsiteAction = createAsyncAction(
  'website/UNPUBLISH_REQUEST',
  'website/UNPUBLISH_SUCCESS',
  'website/UNPUBLISH_FAILURE',
)<void, ScopedWebsiteResult<{ publish: WebsitePublishState }>, ScopedWebsiteError>();

// Store offering (sections + variants): catalog with per-business ownership.
// Fetched on builder load (and again after checkout reconciliation) so locked/owned
// states always reflect current ownership.
export const fetchWebsiteVariantCatalogAction = createAsyncAction(
  'website/FETCH_VARIANT_CATALOG_REQUEST',
  'website/FETCH_VARIANT_CATALOG_SUCCESS',
  'website/FETCH_VARIANT_CATALOG_FAILURE',
)<void, ScopedWebsiteResult<WebsiteCatalogResponse>, ScopedWebsiteError>();

// One-time Stripe checkout for one or more paid variants; the saga redirects to the session URL.
export const createWebsiteVariantCheckoutAction = createAsyncAction(
  'website/CREATE_VARIANT_CHECKOUT_REQUEST',
  'website/CREATE_VARIANT_CHECKOUT_SUCCESS',
  'website/CREATE_VARIANT_CHECKOUT_FAILURE',
)<
  WebsiteVariantCheckoutPayload,
  ScopedWebsiteResult<{ url: string }>,
  ScopedWebsiteError
>();

// Shopping cart (client-side; persisted to localStorage per business).
// Variants and section unlocks queue separately but check out in ONE Stripe session;
// clearVariantCartAction empties both.
export const addVariantToCartAction = createAction('website/VARIANT_CART_ADD')<number>();
export const removeVariantFromCartAction = createAction('website/VARIANT_CART_REMOVE')<number>();
export const clearVariantCartAction = createAction('website/VARIANT_CART_CLEAR')();
export const addSectionToCartAction = createAction('website/SECTION_CART_ADD')<number>();
export const removeSectionFromCartAction = createAction('website/SECTION_CART_REMOVE')<number>();

/** Hydration is atomic so persistence can prove which business owns the in-memory cart. */
export interface HydrateWebsiteCartPayload {
  businessId: string;
  variantIds: number[];
  sectionIds: number[];
}

export const hydrateWebsiteCartAction = createAction(
  'website/CART_HYDRATE',
)<HydrateWebsiteCartPayload>();
