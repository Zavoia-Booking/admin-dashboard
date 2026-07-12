// --- Website Builder feature types ---
// The Website is a themed *arrangement* (a "view") over existing business data. The layout
// stores only order/visibility/variant + small per-section config refs — never duplicated
// content. Content for each section is read from its existing model (locations, team,
// reviews, …); only the FAQ and Announcement sections carry their own (bilingual) content.
//
// Drafts save through the dedicated PUT /website-builder with optimistic concurrency
// (expectedVersion → 409 on a stale tab). Website saves never publish, rename, retag, or
// remap the Marketplace listing.

import type { LocationWithAssignments } from '../marketplace/types';

// Cross-feature data models the Website renderer consumes (the location preview projection
// and canonical business shape are owned by the marketplace read API and shared types).
export type {
  Business,
  LocationWithAssignments,
  TeamMember,
  PortfolioImageData,
  MarketplaceBundle,
} from '../marketplace/types';

/** Bilingual text for the two net-new content sections (FAQ + Announcement). */
export interface LocaleText {
  en: string;
  ro: string;
}

export type SectionType =
  | 'announcement'
  | 'nav'
  | 'hero'
  | 'marquee'
  | 'about'
  | 'locations'
  | 'gallery'
  | 'team'
  | 'interlude'
  | 'testimonials'
  | 'faq'
  | 'footer';

/** One section in the ordered page layout. `config` holds small refs/toggles only — no content. */
export interface SectionEntry {
  type: SectionType | string; // string tolerates an unrecognized stored type (skip-unknown fallback)
  variant: string;
  visible: boolean;
  config?: Record<string, unknown>;
}

export type PageLayout = SectionEntry[];

/** Typed view of a hero section's `config` — small display toggles + optional copy; all optional. */
export interface HeroConfig {
  showRating?: boolean; // rating + reviews block (still needs real reviews); default on
  showEyebrow?: boolean; // intro line above the name (auto-built from locations); default on
  // How a cover photo fills the hero (only meaningful once a cover exists; no cover ⇒ drenched field).
  // "full" = full-bleed cinematic cover (default); "plate" = tall photo bleed with a paper card over it.
  coverLayout?: "full" | "plate";
}

/** Announcement tone — an independent axis layered under the layout variant; colours the whole ribbon. */
export type AnnouncementTone = "neutral" | "offer" | "alert";

/** Typed view of an announcement section's `config`. The layout is the section `variant`; the tone (colour)
 *  is config, so it composes with any layout. */
export interface AnnouncementConfig {
  tone?: AnnouncementTone;
}

/**
 * Typed view of a locations section's `config`: which locations to hide, plus optional bilingual copy
 * overrides for the section heading + sub-lede. Blank/absent copy falls back to the default editorial
 * strings (the dashboard preview uses the active interface locale; future delivery can choose per visitor).
 */
export interface LocationsConfig {
  /** Owner-hidden location IDs; empty/absent = show all. */
  hiddenLocationIds?: number[];
  /** Heading override per locale; a blank/missing locale uses the default copy. */
  heading?: LocaleText;
  /** Sub-lede override per locale; a blank/missing locale uses the default copy. */
  sublede?: LocaleText;
}

/**
 * Optional bilingual heading + sub-lede overrides shared by the view sections (Team / Gallery / Reviews /
 * Contact). Blank/absent copy falls back to the default editorial string; stored per locale for the
 * dashboard preview and future delivery. Mirrors `LocationsConfig`'s copy fields.
 */
export interface SectionCopyConfig {
  heading?: LocaleText;
  sublede?: LocaleText;
}

export type TeamConfig = SectionCopyConfig;
export type GalleryConfig = SectionCopyConfig;

/** Reviews section config: copy overrides + a toggle for the synthetic rating-distribution block. */
export interface ReviewsConfig extends SectionCopyConfig {
  /** Hide the 5-star rating-distribution bars (shown by default when there are reviews). */
  hideDistribution?: boolean;
}

/** Theme tokens: brand accent color + a curated font "personality" key (mapped to a stack on render). */
export interface PageTheme {
  // Mirrors the listing-level `brandColorHex`. Intentionally named `brandColor` here to match the
  // backend `pageTheme` JSON column shape ({ brandColor, fontKey }) — this is the renderer contract,
  // so do NOT rename it to brandColorHex.
  brandColor?: string | null;
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
  start?: string | null;
  end?: string | null;
  timezone?: string | null;
}

export interface AnnouncementContent {
  message: LocaleText;
  cta: AnnouncementCta;
  schedule?: AnnouncementSchedule | null;
  /** @deprecated legacy single link — migrated into `cta.url` on read; no longer written. */
  link?: string | null;
}

// --- Dedicated Website Builder API (GET/PUT /website-builder) ---

