import type { ResolvedTagDictionaries } from "../../../marketplace/hooks/useLocationTagDictionaries";
import type {
  AnnouncementContent,
  Business,
  FaqItem,
  GalleryConfig,
  LocationWithAssignments,
  SectionEntry,
  WebsiteSectionCatalogEntry,
  WebsiteVariantCatalogEntry,
} from "../../types";
import { aboutHeadline } from "./aboutContent";
import { MIN_GALLERY_IMAGES, resolveGalleryImages } from "./gallerySelection";
import { completeFaqCount } from "./sectionReadiness";
import {
  MIN_TEAM_MEMBERS,
  MIN_TESTIMONIAL_REVIEWS,
  reviewCount,
  teamMemberCount,
} from "./sectionDataRequirements";
import { isKnownSectionType, PINNED_TYPES, REQUIRED_TYPES } from "./sectionCatalog";
import { UNNUMBERED } from "./preview/shared/constants";
import { MARQUEE_MIN_ITEMS } from "./preview/sections/marquee/model";
import type { PreviewData, PreviewReview, RatingBars } from "./preview/shared/types";

export {
  isTeamLocked,
  isTestimonialsLocked,
  MIN_TEAM_MEMBERS,
  MIN_TESTIMONIAL_REVIEWS,
  reviewCount,
  teamMemberCount,
} from "./sectionDataRequirements";

export type VariantCatalogByKey = ReadonlyMap<string, WebsiteVariantCatalogEntry>;
export type BaseVariantKeyByType = ReadonlyMap<string, string>;
export type SectionCatalogByType = ReadonlyMap<string, WebsiteSectionCatalogEntry>;

export interface SectionCatalogModel {
  variantByKey: VariantCatalogByKey;
  baseVariantKeyByType: BaseVariantKeyByType;
  sectionByType: SectionCatalogByType;
  ownedVariantSectionTypes: ReadonlySet<string>;
}

export interface IndexedSectionEntry {
  entry: SectionEntry;
  index: number;
}

export interface SectionRowStatus {
  label: string;
  tone?: "neutral" | "muted" | "warning" | "danger";
}

export interface SectionRowInfo {
  summary: string;
  status?: SectionRowStatus;
  noData?: boolean;
}

export type SectionBuilderT = (key: string, options?: Record<string, unknown>) => string;

export interface SectionRowInfoContext {
  t: SectionBuilderT;
  locale: "en" | "ro";
  announcementContent: AnnouncementContent;
  announcementError?: string | null;
  heroImageUrl: string | null;
  tagline: string;
  taglineError?: string;
  aboutContent: string;
  aboutError?: string | null;
  locations: LocationWithAssignments[];
  marqueeItemCount: number;
  reviews?: PreviewReview[];
  faqItems: FaqItem[];
  sectionCatalogByType: SectionCatalogByType;
  variantCatalogByKey: VariantCatalogByKey;
}

export interface BuildPreviewDataInput {
  business: Business | null;
  heroImageUrl: string | null;
  tagline: string;
  aboutContent: string;
  useBusinessEmail: boolean;
  email: string;
  useBusinessPhone: boolean;
  phone: string;
  locations: LocationWithAssignments[];
  faqItems: FaqItem[];
  announcementContent: AnnouncementContent;
  brandColorHex: string;
  fontKey: string;
  locale: "en" | "ro";
  reviews?: PreviewReview[];
  teamRatings?: Record<number, { rating: number; count: number }>;
  ratingDistribution?: RatingBars;
  tagDictionaries?: ResolvedTagDictionaries | null;
}

const catalogKey = (sectionType: string, variantKey: string) => `${sectionType}:${variantKey}`;

/** Build every catalog lookup used by the editor from one server response. */
export function buildSectionCatalogModel(
  variantCatalog?: readonly WebsiteVariantCatalogEntry[],
  sectionCatalog?: readonly WebsiteSectionCatalogEntry[],
): SectionCatalogModel {
  const variantByKey = new Map<string, WebsiteVariantCatalogEntry>();
  const baseVariantKeyByType = new Map<string, string>();
  const sectionByType = new Map<string, WebsiteSectionCatalogEntry>();
  const ownedVariantSectionTypes = new Set<string>();

  for (const entry of variantCatalog ?? []) {
    variantByKey.set(catalogKey(entry.sectionType, entry.variantKey), entry);
    if (entry.isBase) baseVariantKeyByType.set(entry.sectionType, entry.variantKey);
    if (entry.owned) ownedVariantSectionTypes.add(entry.sectionType);
  }

  for (const entry of sectionCatalog ?? []) {
    sectionByType.set(entry.sectionType, entry);
  }

  return {
    variantByKey,
    baseVariantKeyByType,
    sectionByType,
    ownedVariantSectionTypes,
  };
}

