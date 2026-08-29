// --- Website Builder feature types ---
// The Website is a themed *arrangement* (a "view") over existing business data. The layout
// stores only order/visibility/variant + small per-section config refs — never duplicated
// content. Content for each section is read from its existing model (locations, team,
// reviews, …); only the FAQ and Announcement sections carry their own (bilingual) content.
//
// Drafts save through the dedicated PUT /website-builder with optimistic concurrency
// (expectedVersion → 409 on a stale tab). Website saves never publish, rename, retag, or
// remap the Marketplace listing.

// Business identity remains canonical shared account data. Location content has a dedicated
// Website projection below so Marketplace management fields never become part of this API.
export type { Business } from '../marketplace/types';

export type WebsiteBuilderDayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface WebsiteBuilderWorkingDay {
  open?: string | null;
  close?: string | null;
  isOpen?: boolean | null;
}

export type WebsiteBuilderWorkingHours = Partial<
  Record<WebsiteBuilderDayKey, WebsiteBuilderWorkingDay | null>
>;

export interface WebsiteBuilderAddressComponents {
  street?: string | null;
  streetNumber?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface WebsiteBuilderPortfolioImage {
  url: string;
  key: string;
  originalName?: string | null;
}

export interface WebsiteBuilderTeamMember {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  /** Kept during the response-contract rollout for older Team previews. */
  role?: 'owner' | 'team_member';
}

export interface WebsiteBuilderServiceCategory {
  id: number;
  name: string;
  displayOrder: number | null;
}

export interface WebsiteBuilderService {
  id: number;
  name: string | null;
  description: string | null;
  duration: number;
  price_amount_minor: number;
  categoryId: number | null;
  category: WebsiteBuilderServiceCategory | null;
}

export interface WebsiteBuilderBundle {
  id: number;
  name: string;
  /** Optional only for a rolling response from the pre-projection API. */
  description?: string | null;
  price_amount_minor?: number | null;
  duration?: number;
  services?: Array<{ name: string | null }>;
  /** Tolerates the former additive bundle shape while rolling API responses expire. */
  includes?: string[];
}

/** Exact GET /website-builder location projection; collections are normalized by the API. */
export interface WebsiteBuilderLocation {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  addressComponents: WebsiteBuilderAddressComponents | null;
  timezone: string | null;
  workingHours: WebsiteBuilderWorkingHours | null;
  open247: boolean;
  allowOnlineBooking: boolean;
  portfolioImages: WebsiteBuilderPortfolioImage[];
  featuredImage: string | null;
  averageRating: number | null;
  totalReviews: number;
  amenityTagIds: number[];
  paymentMethodTagIds: number[];
  languageTagIds: number[];
  services: WebsiteBuilderService[];
  bundles: WebsiteBuilderBundle[];
  teamMembers: WebsiteBuilderTeamMember[];
}

/** Bilingual text for the two net-new content sections (FAQ + Announcement). */
export interface LocaleText {
  en: string;
  ro: string;
}

/** Locale-specific explicit blank state for inherited Website Builder copy. Missing/false keeps the default. */
export interface LocaleCopyHidden {
  en?: boolean;
  ro?: boolean;
}

export type SectionType =
  | 'announcement'
  | 'nav'
  | 'hero'
  | 'marquee'
  | 'about'
  | 'services'
  | 'locations'
  | 'gallery'
  | 'team'
  | 'testimonials'
  | 'faq'
  | 'footer';

/** One section in the ordered page layout. `config` holds small refs/toggles only — no content. */
export interface SectionEntry {
  type: SectionType | string; // string tolerates an unrecognized stored type (skip-unknown fallback)
  variant: string;
  visible: boolean;
  config?: Record<string, unknown>;
  /**
   * The API's layout JSON may contain fields introduced by a newer builder. Unknown
   * section entries are opaque records: the current dashboard may move them, but it
   * must round-trip every field without narrowing the record to today's schema.
   */
  [key: string]: unknown;
}

export type PageLayout = SectionEntry[];

/** Typed view of a hero section's `config` — small display toggles + optional copy; all optional. */
export interface HeroConfig {
  showRating?: boolean; // rating + reviews block (still needs real reviews); default on
  showEyebrow?: boolean; // intro line above the name (auto-built from locations); default on
  /** Optional bilingual override for the location-derived intro line. */
  eyebrow?: LocaleText;
}

/** Footer-owned presentation copy and display toggles. Directory is currently the only design-file variant
 * that renders an uploaded business logo; absent/true preserves the existing logo-first treatment. */
export interface FooterConfig {
  /** Optional bilingual closing headline used only by Editorial. */
  headline?: LocaleText;
  /** Explicitly suppress Editorial's inherited closing headline in one locale. */
  headlineHidden?: LocaleCopyHidden;
  /** Optional bilingual description used by Directory and Editorial; blank means omitted. */
  description?: LocaleText;
  showLogo?: boolean;
}

/** Design-source announcement tone — an independent axis shared by every layout. */
export type AnnouncementTone = "neutral" | "offer";

/** Typed view of an announcement section's `config`. The layout is the section `variant`; the tone (colour)
 *  is config, so it composes with any layout. */
export interface AnnouncementConfig {
  tone?: AnnouncementTone;
}

/** Decorative mark rendered between service names in the Strip section. */
export type StripSeparatorStyle = "pearl" | "diamond" | "slash" | "sparkle" | "ring";

/** Strip appearance controls. Motion remains the section variant (`scroll` or `loop`). */
export interface StripConfig {
  separatorStyle?: StripSeparatorStyle;
  /** Separator scale as a percentage. */
  separatorSize?: number;
  /** Service-name scale as a percentage of the responsive Strip typography. */
  textSize?: number;
  /** Use the website's selected brand color as the Strip field. */
  useBrandColorBackground?: boolean;
}

/** Design-source Locations controls. The layout itself is the section `variant`. */
export interface LocationsConfig {
  /** Owner-hidden location IDs; empty/absent = show all. */
  hiddenLocationIds?: number[];
  /** Owner-defined display order; empty/absent preserves the API's stable location order. */
  orderedLocationIds?: number[];
}

/**
 * Bilingual heading/subtitle controls shared by Services and Team. Services inherits both defaults; Team
 * inherits its heading while its subtitle is plain optional copy. Explicit per-locale blank states live
 * beside inherited overrides so deleting visible text cannot be confused with an untouched legacy draft.
 */
export interface SectionCopyConfig {
  heading?: LocaleText;
  sublede?: LocaleText;
  /** Explicitly suppress the inherited heading in one locale. */
  headingHidden?: LocaleCopyHidden;
  /** Explicitly suppress the inherited subtitle in one locale. */
  subledeHidden?: LocaleCopyHidden;
}

export type TeamConfig = SectionCopyConfig;

/** Services presentation controls. Service data itself remains owned by the Services module. */
export interface ServicesConfig extends SectionCopyConfig {
  /** Optional Feature-photo overrides, with at most one owned portfolio image per location. */
  featureImageRefs?: GalleryImageRef[];
  /** Descriptions are shown by default. */
  hideDescriptions?: boolean;
  /** Durations are shown by default. */
  hideDurations?: boolean;
  /** Bundles are shown by default in their dedicated group. */
  hideBundles?: boolean;
}

/** FAQ questions remain in the dedicated FAQ payload; only its section heading lives in layout config. */
export type FaqConfig = Pick<SectionCopyConfig, "heading" | "headingHidden">;

/** Stable reference to an existing per-location portfolio image. URLs are resolved at render time. */
export interface GalleryImageRef {
  locationId: number;
  imageKey: string;
}

/** About photography is sourced from an owned location portfolio. Missing = automatic selection. */
export interface AboutConfig {
  /** One shared photo used by every About style; absent lets the builder choose a recommended photo. */
  imageRef?: GalleryImageRef;
  /** Show the real-data statistics strip; absent keeps it visible for existing drafts. */
  showStats?: boolean;
  /** Draft-only explicit blank headline state; a visible About cannot publish until it is restored or replaced. */
  headlineHidden?: boolean;
}

/** Curated Gallery selection. Missing `imageRefs` is the legacy auto-fill state; an empty array is explicit. */
export interface GalleryConfig extends Pick<SectionCopyConfig, "heading" | "headingHidden"> {
  /** Locations available to the Gallery. Missing = every owned location; empty = none. */
  includedLocationIds?: number[];
  /** Ordered images shown by every Gallery variant and its fullscreen viewer. */
  imageRefs?: GalleryImageRef[];
}

/** Reviews section config: heading override + a toggle for the synthetic rating-distribution block. */
export interface ReviewsConfig {
  heading?: LocaleText;
  headingHidden?: LocaleCopyHidden;
  /** Hide the 5-star rating-distribution bars (shown by default when there are reviews). */
  hideDistribution?: boolean;
}

/** Theme tokens: brand accent color + a curated font "personality" key (mapped to a stack on render). */
export interface PageTheme {
  // Mirrors the listing-level `brandColorHex`. Intentionally named `brandColor` here to match the
  // backend `pageTheme` JSON column shape ({ brandColor, brandColorKey, fontKey }) — this is the
  // renderer contract, so do NOT rename it to brandColorHex.
  brandColor?: string | null;
  /** Stable catalog identity for the accent; the hex remains the frozen renderer value. */
  brandColorKey?: string | null;
  fontKey?: string | null;
}

export interface FaqItem {
  q: LocaleText;
  a: LocaleText;
}

export interface AnnouncementCta {
  /** Opt-in: the call-to-action is off by default; the bar shows a button only when enabled. */
  enabled: boolean;
  /** Button copy, per locale. The button shows once enabled and the active locale has text. */
  label: LocaleText;
  /** Destination link — any URL the owner chooses. */
  url: string;
  /** Open the link in a new tab. */
  newTab: boolean;
  /** Trailing arrow glyph after the label. */
  showArrow: boolean;
}

/**
 * Auto show/hide window. `start`/`end` are date-only keys (`YYYY-MM-DD`) interpreted as calendar days
 * in `timezone` (IANA). The dashboard preview keeps the bar visible so it stays editable; schedule
 * enforcement belongs to a future customer-delivery surface.
 */
export interface AnnouncementSchedule {
  /** Temporarily nullable while the enabled editor window is being completed; both block saving. */
  start?: string | null;
  end?: string | null;
  timezone?: string | null;
  /** Backward-compatible visual preference: absent means the countdown pill is shown. */
  showCountdown?: boolean;
}

export interface AnnouncementContent {
  /** Compact copy rendered directly in the bar. */
  message: LocaleText;
  /** Optional long-form explanation opened from the bar's Read more control. */
  details?: LocaleText | null;
  cta: AnnouncementCta;
  schedule?: AnnouncementSchedule | null;
  /** @deprecated legacy single link — migrated into `cta.url` on read; no longer written. */
  link?: string | null;
}

// --- Dedicated Website Builder API (GET/PUT /website-builder) ---

/** Canonical Business identity inherited by the Website — read-only here, edited in the Business profile. */
export interface WebsiteIdentity {
  /** Nullable on the wire for businesses whose profile name has not been completed yet. */
  name: string | null;
  logo: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  /** Customer-facing ISO 4217 currency used by service prices. Additive for rolling API responses. */
  businessCurrency?: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  pinterestUrl: string | null;
  websiteUrl: string | null;
}

/** The saved Website draft + its optimistic-concurrency metadata. */
export interface WebsiteDraft {
  heroImageUrl: string | null;
  heroImageKey: string | null;
  tagline: string | null;
  aboutContent: string | null;
  /** Additive Website content field; absent responses from a rolling backend are treated as null. */
  establishedYear?: number | null;
  brandColorHex: string | null;
  /** Additive during legacy-color migration; absent/null drafts still round-trip by hex. */
  brandColorKey?: string | null;
  pageLayout: SectionEntry[] | null;
  pageTheme: PageTheme | null;
  faq: FaqItem[] | null;
  announcement: AnnouncementContent | null;
  layoutVersion: number;
  /** websiteDraftVersion — send back as expectedVersion on every mutation. */
  version: number;
  /** websiteUpdatedAt; null = the draft predates independent draft tracking. */
  updatedAt: string | null;
}

export type WebsiteAccessReason = 'trial' | 'active' | 'expired' | 'no_subscription' | 'past_due' | 'ltd';

/** Plan/entitlement view for the workspace: locked state, purchase availability. */
export interface WebsiteAccess {
  canEdit: boolean;
  canPurchase: boolean;
  canPublish: boolean;
  reason: WebsiteAccessReason;
  planTier: string | null;
}

/**
 * Publish state: owner intent + frozen snapshot metadata. No current frontend consumes
 * that snapshot as a public Website, so this type deliberately makes no delivery/URL claim.
 * `hasUnpublishedChanges` is the server's view at fetch time; the workspace derives it
 * live from draft.version vs publishedVersion.
 */
export interface WebsitePublishState {
  isPublished: boolean;
  publishedAt: string | null;
  publishedVersion: number | null;
  hasUnpublishedChanges: boolean;
}

/** E07 details: paid content that must be unlocked before a snapshot can be published. */
export interface WebsiteUnownedPublishItems {
  unownedVariants: Array<{ sectionType: string; variantKey: string; name: string }>;
  unownedSections: Array<{ sectionType: string; name: string }>;
  unownedThemeAssets: Array<{
    id: number;
    kind: WebsiteThemeAssetKind;
    assetKey: string;
    /** Canonical catalog value; optional for older API responses. */
    value?: string;
    name: string;
  }>;
}

/** GET /website-builder response. `locations` is the Website-owned read projection. */
export interface WebsiteBuilderResponse {
  identity: WebsiteIdentity;
  draft: WebsiteDraft;
  locations: WebsiteBuilderLocation[];
  publish: WebsitePublishState;
  access: WebsiteAccess;
}

/** PUT /website-builder request — the full draft plus the version handshake. */
export interface UpdateWebsiteDraftPayload {
  expectedVersion: number;
  tagline: string | null;
  aboutContent: string | null;
  establishedYear: number | null;
  brandColorHex: string | null;
  /** Stable catalog identity paired with brandColorHex; optional for legacy drafts. */
  brandColorKey?: string | null;
  pageLayout: SectionEntry[];
  pageTheme: PageTheme;
  faq: FaqItem[];
  announcement: AnnouncementContent | null;
  layoutVersion: number;
}

/** Versionless UI snapshot. `expectedVersion` is injected by the serialized mutation
 * coordinator immediately before the API call, never captured by the component. */
export type UpdateWebsiteDraftBody = Omit<UpdateWebsiteDraftPayload, 'expectedVersion'>;

/** 409 payload surfaced when a stale tab tries to overwrite a newer draft. */
export interface WebsiteDraftConflict {
  currentVersion: number;
  updatedAt: string | null;
}

/** A non-conflict draft-save failure. The signature pins the failure to the exact
 * local snapshot that failed, so a later edit is new intent rather than a blind retry. */
export type WebsiteSaveFailureKind = 'offline' | 'failed' | 'cancelled';

export interface WebsiteSaveFailure {
  requestId: string;
  workingSignature: string;
  kind: WebsiteSaveFailureKind;
}

/** A retryable failure from the publish command itself. Pre-publish save failures,
 * conflicts, ownership blockers, and cancellations have their own recovery paths. */
export interface WebsitePublishFailure {
  message: string;
}

export type WebsiteDraftSaveStatus =
  | 'clean'
  | 'dirty'
  | 'invalid'
  | 'saving'
  | 'queued'
  | 'offline'
  | 'failed'
  | 'conflict';

export interface WebsiteHeroMutationResponse {
  heroImageUrl: string | null;
  version: number;
  updatedAt: string | null;
}

// --- Paid section variants (website builder store) ---

/**
 * One entry from the backend variant catalog (GET /website-variants/catalog).
 * Merged onto the static section catalog by (sectionType, variantKey): a `priceMinor > 0`
 * entry that is not `owned` renders as a locked, purchasable style. `owned` is
 * per-business (a COMPLETED one-time purchase) and permanent — it survives downgrades
 * and catalog deactivation (`available: false` = no longer purchasable, still usable).
 */
export interface WebsiteVariantCatalogEntry {
  id: number;
  uuid: string;
  sectionType: string;
  variantKey: string;
  name: string;
  description: string | null;
  /** Integer minor units (cents); 0 = free. */
  priceMinor: number;
  currency: string;
  /** Included default when one exists; a paid-only section may intentionally have no base row. */
  isBase: boolean;
  owned: boolean;
  /** Active in the catalog (purchasable). Owned entries stay usable even when false. */
  available?: boolean;
}

/**
 * One entry from the backend SECTION catalog — the builder renders its
 * section list from these. `priceMinor > 0` and not `owned` = a locked section
 * card that must be unlocked (one-time purchase) before it can be selected and saved to the draft.
 */
export interface WebsiteSectionCatalogEntry {
  id: number;
  uuid: string;
  sectionType: string;
  name: string;
  description: string | null;
  /** Integer minor units (cents); 0 = free section. */
  priceMinor: number;
  currency: string;
  owned: boolean;
  /** Active in the catalog (purchasable). Owned entries stay usable even when false. */
  available?: boolean;
}

export type WebsiteThemeAssetKind = 'color' | 'font';

/** One server-driven accent colour or typeface available to the Website Builder. */
export interface WebsiteThemeAssetCatalogItem {
  id: number;
  uuid: string;
  kind: WebsiteThemeAssetKind;
  /** Stable draft/snapshot identity (for example `terracotta` or `playfair`). */
  assetKey: string;
  /** Canonical hex for colors; trusted renderer key/value for fonts. */
  value: string;
  name: string;
  description: string | null;
  isIncluded: boolean;
  /** Integer minor units; included assets resolve to 0. */
  priceMinor: number;
  currency: string;
  /** Included assets and completed purchases are owned. */
  owned: boolean;
  /** False means no new purchase, while an existing owner may keep using it. */
  available: boolean;
  sortOrder: number;
}

/**
 * A style this build implements that the catalog no longer sells. It has no row, so no price
 * and no id: it cannot be bought, only replaced. Reported apart from `variants` because an
 * entry the editor simply can't find would otherwise read as Included and hand out free what
 * the catalog charges for.
 */
export interface WebsiteUnavailableVariant {
  sectionType: string;
  variantKey: string;
  /** The free style the section renders instead; null where the type has no free style. */
  fallbackVariantKey: string | null;
}

/** GET /website-variants/catalog — the builder's full server-driven offering. */
export interface WebsiteCatalogResponse {
  sections: WebsiteSectionCatalogEntry[];
  variants: WebsiteVariantCatalogEntry[];
  themeAssets: WebsiteThemeAssetCatalogItem[];
  /** Implemented styles with no catalog row — locked and unbuyable, never free. */
  unavailableVariants?: WebsiteUnavailableVariant[];
}

/**
 * Payload for POST /website-variants/checkout (one-time Stripe purchase).
 * Single purchase: variantId, sectionIds: [id], or themeAssetIds: [id]. Cart
 * purchase combines any/all item kinds in ONE Stripe session.
 */
export interface WebsiteVariantCheckoutPayload {
  variantId?: number;
  variantIds?: number[];
  /** Section unlocks bought in the same session/cart. */
  sectionIds?: number[];
  /** Paid accent colours/typefaces bought in the same session/cart. */
  themeAssetIds?: number[];
  /** Exact catalog quote the owner reviewed; the API rejects any per-item price drift. */
  expectedLineItems?: Array<{
    kind: 'variant' | 'section' | WebsiteThemeAssetKind;
    catalogId: number;
    priceMinor: number;
    currency: string;
  }>;
  successUrl: string;
  cancelUrl: string;
}

/** GET /website-variants/checkout-status/:sessionId — owner-scoped return reconciliation. */
export type WebsiteCheckoutItemStatus = 'pending' | 'completed' | 'partial' | 'failed' | 'expired';

export interface WebsiteCheckoutStatusResponse {
  sessionId: string;
  status: WebsiteCheckoutItemStatus;
  variants: Array<{ variantId: number; status: WebsiteCheckoutItemStatus; owned: boolean }>;
  sections: Array<{ sectionId: number; status: WebsiteCheckoutItemStatus; owned: boolean }>;
  themeAssets: Array<{
    themeAssetId: number;
    kind: WebsiteThemeAssetKind;
    status: WebsiteCheckoutItemStatus;
    owned: boolean;
  }>;
  /** Item ids whose ownership is confirmed by the server, including a partial checkout. */
  ownedVariantIds: number[];
  ownedSectionIds: number[];
  ownedThemeAssetIds: number[];
}

// --- Redux state ---

export interface WebsiteState {
  /** Account/business scope that owns every value in this slice. */
  scopeBusinessId: string | null;
  /** Monotonic auth-scope generation. Prevents an old async result from being adopted after
   * logout/relogin to the same business id. */
  scopeRevision: number;
  /** Monotonic generation for queued Website writes within the current auth scope. */
  mutationGeneration: number;
  isLoading: boolean;
  error: string | null;
  /** GET /website-builder view — identity, saved draft, locations, access. */
  identity: WebsiteIdentity | null;
  draft: WebsiteDraft | null;
  locations: WebsiteBuilderLocation[];
  access: WebsiteAccess | null;
  /** Publish state (null until the first fetch lands). */
  publish: WebsitePublishState | null;
  isPublishing: boolean;
  isUnpublishing: boolean;
  /** Kept after a failed publish command so the next explicit intent can be presented as a retry. */
  publishFailure: WebsitePublishFailure | null;
  // Draft save lifecycle
  isSaving: boolean;
  /** True while the immediate, versioned hero upload/delete mutation is in flight. */
  isHeroMutating: boolean;
  /** Request identity of the last save that reached the server. */
  lastSavedRequestId: string | null;
  /** Last non-conflict save failure, scoped to the submitted working signature. */
  saveFailure: WebsiteSaveFailure | null;
  /** Set when a save hit 409 — a newer draft exists on the server. */
  conflict: WebsiteDraftConflict | null;
  /** Structured E07/save-time ownership drift. Kept until the saved draft proves it resolved. */
  publishLockedItems: WebsiteUnownedPublishItems | null;
  // Store: server-driven offering (sections, variants, and theme assets)
  variantCatalog: WebsiteVariantCatalogEntry[];
  sectionCatalog: WebsiteSectionCatalogEntry[];
  themeAssetCatalog: WebsiteThemeAssetCatalogItem[];
  /** Implemented styles the catalog stopped selling — shown locked and unbuyable, never free. */
  unavailableVariants: WebsiteUnavailableVariant[];
  isLoadingCatalog: boolean;
  /** Catalog failures stay separate from the page-level builder load error. */
  catalogError: string | null;
  /** The catalog fetch has SUCCEEDED at least once. Flips the builder from permissive (every
   *  implemented section renders) to authoritative (only catalogued content renders). A later
   *  failure keeps this true and the last-good arrays, so a transient error never empties the
   *  builder; only a genuine empty success hides content. */
  catalogLoaded: boolean;
  isCreatingCheckout: boolean;
  /** Shopping cart of catalog variant ids awaiting one combined checkout (persisted to localStorage per business). */
  variantCart: number[];
  /** Shopping cart of section catalog ids (unlocks) — checked out together with the variants. */
  sectionCart: number[];
  /** Shopping cart of paid color/font catalog ids — checked out with sections and variants. */
  themeAssetCart: number[];
  /** The business that supplied the currently hydrated carts; null until hydration completes. */
  cartBusinessId: string | null;
}