/** Canonical Business identity inherited by the Website — read-only here, edited in the Business profile. */
export interface WebsiteIdentity {
  name: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
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
  brandColorHex: string | null;
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
 * Publish state: owner intent + snapshot metadata. The public app serves the frozen
 * snapshot only while isPublished AND the tier-2 subscription is active (suspend on
 * lapse, auto-restore on renewal). `hasUnpublishedChanges` is the server's view at
 * fetch time; the workspace derives it live from draft.version vs publishedVersion.
 */
export interface WebsitePublishState {
  isPublished: boolean;
  publishedAt: string | null;
  publishedVersion: number | null;
  hasUnpublishedChanges: boolean;
}

/** E07 details: paid content in the layout that must be unlocked before it can go live. */
export interface WebsiteUnownedPublishItems {
  unownedVariants: Array<{ sectionType: string; variantKey: string; name: string }>;
  unownedSections: Array<{ sectionType: string; name: string }>;
}

/** GET /website-builder response. `locations` reuses the marketplace location projection. */
export interface WebsiteBuilderResponse {
  identity: WebsiteIdentity;
  draft: WebsiteDraft;
  locations: LocationWithAssignments[];
  publish: WebsitePublishState;
  access: WebsiteAccess;
}

/** PUT /website-builder request — the full draft plus the version handshake. */
export interface UpdateWebsiteDraftPayload {
  expectedVersion: number;
  tagline: string | null;
  aboutContent: string | null;
  brandColorHex: string | null;
  pageLayout: SectionEntry[];
  pageTheme: PageTheme;
  faq: FaqItem[];
  announcement: AnnouncementContent | null;
  layoutVersion: number;
}

/** 409 payload surfaced when a stale tab tries to overwrite a newer draft. */
export interface WebsiteDraftConflict {
  currentVersion: number;
  updatedAt: string | null;
}

export interface WebsiteHeroMutationResponse {
  heroImageUrl: string | null;
  version: number;
  updatedAt: string | null;
}

// --- Paid section variants (website builder store) ---

/**
 * One entry from the backend variant catalog (GET /website-variants/catalog).
 * Merged onto the static section catalog by (sectionType, variantKey): a `priceMinor > 0`
 * entry that is not `owned` renders as a locked, purchasable layout pill. `owned` is
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
  /** The section's free default variant — always offered, unlocked. */
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

/** GET /website-variants/catalog — the builder's full server-driven offering. */
export interface WebsiteCatalogResponse {
  sections: WebsiteSectionCatalogEntry[];
  variants: WebsiteVariantCatalogEntry[];
}

/**
 * Payload for POST /website-variants/checkout (one-time Stripe purchase).
 * Single purchase: variantId or sectionIds: [id]. Cart purchase: variantIds
 * and/or sectionIds — all bought in ONE Stripe session (the backend sums them
 * and invoices them together).
 */
export interface WebsiteVariantCheckoutPayload {
  variantId?: number;
  variantIds?: number[];
  /** Section unlocks bought in the same session/cart. */
  sectionIds?: number[];
  successUrl: string;
  cancelUrl: string;
}

/** GET /website-variants/checkout-status/:sessionId — owner-scoped return reconciliation. */
export type WebsiteCheckoutItemStatus = 'pending' | 'completed' | 'partial' | 'failed' | 'refunded' | 'expired';

export interface WebsiteCheckoutStatusResponse {
  sessionId: string;
  status: WebsiteCheckoutItemStatus;
  variants: Array<{ variantId: number; status: WebsiteCheckoutItemStatus; owned: boolean }>;
  sections: Array<{ sectionId: number; status: WebsiteCheckoutItemStatus; owned: boolean }>;
  /** Item ids whose ownership is confirmed by the server, including a partial checkout. */
  ownedVariantIds: number[];
  ownedSectionIds: number[];
}

// --- Redux state ---

export interface WebsiteState {
  /** Account/business scope that owns every value in this slice. */
  scopeBusinessId: string | null;
  isLoading: boolean;
  error: string | null;
  /** GET /website-builder view — identity, saved draft, locations, access. */
  identity: WebsiteIdentity | null;
  draft: WebsiteDraft | null;
  locations: LocationWithAssignments[];
  access: WebsiteAccess | null;
  /** Publish state (null until the first fetch lands). */
  publish: WebsitePublishState | null;
  isPublishing: boolean;
  isUnpublishing: boolean;
  // Draft save lifecycle
  isSaving: boolean;
  /** True while the immediate, versioned hero upload/delete mutation is in flight. */
  isHeroMutating: boolean;
  /** Request identity of the last save that reached the server. */
  lastSavedRequestId: string | null;
  /** Set when a save hit 409 — a newer draft exists on the server. */
  conflict: WebsiteDraftConflict | null;
  /** Names of unowned premium items that blocked the last publish (E07); null when none. */
  publishLockedItems: string[] | null;
  // Store: server-driven offering (sections + their variants)
  variantCatalog: WebsiteVariantCatalogEntry[];
  sectionCatalog: WebsiteSectionCatalogEntry[];
  isLoadingCatalog: boolean;
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
  /** The business that supplied the currently hydrated carts; null until hydration completes. */
  cartBusinessId: string | null;
}