export function isPaidCatalogEntryLocked(
  entry: Pick<WebsiteVariantCatalogEntry, "priceMinor" | "owned"> | undefined | null,
): boolean {
  return !!entry && entry.priceMinor > 0 && !entry.owned;
}

/** Required page chrome is never locked, regardless of server catalog data. */
export function getLockedSectionEntry(
  type: string,
  sectionCatalogByType: SectionCatalogByType,
): WebsiteSectionCatalogEntry | null {
  if (REQUIRED_TYPES.has(type)) return null;
  const entry = sectionCatalogByType.get(type);
  return isPaidCatalogEntryLocked(entry) ? entry ?? null : null;
}

/**
 * Catalog authority governs known content sections. Unknown saved sections remain visible so an
 * older dashboard cannot silently delete data written by a newer section registry.
 */
export function isSectionOffered(
  type: string,
  catalogAuthoritative: boolean,
  sectionCatalogByType: SectionCatalogByType,
  ownedVariantSectionTypes: ReadonlySet<string>,
): boolean {
  if (!isKnownSectionType(type)) return true;
  if (REQUIRED_TYPES.has(type)) return true;
  if (!catalogAuthoritative) return true;
  return sectionCatalogByType.has(type) || ownedVariantSectionTypes.has(type);
}

export function isCatalogPending(
  loading: boolean | undefined,
  variantCatalog?: readonly WebsiteVariantCatalogEntry[],
  sectionCatalog?: readonly WebsiteSectionCatalogEntry[],
): boolean {
  return !!loading && (variantCatalog?.length ?? 0) === 0 && (sectionCatalog?.length ?? 0) === 0;
}

/** Keep only selections that are still paid, unowned, and different from the saved draft. */
export function derivePreviewOnlyVariants(
  selectedByType: Readonly<Record<string, string>>,
  layout: readonly SectionEntry[],
  variantCatalogByKey: VariantCatalogByKey,
): Record<string, string> {
  const previewOnlyByType: Record<string, string> = {};

  for (const [type, variantKey] of Object.entries(selectedByType)) {
    const saved = layout.find((section) => section.type === type);
    const catalogEntry = variantCatalogByKey.get(catalogKey(type, variantKey));
    const stillPreviewOnly =
      !!saved &&
      saved.variant !== variantKey &&
      isPaidCatalogEntryLocked(catalogEntry);

    if (stillPreviewOnly) previewOnlyByType[type] = variantKey;
  }

  return previewOnlyByType;
}

/** Overlay locked preview choices without mutating the persisted draft layout. */
export function overlayPreviewVariants(
  layout: readonly SectionEntry[],
  previewVariantByType: Readonly<Record<string, string>>,
): SectionEntry[] {
  return layout.map((section) => {
    const previewVariant = previewVariantByType[section.type];
    return previewVariant ? { ...section, variant: previewVariant } : section;
  });
}

export function getDisplaySections(
  layout: readonly SectionEntry[],
  sectionOffered: (type: string) => boolean,
): IndexedSectionEntry[] {
  return layout
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => sectionOffered(entry.type));
}

export function getMovableDisplaySections(
  displaySections: readonly IndexedSectionEntry[],
  catalogPending: boolean,
  lockedSectionEntry: (type: string) => WebsiteSectionCatalogEntry | null,
): IndexedSectionEntry[] {
  return displaySections.filter(
    ({ entry }) =>
      isKnownSectionType(entry.type) &&
      !PINNED_TYPES.has(entry.type) &&
      !lockedSectionEntry(entry.type) &&
      !catalogPending,
  );
}

export function filterOfferedSections(
  layout: readonly SectionEntry[],
  sectionOffered: (type: string) => boolean,
): SectionEntry[] {
  return layout.filter((entry) => sectionOffered(entry.type));
}

