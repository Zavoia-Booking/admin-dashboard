import type {
  WebsiteSectionCatalogEntry,
  SectionEntry,
  WebsiteThemeAssetCatalogItem,
  WebsiteVariantCatalogEntry,
  WebsiteVariantCheckoutPayload,
} from "./types";

const LEGACY_CHECKOUT_INTENT_VERSION = 1;
const THEME_ASSET_CHECKOUT_INTENT_VERSION = 2;
const CHECKOUT_INTENT_VERSION = 3;

export const WEBSITE_CHECKOUT_CONTEXT_PARAM = "website_checkout_context";
export type WebsiteCheckoutReturnContext = "publish-review";

export function parseWebsiteCheckoutReturnContext(
  value: string | null,
): WebsiteCheckoutReturnContext | null {
  return value === "publish-review" ? value : null;
}

export type PreviewOnlyVariantSelections = Record<string, string>;
export interface PreviewOnlyThemeSelections {
  /** Current preview accent hex. */
  color?: string | null;
  /** Current preview font key. */
  font?: string | null;
}

export interface ReconciledThemeSelection {
  catalogId: number;
  kind: WebsiteThemeAssetCatalogItem["kind"];
  assetKey: string;
  value: string;
}

interface CheckoutVariantIntent {
  catalogId: number;
  sectionType: string;
  variantKey: string;
  /** The locked preview temporarily enabled a section that is still hidden in the draft. */
  enableSection: boolean;
}

interface CheckoutSectionIntent {
  catalogId: number;
  sectionType: string;
}

type CheckoutThemeAssetIntent = ReconciledThemeSelection;

interface WebsiteCheckoutIntent {
  version: typeof CHECKOUT_INTENT_VERSION;
  businessId: string;
  createdAt: string;
  variants: CheckoutVariantIntent[];
  sections: CheckoutSectionIntent[];
  themeAssets: CheckoutThemeAssetIntent[];
}

export interface ReconciledCheckoutIntent {
  variantSelections: Array<{
    sectionType: string;
    variantKey: string;
    enableSection: boolean;
  }>;
  themeSelections: ReconciledThemeSelection[];
  hasRemainingIntent: boolean;
  /** Status says owned, but the refreshed catalog has not proved it yet. */
  hasUnresolvedConfirmedIntent: boolean;
}

const storageKeyFor = (businessId: number | string) =>
  `zavoia.websiteCheckoutIntent.${String(businessId)}`;

const isPositiveInteger = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

const requestedVariantIds = (payload: WebsiteVariantCheckoutPayload): Set<number> =>
  new Set(
    [payload.variantId, ...(payload.variantIds ?? [])].filter(isPositiveInteger),
  );

const requestedSectionIds = (payload: WebsiteVariantCheckoutPayload): Set<number> =>
  new Set((payload.sectionIds ?? []).filter(isPositiveInteger));

const requestedThemeAssetIds = (payload: WebsiteVariantCheckoutPayload): Set<number> =>
  new Set((payload.themeAssetIds ?? []).filter(isPositiveInteger));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isThemeAssetKind = (
  value: unknown,
): value is WebsiteThemeAssetCatalogItem["kind"] => value === "color" || value === "font";

interface ParsedCheckoutIntent {
  intent: WebsiteCheckoutIntent;
  migrated: boolean;
}

