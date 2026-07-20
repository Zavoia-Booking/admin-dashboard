import type { ResolvedTagDictionaries } from "../../../marketplace/hooks/useLocationTagDictionaries";
import type {
  AnnouncementContent,
  Business,
  FaqItem,
  FooterConfig,
  GalleryConfig,
  LocationsConfig,
  WebsiteBuilderLocation,
  SectionEntry,
  WebsiteSectionCatalogEntry,
  WebsiteVariantCatalogEntry,
} from "../../types";
import { aboutHeadline, splitAboutContent } from "./aboutContent";
import { MIN_GALLERY_IMAGES, resolveGalleryImages } from "./gallerySelection";
import { completeFaqCount, hasIncompleteFaqPair } from "./sectionReadiness";
import {
  MIN_TEAM_MEMBERS,
  MIN_TESTIMONIAL_REVIEWS,
  TEAM_FLAT_MAX,
  TEAM_LOCATION_MAX,
  reviewCount,
  teamMemberCount,
} from "./sectionDataRequirements";
import { footerDefaultHeadlineCopy } from "./footerHeadline";
import { heroVariantRequiresCoverImage } from "./heroCoverRequirement";
import { isKnownSectionType, PINNED_TYPES, REQUIRED_TYPES, SECTION_META } from "./sectionCatalog";
import { resolveVisibleLocations } from "./locationSelection";
import { UNNUMBERED } from "./preview/shared/constants";
import { MARQUEE_MIN_ITEMS } from "./preview/sections/marquee/model";
import type { PreviewData, PreviewReview, RatingBars } from "./preview/shared/types";
import { aggregateReviews } from "./preview/shared/util";
import { isWebsiteSectionLinkType } from "./preview/shared/sectionLinks";

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
  layout: readonly SectionEntry[];
  business: Business | null;
  selectedLocationId?: number | null;
  announcementContent: AnnouncementContent;
  announcementError?: string | null;
  heroImageUrl: string | null;
  tagline: string;
  taglineError?: string;
  aboutContent: string;
  aboutError?: string | null;
  locations: WebsiteBuilderLocation[];
  /** Exact location set Services renders after applying the website-wide Locations selection. */
  serviceLocations: WebsiteBuilderLocation[];
  marqueeItemCount: number;
  reviews?: PreviewReview[];
  faqItems: FaqItem[];
  sectionCatalogByType: SectionCatalogByType;
  variantCatalogByKey: VariantCatalogByKey;
}

/** Distinct menu entities across locations; the same service assigned twice still appears once in the row summary. */
export function serviceMenuCounts(
  locations: WebsiteBuilderLocation[],
  includeBundles = true,
): { services: number; bundles: number; locations: number; items: number } {
  const serviceIds = new Set<number>();
  const bundleIds = new Set<number>();
  for (const location of locations) {
    for (const service of location.services ?? []) serviceIds.add(service.id);
    if (includeBundles) {
      for (const bundle of location.bundles ?? []) bundleIds.add(bundle.id);
    }
  }
  return {
    services: serviceIds.size,
    bundles: bundleIds.size,
    locations: locations.length,
    items: serviceIds.size + bundleIds.size,
  };
}

export function serviceMenuSummary(
  t: SectionBuilderT,
  counts: ReturnType<typeof serviceMenuCounts>,
  includeBundles = true,
): string {
  const parts: string[] = [];
  if (counts.services > 0) {
    parts.push(t("businessPage.builder.summary.services", { count: counts.services }));
  }
  if (includeBundles && counts.bundles > 0) {
    parts.push(t("businessPage.builder.summary.bundles", { count: counts.bundles }));
  }
  if (counts.locations > 0) {
    parts.push(t("businessPage.builder.summary.serviceLocations", { count: counts.locations }));
  }
  return parts.join(" · ");
}

/** Prefix the content snapshot with the style currently rendered, including preview-only styles. */
export function sectionSummaryWithVariant(
  entry: SectionEntry,
  summary: string,
  t: SectionBuilderT,
): string {
  if (!isKnownSectionType(entry.type)) return summary;
  const variant = SECTION_META[entry.type].variants.find((item) => item.id === entry.variant);
  return variant ? `${t(variant.labelKey)} · ${summary}` : summary;
}