export function getPreviewNumber(
  layout: readonly SectionEntry[],
  index: number,
  sectionOffered: (type: string) => boolean,
): number {
  return (
    layout
      .slice(0, index)
      .filter((section) => section.visible && !UNNUMBERED.has(section.type) && sectionOffered(section.type))
      .length + 1
  );
}

export function buildPreviewData({
  business,
  heroImageUrl,
  tagline,
  aboutContent,
  useBusinessEmail,
  email,
  useBusinessPhone,
  phone,
  locations,
  faqItems,
  announcementContent,
  brandColorHex,
  fontKey,
  locale,
  reviews,
  teamRatings,
  ratingDistribution,
  tagDictionaries,
}: BuildPreviewDataInput): PreviewData {
  return {
    businessName: business?.name ?? "",
    logo: business?.logo ?? null,
    heroImageUrl,
    tagline,
    aboutContent,
    email: useBusinessEmail ? business?.email ?? "" : email,
    phone: useBusinessPhone ? business?.phone ?? "" : phone,
    social: {
      instagram: business?.instagramUrl,
      facebook: business?.facebookUrl,
      tiktok: business?.tiktokUrl,
      website: business?.websiteUrl,
      pinterest: business?.pinterestUrl,
    },
    locations,
    faq: faqItems,
    announcement: announcementContent,
    brandColor: brandColorHex,
    fontKey,
    locale,
    reviews,
    teamRatings,
    ratingDistribution,
    tagDictionaries,
  };
}

const firstLocaleText = (value: { en?: string; ro?: string } | undefined, locale: "en" | "ro") =>
  value?.[locale]?.trim() || value?.en?.trim() || value?.ro?.trim() || "";