function parseIntent(value: string, businessId: string): ParsedCheckoutIntent | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return null;
    const record = parsed;
    if (
      (record.version !== LEGACY_CHECKOUT_INTENT_VERSION &&
        record.version !== THEME_ASSET_CHECKOUT_INTENT_VERSION &&
        record.version !== CHECKOUT_INTENT_VERSION) ||
      record.businessId !== businessId ||
      !Array.isArray(record.variants) ||
      !Array.isArray(record.sections) ||
      (record.version !== LEGACY_CHECKOUT_INTENT_VERSION &&
        record.themeAssets !== undefined &&
        !Array.isArray(record.themeAssets))
    ) {
      return null;
    }

    const variants = record.variants.flatMap(
      (entry): CheckoutVariantIntent[] =>
        isRecord(entry) &&
        isPositiveInteger(entry.catalogId) &&
        isNonEmptyString(entry.sectionType) &&
        isNonEmptyString(entry.variantKey)
          ? [{
              catalogId: entry.catalogId,
              sectionType: entry.sectionType,
              variantKey: entry.variantKey,
              enableSection:
                record.version === CHECKOUT_INTENT_VERSION &&
                entry.enableSection === true,
            }]
          : [],
    );
    const sections = record.sections.filter(
      (entry): entry is CheckoutSectionIntent =>
        isRecord(entry) &&
        isPositiveInteger(entry.catalogId) &&
        isNonEmptyString(entry.sectionType),
    );
    const rawThemeAssets =
      record.version !== LEGACY_CHECKOUT_INTENT_VERSION && Array.isArray(record.themeAssets)
        ? record.themeAssets
        : [];
    const themeAssets = rawThemeAssets.filter(
      (entry): entry is CheckoutThemeAssetIntent =>
        isRecord(entry) &&
        isPositiveInteger(entry.catalogId) &&
        isThemeAssetKind(entry.kind) &&
        isNonEmptyString(entry.assetKey) &&
        isNonEmptyString(entry.value),
    );

    return {
      intent: {
        version: CHECKOUT_INTENT_VERSION,
        businessId,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
        variants,
        sections,
        themeAssets,
      },
      migrated: record.version !== CHECKOUT_INTENT_VERSION,
    };
  } catch {
    return null;
  }
}

function readIntent(businessId: number | string): WebsiteCheckoutIntent | null {
  if (typeof window === "undefined") return null;
  const normalizedBusinessId = String(businessId);
  const key = storageKeyFor(normalizedBusinessId);
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    const parsed = parseIntent(stored, normalizedBusinessId);
    if (!parsed) {
      window.localStorage.removeItem(key);
      return null;
    }
    if (parsed.migrated) writeIntent(parsed.intent);
    return parsed.intent;
  } catch {
    return null;
  }
}

function writeIntent(intent: WebsiteCheckoutIntent): void {
  if (typeof window === "undefined") return;
  const key = storageKeyFor(intent.businessId);
  try {
    if (
      intent.variants.length === 0 &&
      intent.sections.length === 0 &&
      intent.themeAssets.length === 0
    ) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(intent));
  } catch {
    // Checkout still works if storage is unavailable; only automatic selection recovery is lost.
  }
}

export function clearWebsiteCheckoutIntent(
  businessId: number | string | null | undefined,
): void {
  if (businessId === null || businessId === undefined || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKeyFor(businessId));
  } catch {
    // Storage can be disabled independently of the checkout flow.
  }
}

/**
 * Capture only selections represented by the checkout that is about to start. Cart items
 * that are not the active preview choice remain purchases, but are not silently applied to
 * the draft after return.
 */
