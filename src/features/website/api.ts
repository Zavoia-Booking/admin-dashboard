import type {
  WebsiteBuilderResponse,
  UpdateWebsiteDraftPayload,
  WebsiteDraft,
  WebsiteHeroMutationResponse,
  WebsiteCatalogResponse,
  WebsiteVariantCheckoutPayload,
  WebsiteCheckoutStatusResponse,
  WebsitePublishState,
} from "./types";
import { apiClient } from "../../shared/lib/http";

// ---------------------------------------------------------------------------
// Dedicated Website Builder draft API. Every mutation carries expectedVersion;
// a stale tab gets a 409 with { currentVersion, updatedAt } instead of silently
// overwriting a newer draft. These endpoints never touch Marketplace state.
// ---------------------------------------------------------------------------

export const getWebsiteBuilderApi = async (): Promise<WebsiteBuilderResponse> => {
  const { data } = await apiClient().get<WebsiteBuilderResponse>('/website-builder');
  return data;
};

export const updateWebsiteDraftApi = async (
  payload: UpdateWebsiteDraftPayload,
): Promise<{ message: string; draft: WebsiteDraft }> => {
  const { data } = await apiClient().put<{ message: string; draft: WebsiteDraft }>('/website-builder', payload);
  return data;
};

export const uploadWebsiteHeroApi = async (
  file: File,
  expectedVersion: number,
): Promise<WebsiteHeroMutationResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('expectedVersion', String(expectedVersion));
  const { data } = await apiClient().post<WebsiteHeroMutationResponse>(
    '/website-builder/hero',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
};

export const deleteWebsiteHeroApi = async (expectedVersion: number): Promise<WebsiteHeroMutationResponse> => {
  const { data } = await apiClient().delete<WebsiteHeroMutationResponse>(
    `/website-builder/hero?expectedVersion=${expectedVersion}`,
  );
  return data;
};

/** Freezes the saved draft at exactly this version into the published snapshot (tier-2 only). */
export const publishWebsiteApi = async (
  expectedVersion: number,
): Promise<{ message: string; publish: WebsitePublishState }> => {
  const { data } = await apiClient().post<{ message: string; publish: WebsitePublishState }>(
    '/website-builder/publish',
    { expectedVersion },
  );
  return data;
};

/** Takes the site offline (keeps the snapshot for instant re-publish). Idempotent. */
export const unpublishWebsiteApi = async (): Promise<{ message: string; publish: WebsitePublishState }> => {
  const { data } = await apiClient().post<{ message: string; publish: WebsitePublishState }>(
    '/website-builder/unpublish',
  );
  return data;
};

// ---------------------------------------------------------------------------
// Store: catalog + one-time Stripe checkout + return reconciliation.
// ---------------------------------------------------------------------------

/** Section, variant, and theme-asset catalog with per-business ownership/availability. */
export const getWebsiteVariantCatalogApi = async (): Promise<WebsiteCatalogResponse> => {
  const { data } = await apiClient().get<{ data: WebsiteCatalogResponse }>('/website-variants/catalog');
  return data.data;
};

/** Creates one Stripe session for any combination of variants, sections, and theme assets. */
export const createWebsiteVariantCheckoutApi = async (
  payload: WebsiteVariantCheckoutPayload,
): Promise<{ url: string }> => {
  const { data } = await apiClient().post<{ url: string }>('/website-variants/checkout', payload);
  return data;
};

/** Owner-scoped state of a checkout session's purchases — polled on return from Stripe. */
export const getWebsiteCheckoutStatusApi = async (
  sessionId: string,
  options?: { signal?: AbortSignal },
): Promise<WebsiteCheckoutStatusResponse> => {
  const { data } = await apiClient().get<WebsiteCheckoutStatusResponse>(
    `/website-variants/checkout-status/${encodeURIComponent(sessionId)}`,
    { signal: options?.signal },
  );
  return data;
};