export function buildSectionRowInfo(entry: SectionEntry, context: SectionRowInfoContext): SectionRowInfo {
  const {
    t,
    locale,
    announcementContent,
    announcementError,
    heroImageUrl,
    tagline,
    taglineError,
    aboutContent,
    aboutError,
    locations,
    marqueeItemCount,
    reviews,
    faqItems,
    sectionCatalogByType,
    variantCatalogByKey,
  } = context;

  if (!isKnownSectionType(entry.type)) {
    return {
      summary: t("businessPage.builder.summary.newerVersion"),
      status: { label: t("businessPage.builder.summary.newerVersion"), tone: "muted" },
    };
  }

  const fixed = REQUIRED_TYPES.has(entry.type);
  const sectionLocked = isPaidCatalogEntryLocked(sectionCatalogByType.get(entry.type));
  const variantLocked = isPaidCatalogEntryLocked(
    variantCatalogByKey.get(catalogKey(entry.type, entry.variant)),
  );
  const premiumStatus: SectionRowStatus | undefined =
    entry.visible && (sectionLocked || variantLocked)
      ? { label: t("businessPage.paidVariants.lockedBadge"), tone: "warning" }
      : undefined;
  const hiddenStatus: SectionRowStatus | undefined = !entry.visible
    ? { label: t("businessPage.builder.summary.hidden"), tone: "muted" }
    : undefined;
  const fixedStatus: SectionRowStatus | undefined = fixed
    ? { label: t("businessPage.builder.summary.fixed"), tone: "neutral" }
    : undefined;
  const noDataStatus: SectionRowStatus = {
    label: t("businessPage.builder.summary.noData"),
    tone: "warning",
  };
  const needsContentStatus: SectionRowStatus = {
    label: t("businessPage.builder.summary.needsContent"),
    tone: "danger",
  };

  const withStatus = (
    summary: string,
    status?: SectionRowStatus,
    noData = false,
  ): SectionRowInfo => ({
    summary,
    status: hiddenStatus ?? status ?? premiumStatus ?? fixedStatus,
    noData,
  });

  switch (entry.type) {
    case "announcement": {
      const message = firstLocaleText(announcementContent.message, locale);
      const needsContent = entry.visible && !!announcementError;
      return withStatus(
        message || t("businessPage.builder.summary.noMessage"),
        needsContent ? needsContentStatus : undefined,
        !message,
      );
    }
    case "nav":
      return withStatus(t("businessPage.builder.summary.logoLinksBooking"));
    case "hero": {
      const hasCover = !!heroImageUrl;
      const hasSubtitle = tagline.trim().length > 0;
      // Cinematic + Portal are photo-forward — nudge for a cover when one of them is selected without a photo.
      const wantsCover = entry.variant === "cinematic" || entry.variant === "portal";
      const coverHint: SectionRowStatus | undefined =
        wantsCover && !hasCover
          ? { label: t("businessPage.builder.summary.addCover"), tone: "warning" }
          : undefined;
      return withStatus(
        hasCover
          ? t("businessPage.builder.summary.coverSet")
          : hasSubtitle
            ? t("businessPage.builder.summary.subtitleSet")
            : t("businessPage.builder.summary.addSubtitle"),
        taglineError ? needsContentStatus : coverHint,
      );
    }
    case "marquee":
      if (marqueeItemCount < MARQUEE_MIN_ITEMS) {
        return {
          summary: t("businessPage.builder.summary.servicesProgress", {
            count: marqueeItemCount,
            required: MARQUEE_MIN_ITEMS,
          }),
          noData: marqueeItemCount === 0,
        };
      }
      return withStatus(t("businessPage.builder.summary.services", { count: marqueeItemCount }));
    case "about": {
      const headline = aboutHeadline(aboutContent);
      const needsContent = entry.visible && !!aboutError;
      return withStatus(
        headline || t("businessPage.builder.summary.noHeadline"),
        needsContent ? needsContentStatus : undefined,
        !headline,
      );
    }
    case "locations": {
      const hiddenIds = (entry.config?.hiddenLocationIds as number[] | undefined) ?? [];
      const total = locations.length;
      const visible = locations.filter((location) => !hiddenIds.includes(location.id)).length;
      return withStatus(
        total > 0
          ? t("businessPage.builder.summary.locationsShown", { shown: visible, total })
          : t("businessPage.builder.summary.locationsEmpty"),
        total === 0 || visible === 0 ? noDataStatus : undefined,
        total === 0 || visible === 0,
      );
    }
    case "gallery": {
      const count = resolveGalleryImages((entry.config ?? {}) as GalleryConfig, locations).length;
      const needsContent = entry.visible && count < MIN_GALLERY_IMAGES;
      return withStatus(
        needsContent
          ? t("businessPage.builder.summary.photosProgress", {
              count,
              required: MIN_GALLERY_IMAGES,
            })
          : count > 0
            ? t("businessPage.builder.summary.photos", { count })
            : t("businessPage.builder.summary.photosEmpty"),
        needsContent ? needsContentStatus : count === 0 ? noDataStatus : undefined,
        count === 0,
      );
    }
    case "team": {
      const count = teamMemberCount(locations);
      if (count < MIN_TEAM_MEMBERS) {
        return {
          summary: t("businessPage.builder.summary.membersProgress", {
            count,
            required: MIN_TEAM_MEMBERS,
          }),
          noData: count === 0,
        };
      }
      return withStatus(
        t("businessPage.builder.summary.members", { count }),
      );
    }
    case "testimonials": {
      const count = reviewCount(locations, reviews);
      // Gated shut below the review threshold. Keep the row copy focused on measurable progress;
      // the inspector provides the fuller explanation beside the disabled controls.
      if (count < MIN_TESTIMONIAL_REVIEWS) {
        return {
          summary: t("businessPage.builder.summary.reviewsProgress", {
            count,
            required: MIN_TESTIMONIAL_REVIEWS,
          }),
          noData: true,
        };
      }
      return withStatus(t("businessPage.builder.summary.reviews", { count }));
    }
    case "faq": {
      // A publish-ready FAQ needs a question and answer in the same locale.
      // Blank or half-written draft rows do not count as completed answers.
      const count = completeFaqCount(faqItems);
      const needsContent = entry.visible && count < 1;
      return withStatus(
        needsContent
          ? t("businessPage.builder.summary.questionsProgress", { count, required: 1 })
          : count > 0
          ? t("businessPage.builder.summary.questions", { count })
          : t("businessPage.builder.summary.questionsEmpty"),
        needsContent ? needsContentStatus : count === 0 ? noDataStatus : undefined,
        count === 0,
      );
    }
    case "footer":
      return withStatus(t("businessPage.builder.summary.footerContent"));
    default:
      return withStatus(t("businessPage.builder.summary.generated"));
  }
}
