import type { Business as GlobalBusiness } from "../business/types";
import type { TeamMember as GlobalTeamMember } from "../../shared/types/team-member";

// Business data from API response - using the global business type
export type Business = GlobalBusiness;

export interface PortfolioImageData {
  url: string;
  key: string;
  originalName?: string;
  size?: number;
}

// --- Business-page section builder (v1) ---
// The business page is a themed *arrangement* (a "view") over existing business data. The layout
// stores only order/visibility/variant + small per-section config refs — never duplicated content.
// Content for each section is read from its existing model (locations, team, reviews, …); only the
// FAQ and Announcement sections carry their own (bilingual) content.

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

/**
 * Typed view of a locations section's `config`: which locations to hide, plus optional bilingual copy
 * overrides for the section heading + sub-lede. Blank/absent copy falls back to the default editorial
 * strings (the public page renders per visitor locale, so each language overrides independently).
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
 * Contact). Blank/absent copy falls back to the default editorial string; stored per locale so the public
 * page renders in the visitor's language. Mirrors `LocationsConfig`'s copy fields.
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
 * in `timezone` (IANA). Captured here; the public page enforces it — the dashboard preview always
 * shows the bar so it stays editable.
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

// Marketplace listing model with customizable details
export interface MarketplaceListing {
  businessId: number;
  isListed: boolean;
  hiddenBySystem?: boolean; // System-driven hide (billing/industry change); listing stays published
  showTeamMembers: boolean;
  showServices: boolean;
  showLocations: boolean;
  marketplaceName?: string | null; // Custom name for marketplace
  marketplaceEmail?: string | null; // Public contact email
  marketplacePhone?: string | null; // Public contact phone
  marketplaceDescription?: string | null; // Business description
  useBusinessName?: boolean; // Use business name or custom
  useBusinessEmail?: boolean; // Use business email or custom
  useBusinessPhone?: boolean; // Use business phone or custom
  useBusinessDescription?: boolean; // Use business description or custom
  // Business-page (microsite) content
  heroImageUrl?: string | null; // Hero/cover image URL
  heroImageKey?: string | null; // R2 storage key for hero deletion
  tagline?: string | null; // Short business-page tagline
  aboutContent?: string | null; // Long-form about content
  brandColorHex?: string | null; // Accent color, hex e.g. #1B9C85
  // Section builder (v1): arrangement + theme + the two net-new content blocks
  pageLayout?: SectionEntry[] | null;
  pageTheme?: PageTheme | null;
  faq?: FaqItem[] | null;
  announcement?: AnnouncementContent | null;
  layoutVersion?: number;
  // Effective values calculated by backend
  effectiveName?: string;
  effectiveEmail?: string;
  effectivePhone?: string;
  effectiveDescription?: string;
}

export interface Location {
  id: number;
  uuid: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  addressComponents: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  mapPinConfirmed?: boolean;
  timezone: string;
  workingHours: any;
  open247: boolean;
  isPublic: boolean;
  allowOnlineBooking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  uuid: string;
  name: string;
  description: string;
  color: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  uuid: string;
  categoryId: number;
  name: string;
  description: string;
  price_amount_minor: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export type TeamMember = GlobalTeamMember;

export interface Industry {
  id: number;
  name: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IndustryTag {
  id: number;
  name: string;
  slug?: string;
}

// Minimal bundle shape for marketplace catalog (from assignment tables)
export interface MarketplaceBundle {
  id: number;
  name: string;
}

// Location with assignments (read from actual assignment tables)
export interface LocationWithAssignments extends Location {
  services: Service[];
  bundles?: MarketplaceBundle[];
  teamMembers: TeamMember[];
  portfolioImages: PortfolioImageData[];
  featuredImage: string | null;
  // Cached per-location review stats (denormalized on the backend)
  averageRating?: number | null;
  totalReviews?: number;
  // Per-location marketplace tag IDs, one array per group (resolved to labels via useLocationTagDictionaries).
  amenityTagIds?: number[];
  audienceTagIds?: number[];
  valueTagIds?: number[];
  accessibilityTagIds?: number[];
  paymentMethodTagIds?: number[];
  languageTagIds?: number[];
}

export interface MarketplaceListingResponse {
  business: Business;
  listing: MarketplaceListing;
  // Location-scoped catalog (read from actual assignment tables)
  locationCatalog: LocationWithAssignments[];
  industries: Industry[];
  industryTags: IndustryTag[];
  selectedIndustryTags: IndustryTag[];
  bookingSettings: BookingSettings;
}

// Payload for publishing marketplace listing
export interface PublishMarketplaceListingPayload {
  marketplaceName?: string;
  marketplaceEmail?: string;
  marketplacePhone?: string;
  marketplaceDescription?: string;
  showTeamMembers?: boolean;
  showServices?: boolean;
  showLocations?: boolean;
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessPhone?: boolean;
  useBusinessDescription?: boolean;
  industryTagIds?: number[];
  // Business-page (microsite) content. tagline/aboutContent/brandColorHex persist on the listing.
  // (The vanity slug is system-generated server-side from the name; it is not part of this payload.)
  tagline?: string;
  aboutContent?: string;
  brandColorHex?: string;
  // Section builder (v1): arrangement + theme + net-new content. Sent on the same Save as the rest.
  pageLayout?: SectionEntry[];
  pageTheme?: PageTheme;
  faq?: FaqItem[];
  announcement?: AnnouncementContent;
  layoutVersion?: number;
  // Note: Per-location publicity and online-booking flags are toggled inline per location, not in this payload.
  // Note: Assignments are managed in the Assignments flow.
  // Note: Portfolio images AND featured image are saved immediately on change, not on Save.
}

// Booking settings for marketplace
export interface BookingSettings {
  businessId: number;
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingMinutes: number;
  slotIntervalMinutes: number;
  bufferTimeMinutes: number;
  cancellationWindowMinutes: number;
  rescheduleWindowMinutes: number;
  allowCustomerCancellation: boolean;
  allowCustomerReschedule: boolean;
  autoConfirmBookings: boolean;
  allowStaffSelection: boolean;
  showAnyStaffOption: boolean;
  allowStaffCancelWithoutConfirmation: boolean;
  allowStaffRescheduleWithoutConfirmation: boolean;
  allowStaffBlockCalendarWithoutConfirmation: boolean;
  staffBlockCalendarTypes: string[];
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderHoursBefore: number;
  enforceMinAdvanceForAdmin: boolean;
}

// Payload for updating booking settings (omit businessId as it's not editable)
export type UpdateBookingSettingsPayload = Omit<BookingSettings, 'businessId'>;

// --- Paid section variants (website builder) ---

/**
 * One ACTIVE entry from the backend paid-variant catalog (GET /website-variants/catalog).
 * Merged onto the static section catalog by (sectionType, variantKey): a `priceMinor > 0`
 * entry that is not `owned` renders as a locked, purchasable layout pill. `owned` is
 * per-business (a COMPLETED one-time purchase) and permanent — it survives downgrades.
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
}

/**
 * One ACTIVE entry from the backend SECTION catalog — the builder renders its
 * section list from these. `priceMinor > 0` and not `owned` = a locked section
 * card that must be unlocked (one-time purchase) before it can be shown/published.
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

// Redux state for marketplace feature
export interface MarketplaceState {
  isLoading: boolean;
  error: string | null;
  business: Business | null;
  listing: MarketplaceListing | null;
  // Location-scoped catalog (read from actual assignment tables)
  locationCatalog: LocationWithAssignments[];
  industries: Industry[];
  industryTags: IndustryTag[];
  selectedIndustryTags: IndustryTag[];
  isPublishing: boolean;
  // Per-location flag updates in flight (location IDs)
  updatingLocationFlags: number[];
  // Booking settings
  bookingSettings: BookingSettings | null;
  isSavingBookingSettings: boolean;
  // Server-driven website builder offering (sections + their variants)
  variantCatalog: WebsiteVariantCatalogEntry[];
  sectionCatalog: WebsiteSectionCatalogEntry[];
  isLoadingVariantCatalog: boolean;
  isCreatingVariantCheckout: boolean;
  /** Shopping cart of catalog variant ids awaiting one combined checkout (persisted to localStorage per business). */
  variantCart: number[];
  /** Shopping cart of section catalog ids (unlocks) — checked out together with the variants. */
  sectionCart: number[];
}