export function persistWebsiteCheckoutIntent({
  businessId,
  payload,
  previewOnlyVariants,
  previewOnlyThemeSelections,
  pageLayout = [],
  variantCatalog,
  sectionCatalog,
  themeAssetCatalog = [],
}: {
  businessId: number | string | null;
  payload: WebsiteVariantCheckoutPayload;
  previewOnlyVariants: PreviewOnlyVariantSelections;
  /** The live preview values at checkout time. At most its active color and font are captured. */
  previewOnlyThemeSelections?: PreviewOnlyThemeSelections;
  /** The working draft layout, used only to preserve an explicit paid-only enablement. */
  pageLayout?: readonly SectionEntry[];
  variantCatalog: readonly WebsiteVariantCatalogEntry[];
  sectionCatalog: readonly WebsiteSectionCatalogEntry[];
  themeAssetCatalog?: readonly WebsiteThemeAssetCatalogItem[];
}): void {
  if (businessId === null) return;

  const variantIds = requestedVariantIds(payload);
  const sectionIds = requestedSectionIds(payload);
  const themeAssetIds = requestedThemeAssetIds(payload);
  const variantsBySectionType = new Map<string, WebsiteVariantCatalogEntry[]>();
  for (const entry of variantCatalog) {
    const entries = variantsBySectionType.get(entry.sectionType) ?? [];
    entries.push(entry);
    variantsBySectionType.set(entry.sectionType, entries);
  }
  const paidOnlyVariantSectionTypes = new Set(
    [...variantsBySectionType]
      .filter(([, entries]) =>
        entries.length > 0 &&
        !entries.some((entry) => entry.isBase) &&
        entries.every((entry) => entry.priceMinor > 0),
      )
      .map(([sectionType]) => sectionType),
  );
  const currentVariants = Object.entries(previewOnlyVariants).flatMap(
    ([sectionType, variantKey]): CheckoutVariantIntent[] => {
      const catalogEntry = variantCatalog.find(
        (entry) =>
          entry.sectionType === sectionType &&
          entry.variantKey === variantKey &&
          variantIds.has(entry.id) &&
          entry.priceMinor > 0 &&
          !entry.owned,
      );
      return catalogEntry
        ? [{
            catalogId: catalogEntry.id,
            sectionType,
            variantKey,
            enableSection:
              paidOnlyVariantSectionTypes.has(sectionType) &&
              pageLayout.some(
                (entry) => entry.type === sectionType && entry.visible === false,
              ),
          }]
        : [];
    },
  );
  const retainedVariantIds = new Set(currentVariants.map((entry) => entry.catalogId));
  const retainedVariantSectionTypes = new Set(
    Object.entries(previewOnlyVariants).flatMap(([sectionType, variantKey]) =>
      variantCatalog.some(
        (entry) =>
          entry.sectionType === sectionType &&
          entry.variantKey === variantKey &&
          entry.priceMinor > 0 &&
          !entry.owned,
      )
        ? [sectionType]
        : [],
    ),
  );
  const previousIntent = readIntent(businessId);
  const retainedRequestedVariants = (previousIntent?.variants ?? []).filter((entry) => {
    if (
      !variantIds.has(entry.catalogId) ||
      retainedVariantIds.has(entry.catalogId) ||
      retainedVariantSectionTypes.has(entry.sectionType)
    ) return false;
    const remainsPurchasable = variantCatalog.some(
      (candidate) =>
        candidate.id === entry.catalogId &&
        candidate.sectionType === entry.sectionType &&
        candidate.variantKey === entry.variantKey &&
        candidate.priceMinor > 0 &&
        !candidate.owned &&
        candidate.available !== false,
    );
    if (remainsPurchasable) {
      retainedVariantIds.add(entry.catalogId);
      retainedVariantSectionTypes.add(entry.sectionType);
    }
    return remainsPurchasable;
  });
  // A partial Stripe return can remount the builder before SectionBuilder reconstructs its
  // local preview map. Preserve only prior selections that are still explicit rows in this
  // new checkout payload and still match the live, purchasable server catalog. Any current
  // preview for that section wins even when it is not itself part of this checkout.
  const variants = [...currentVariants, ...retainedRequestedVariants];
  const sections = sectionCatalog
    .filter(
      (entry) =>
        sectionIds.has(entry.id) && entry.priceMinor > 0 && !entry.owned,
    )
    .map((entry) => ({
      catalogId: entry.id,
      sectionType: entry.sectionType,
    }));
  const capturedThemeKinds = new Set<WebsiteThemeAssetCatalogItem["kind"]>();
  const themeAssets = themeAssetCatalog.flatMap(
    (entry): CheckoutThemeAssetIntent[] => {
      if (
        capturedThemeKinds.has(entry.kind) ||
        !themeAssetIds.has(entry.id) ||
        entry.isIncluded ||
        entry.priceMinor <= 0 ||
        entry.owned
      ) {
        return [];
      }
      const previewValue = previewOnlyThemeSelections?.[entry.kind];
      if (!isNonEmptyString(previewValue)) return [];
      const matchesPreview =
        entry.kind === "color"
          ? entry.value.toLowerCase() === previewValue.toLowerCase()
          : entry.assetKey === previewValue;
      if (!matchesPreview) return [];

      capturedThemeKinds.add(entry.kind);
      return [{
        catalogId: entry.id,
        kind: entry.kind,
        assetKey: entry.assetKey,
        value: entry.value,
      }];
    },
  );

  writeIntent({
    version: CHECKOUT_INTENT_VERSION,
    businessId: String(businessId),
    createdAt: new Date().toISOString(),
    variants,
    sections,
    themeAssets,
  });
}

