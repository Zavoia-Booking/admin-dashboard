import type {
  SectionEntry,
  WebsiteBuilderLocation,
  FaqItem,
  AnnouncementContent,
} from "../../../../types";
import type { ResolvedTagDictionaries } from "../../../../../marketplace/hooks/useLocationTagDictionaries";

/** A real customer quote for the Reviews section, pre-shaped from the reviews API (comment non-empty). */
export interface PreviewReview {
  id: number;
  rating: number;
  comment: string;
  customerName: string;
  locationName: string | null;
  createdAt: string;
}

export interface PreviewData {
  businessName: string;
  businessTimezone: string;
  logo: string | null;
  heroImageUrl: string | null;
  tagline: string;
  aboutContent: string;
  establishedYear: number | null;
  /** Customer-facing ISO 4217 currency for the location service menu. */
  businessCurrency: string;
  email: string;
  phone: string;
  social: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    website?: string | null;
    pinterest?: string | null;
  };
  locations: WebsiteBuilderLocation[];
  faq: FaqItem[];
  announcement: AnnouncementContent;
  brandColor: string;
  fontKey: string;
  locale: "en" | "ro";
  /** Curated 5★ quotes for the Reviews section (empty/absent → aggregate-only render). */
  reviews?: PreviewReview[];
  /** Per team-member rating keyed by member id (from the reviews stats endpoint; absent → no stars). */
  teamRatings?: Record<number, { rating: number; count: number }>;
  /** Business-wide per-star review counts (from the reviews stats endpoint) for the distribution bars. */
  ratingDistribution?: RatingBars;
  /** Resolved location-tag dictionaries (label/slug per tag id), supplied by the host so the Locations
   *  section stays a pure render: the dashboard passes the authenticated fetch's result, the public page
   *  supplies its own. Absent/null → the tag band doesn't render. */
  tagDictionaries?: ResolvedTagDictionaries | null;
}

/** Per-star review counts (5 → 1), as returned by the reviews stats endpoint. */
export type RatingBars = { "1": number; "2": number; "3": number; "4": number; "5": number };

export interface LivePreviewProps {
  layout: SectionEntry[];
  data: PreviewData;
  /**
   * Render the site chrome (fixed nav + editorial footer) around the sections — true for the full-page
   * preview, false for the per-section scoped card (where a single section is shown on its own).
   */
  chrome?: boolean;
  /**
   * Ordinal the first numbered section should carry (default 1). The per-section preview passes the
   * section's real number in the full page so its "0N —" kicker stays in sync with the others.
   */
  startNumber?: number;
  /** Optional section type the host wants to scroll to or identify in the preview. */
  focusType?: string;
  /** Optional host-controlled location shared between the editor and full preview surfaces. */
  selectedLocationId?: number | null;
  /** Reports location changes made inside the preview so mounted preview surfaces stay in sync. */
  onSelectedLocationChange?: (locationId: number | null) => void;
  /** Optional website-wide location scope for a one-section preview whose trimmed layout omits Locations. */
  locationScope?: WebsiteBuilderLocation[];
}

export type T = (k: string, o?: Record<string, unknown>) => string;