export interface BuildPreviewDataInput {
  business: Business | null;
  heroImageUrl: string | null;
  tagline: string;
  aboutContent: string;
  establishedYear: number | null;
  useBusinessEmail: boolean;
  email: string;
  useBusinessPhone: boolean;
  phone: string;
  locations: WebsiteBuilderLocation[];
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

/**
 * Keep only selections that are still paid and unowned. A caller-designated paid-only section may
 * preview the same variant key already stored in its dormant layout entry: in that case the
 * temporary selection represents preview-only visibility, not a persisted style change.
 */
export function derivePreviewOnlyVariants(
  selectedByType: Readonly<Record<string, string>>,
  layout: readonly SectionEntry[],
  variantCatalogByKey: VariantCatalogByKey,
  previewVisibleSectionTypes: ReadonlySet<string> = new Set(),
): Record<string, string> {
  const previewOnlyByType: Record<string, string> = {};

  for (const [type, variantKey] of Object.entries(selectedByType)) {
    const saved = layout.find((section) => section.type === type);
    const catalogEntry = variantCatalogByKey.get(catalogKey(type, variantKey));
    const stillPreviewOnly =
      !!saved &&
      (
        saved.variant !== variantKey ||
        (!saved.visible && previewVisibleSectionTypes.has(type))
      ) &&
      isPaidCatalogEntryLocked(catalogEntry);

    if (stillPreviewOnly) previewOnlyByType[type] = variantKey;
  }

  return previewOnlyByType;
}

/** Overlay locked choices and caller-designated temporary visibility without mutating the draft. */
export function overlayPreviewVariants(
  layout: readonly SectionEntry[],
  previewVariantByType: Readonly<Record<string, string>>,
  previewVisibleSectionTypes: ReadonlySet<string> = new Set(),
): SectionEntry[] {
  return layout.map((section) => {
    const previewVariant = previewVariantByType[section.type];
    return previewVariant
      ? {
          ...section,
          variant: previewVariant,
          visible: section.visible || previewVisibleSectionTypes.has(section.type),
        }
      : section;
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
  establishedYear,
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
    businessTimezone: business?.timezone?.trim() || "UTC",
    logo: business?.logo ?? null,
    heroImageUrl,
    tagline,
    aboutContent,
    establishedYear,
    businessCurrency: business?.businessCurrency?.trim().toUpperCase() || "EUR",
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

const compactSummaryText = (value: string): string => value.replace(/\s+/g, " ").trim();

const FOOTER_LINK_VARIANTS = new Set(["directory", "signature", "masthead", "marque"]);
const FOOTER_LOCATION_LIST_VARIANTS = new Set(["directory", "editorial", "signature", "masthead"]);

const firstLocaleText = (value: { en?: string; ro?: string } | undefined, locale: "en" | "ro") =>
  compactSummaryText(value?.[locale] || value?.en || value?.ro || "");

export function buildSectionRowInfo(entry: SectionEntry, context: SectionRowInfoContext): SectionRowInfo {
  const {
    t,
    locale,
    layout,
    business,
    selectedLocationId,
    announcementContent,
    announcementError,
    heroImageUrl,
    tagline,
    taglineError,
    aboutContent,
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
      return withStatus(t("businessPage.builder.summary.pageLinks", {
        count: layout.filter((section) => section.visible && isWebsiteSectionLinkType(section.type)).length,
      }));
    case "hero": {
      const hasCover = !!heroImageUrl;
      const subtitle = compactSummaryText(tagline);
      const wantsCover = heroVariantRequiresCoverImage(entry.variant);
      const coverHint: SectionRowStatus | undefined =
        wantsCover && !hasCover
          ? { label: t("businessPage.builder.summary.addCover"), tone: "warning" }
          : undefined;
      return withStatus(
        subtitle || compactSummaryText(business?.name ?? "") || t("businessPage.builder.summary.heroEssentials"),
        taglineError ? needsContentStatus : coverHint,
      );
    }
    case "marquee":
      if (marqueeItemCount < MARQUEE_MIN_ITEMS) {
        return withStatus(
          t("businessPage.builder.summary.stripNamesProgress", {
            count: marqueeItemCount,
            required: MARQUEE_MIN_ITEMS,
          }),
          marqueeItemCount === 0 ? noDataStatus : undefined,
          marqueeItemCount === 0,
        );
      }
      return withStatus(t("businessPage.builder.summary.stripNames", { count: marqueeItemCount }));
    case "about": {
      const headline = aboutHeadline(aboutContent);
      const headlineMissing = entry.visible && entry.config?.headlineHidden === true;
      const storyMissing = entry.visible && !splitAboutContent(aboutContent).body.trim();
      return withStatus(
        headlineMissing
          ? t("businessPage.builder.summary.noHeadline")
          : headline || t("businessPage.builder.preview.aboutGhostLede"),
        headlineMissing || storyMissing ? needsContentStatus : undefined,
      );
    }
    case "services": {
      const includeBundles = entry.config?.hideBundles !== true;
      const counts = serviceMenuCounts(context.serviceLocations, includeBundles);
      return withStatus(
        counts.items > 0
          ? serviceMenuSummary(t, counts, includeBundles)
          : t("businessPage.builder.summary.servicesEmpty"),
        counts.items === 0 ? noDataStatus : undefined,
        counts.items === 0,
      );
    }
    case "locations": {
      const total = locations.length;
      const visible = resolveVisibleLocations(
        (entry.config ?? {}) as LocationsConfig,
        locations,
      ).length;
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
        return withStatus(
          t("businessPage.builder.summary.membersProgress", {
            count,
            required: MIN_TEAM_MEMBERS,
          }),
          count === 0 ? noDataStatus : undefined,
          count === 0,
        );
      }
      if (entry.variant === "columns") {
        const locationCounts = locations
          .map((location) => Math.min(location.teamMembers?.length ?? 0, TEAM_LOCATION_MAX))
          .filter((locationCount) => locationCount > 0);
        return withStatus([
          t("businessPage.builder.summary.membersPerLocation", {
            count: Math.max(...locationCounts),
          }),
          t("businessPage.builder.summary.serviceLocations", {
            count: locationCounts.length,
          }),
        ].join(" · "));
      }
      return withStatus(
        t("businessPage.builder.summary.membersShown", {
          count: Math.min(count, TEAM_FLAT_MAX),
        }),
      );
    }
    case "testimonials": {
      const count = reviewCount(locations, reviews);
      // Gated shut below the review threshold. Keep the row copy focused on measurable progress;
      // the inspector provides the fuller explanation beside the disabled controls.
      if (count < MIN_TESTIMONIAL_REVIEWS) {
        return withStatus(
          t("businessPage.builder.summary.reviewsProgress", {
            count,
            required: MIN_TESTIMONIAL_REVIEWS,
          }),
          count === 0 ? noDataStatus : undefined,
          count === 0,
        );
      }
      const aggregate = aggregateReviews(locations);
      const quoteCount = (reviews ?? []).filter((review) => review.comment.trim().length > 0).length;
      const parts = aggregate.rating > 0
        ? [
            t("businessPage.builder.summary.reviewAverage", {
              rating: new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(aggregate.rating),
            }),
            t("businessPage.builder.summary.reviews", { count: aggregate.count }),
          ]
        : quoteCount > 0
          ? [t("businessPage.builder.summary.customerQuotes", { count: quoteCount })]
          : [t("businessPage.builder.summary.reviews", { count: aggregate.count })];
      return withStatus(parts.join(" · "));
    }
    case "faq": {
      // A publish-ready FAQ needs a question and answer in the same locale.
      // Blank or half-written draft rows do not count as completed answers.
      const count = completeFaqCount(faqItems);
      const unfinished = faqItems.filter(hasIncompleteFaqPair).length;
      const started = faqItems.some((item) =>
        [item.q.en, item.q.ro, item.a.en, item.a.ro].some((value) => value.trim().length > 0),
      );
      const needsContent = entry.visible && (count < 1 || unfinished > 0);
      const parts = started
        ? [
            t("businessPage.builder.summary.questionsComplete", { count }),
            ...(unfinished > 0
              ? [t("businessPage.builder.summary.questionsUnfinished", { count: unfinished })]
              : []),
          ]
        : [];
      return withStatus(
        parts.length > 0 ? parts.join(" · ") : t("businessPage.builder.summary.questionsEmpty"),
        needsContent ? needsContentStatus : count === 0 ? noDataStatus : undefined,
        count === 0,
      );
    }
    case "footer": {
      const linkCount = layout.filter(
        (section) => section.visible && isWebsiteSectionLinkType(section.type),
      ).length;
      const socialCount = [
        business?.instagramUrl,
        business?.tiktokUrl,
        business?.facebookUrl,
        business?.pinterestUrl,
      ].filter((value) => !!value?.trim()).length;
      const parts = [
        ...(FOOTER_LINK_VARIANTS.has(entry.variant)
          ? [t("businessPage.builder.summary.pageLinks", { count: linkCount })]
          : []),
        ...(FOOTER_LOCATION_LIST_VARIANTS.has(entry.variant) && locations.length > 0
          ? [t("businessPage.builder.summary.serviceLocations", { count: locations.length })]
          : []),
        ...(socialCount > 0
          ? [t("businessPage.builder.summary.socialLinks", { count: socialCount })]
          : []),
      ];
      const config = (entry.config ?? {}) as FooterConfig;
      const headline = compactSummaryText(config.headline?.[locale] ?? "");
      const description = compactSummaryText(config.description?.[locale] ?? "");
      const defaultHeadline = footerDefaultHeadlineCopy(locations, selectedLocationId);
      const visitorCopy = entry.variant === "editorial"
        ? (
            config.headlineHidden?.[locale] === true
              ? ""
              : headline || t(defaultHeadline.key, defaultHeadline.options)
          ) || description
        : entry.variant === "directory"
          ? description
          : "";
      return withStatus(visitorCopy || parts.join(" · ") || t("businessPage.builder.summary.footerEssentials"));
    }
    default:
      return withStatus(t("businessPage.builder.summary.generated"));
  }
}