/**
 * Reconcile against two independent server proofs: checkout status confirms the item id,
 * then the refreshed catalog confirms ownership for this business. Only that intersection
 * may enter the draft. Confirmed entries are consumed; partial/unconfirmed intent remains
 * available for a later checkout instead of being guessed as owned.
 */
export function reconcileWebsiteCheckoutIntent({
  businessId,
  ownedVariantIds,
  ownedSectionIds,
  ownedThemeAssetIds,
  variantCatalog,
  sectionCatalog,
  themeAssetCatalog,
}: {
  businessId: number | string | null | undefined;
  ownedVariantIds: ReadonlySet<number>;
  ownedSectionIds: ReadonlySet<number>;
  ownedThemeAssetIds: ReadonlySet<number>;
  variantCatalog: readonly WebsiteVariantCatalogEntry[];
  sectionCatalog: readonly WebsiteSectionCatalogEntry[];
  themeAssetCatalog: readonly WebsiteThemeAssetCatalogItem[];
}): ReconciledCheckoutIntent | null {
  if (businessId === null || businessId === undefined) return null;
  const intent = readIntent(businessId);
  if (!intent) return null;

  const variantSelections: ReconciledCheckoutIntent["variantSelections"] = [];
  const remainingVariants = intent.variants.filter((entry) => {
    if (!ownedVariantIds.has(entry.catalogId)) return true;
    const catalogEntry = variantCatalog.find(
      (candidate) =>
        candidate.id === entry.catalogId &&
        candidate.sectionType === entry.sectionType &&
        candidate.variantKey === entry.variantKey &&
        candidate.owned,
    );
    if (!catalogEntry) return true;
    variantSelections.push({
      sectionType: entry.sectionType,
      variantKey: entry.variantKey,
      enableSection: entry.enableSection,
    });
    return false;
  });

  const remainingSections = intent.sections.filter((entry) => {
    if (!ownedSectionIds.has(entry.catalogId)) return true;
    const catalogEntry = sectionCatalog.find(
      (candidate) =>
        candidate.id === entry.catalogId &&
        candidate.sectionType === entry.sectionType &&
        candidate.owned,
    );
    return !catalogEntry;
  });

  const themeSelections: ReconciledCheckoutIntent["themeSelections"] = [];
  const remainingThemeAssets = intent.themeAssets.filter((entry) => {
    if (!ownedThemeAssetIds.has(entry.catalogId)) return true;
    const catalogEntry = themeAssetCatalog.find(
      (candidate) =>
        candidate.id === entry.catalogId &&
        candidate.kind === entry.kind &&
        candidate.assetKey === entry.assetKey &&
        candidate.value === entry.value &&
        candidate.owned,
    );
    if (!catalogEntry) return true;
    themeSelections.push({ ...entry });
    return false;
  });

  const nextIntent = {
    ...intent,
    variants: remainingVariants,
    sections: remainingSections,
    themeAssets: remainingThemeAssets,
  };
  writeIntent(nextIntent);

  return {
    variantSelections,
    themeSelections,
    hasRemainingIntent:
      remainingVariants.length > 0 ||
      remainingSections.length > 0 ||
      remainingThemeAssets.length > 0,
    hasUnresolvedConfirmedIntent:
      remainingVariants.some((entry) => ownedVariantIds.has(entry.catalogId)) ||
      remainingSections.some((entry) => ownedSectionIds.has(entry.catalogId)) ||
      remainingThemeAssets.some((entry) => ownedThemeAssetIds.has(entry.catalogId)),
  };
}
