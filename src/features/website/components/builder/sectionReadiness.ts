import type {
  AnnouncementContent,
  FaqItem,
  GalleryConfig,
  LocationWithAssignments,
  PageLayout,
} from "../../types";
import { aboutHeadline } from "./aboutContent";
import { MIN_GALLERY_IMAGES, resolveGalleryImages } from "./gallerySelection";
import { MARQUEE_MIN_ITEMS, marqueeItems } from "./preview/sections/marquee/model";
import {
  MIN_TEAM_MEMBERS,
  MIN_TESTIMONIAL_REVIEWS,
  reviewCount,
  teamMemberCount,
} from "./sectionDataRequirements";

export type WebsiteReadinessSectionType =
  | "announcement"
  | "about"
  | "marquee"
  | "gallery"
  | "team"
  | "testimonials"
  | "faq";

export interface WebsiteReadinessIssue {
  type: WebsiteReadinessSectionType;
  current?: number;
  required?: number;
  /** The exact editor control that needs attention when a section has more than one requirement. */
  field?: "message" | "cta-url" | "question" | "answer";
  /** FAQ content is bilingual; retain the locale so Review never opens the wrong field. */
  locale?: "en" | "ro";
  itemIndex?: number;
}

export interface FaqReadinessTarget {
  field: "question" | "answer";
  locale: "en" | "ro";
  itemIndex: number;
}

export interface WebsiteReadinessInput {
  layout: PageLayout;
  aboutContent: string | null | undefined;
  announcementContent: AnnouncementContent | null | undefined;
  faqItems: FaqItem[] | null | undefined;
  locations: LocationWithAssignments[];
  /** Prefer the language the owner is currently editing when more than one FAQ pair is incomplete. */
  locale?: "en" | "ro";
  /** Optional loaded review rows keep the editor gate aligned when denormalized totals lag behind. */
  reviews?: ReadonlyArray<unknown>;
}

const hasText = (value: string | null | undefined) => Boolean(value?.trim());

/** A FAQ entry counts only when one locale contains both a question and its answer. */
export function isFaqItemComplete(item: FaqItem): boolean {
  return (
    (hasText(item.q.en) && hasText(item.a.en)) ||
    (hasText(item.q.ro) && hasText(item.a.ro))
  );
}

/** A started locale must contain both halves; untouched locales and rows remain valid drafts. */
export function hasIncompleteFaqPair(item: FaqItem): boolean {
  return (["en", "ro"] as const).some((locale) => {
    const hasQuestion = hasText(item.q[locale]);
    const hasAnswer = hasText(item.a[locale]);
    return hasQuestion !== hasAnswer;
  });
}

/** Resolve the actual missing half, preferring the language currently shown in the editor. */
export function findIncompleteFaqTarget(
  items: FaqItem[] | null | undefined,
  preferredLocale: "en" | "ro" = "en",
): FaqReadinessTarget | null {
  const locales = [preferredLocale, preferredLocale === "en" ? "ro" : "en"] as const;

  for (const locale of locales) {
    for (let itemIndex = 0; itemIndex < (items ?? []).length; itemIndex += 1) {
      const item = items?.[itemIndex];
      if (!item) continue;
      const hasQuestion = hasText(item.q[locale]);
      const hasAnswer = hasText(item.a[locale]);
      if (hasAnswer && !hasQuestion) return { field: "question", locale, itemIndex };
      if (hasQuestion && !hasAnswer) return { field: "answer", locale, itemIndex };
    }
  }

  return null;
}

export function completeFaqCount(items: FaqItem[] | null | undefined): number {
  return (items ?? []).filter(isFaqItemComplete).length;
}

/**
 * Publish-readiness requirements for visible, owner-authored sections.
 *
 * These are intentionally separate from field validation: an incomplete visible section may still be
 * saved as a draft, but it must be completed or hidden before publishing.
 */
export function getWebsiteReadinessIssues({
  layout,
  aboutContent,
  announcementContent,
  faqItems,
  locations,
  reviews,
  locale = "en",
}: WebsiteReadinessInput): WebsiteReadinessIssue[] {
  const issues: WebsiteReadinessIssue[] = [];
  const seen = new Set<WebsiteReadinessSectionType>();

  for (const entry of layout) {
    if (!entry.visible || seen.has(entry.type as WebsiteReadinessSectionType)) continue;

    switch (entry.type) {
      case "about":
        if (!aboutHeadline(aboutContent ?? "")) {
          issues.push({ type: "about" });
          seen.add("about");
        }
        break;

      case "announcement":
        if (
          !hasText(announcementContent?.message.en) &&
          !hasText(announcementContent?.message.ro)
        ) {
          issues.push({ type: "announcement", field: "message" });
          seen.add("announcement");
        } else {
          const cta = announcementContent?.cta;
          const hasButtonLabel = hasText(cta?.label.en) || hasText(cta?.label.ro);
          if (cta?.enabled && hasButtonLabel && !hasText(cta.url)) {
            issues.push({ type: "announcement", field: "cta-url" });
            seen.add("announcement");
          }
        }
        break;

      case "marquee": {
        const current = marqueeItems(locations).length;
        if (current < MARQUEE_MIN_ITEMS) {
          issues.push({ type: "marquee", current, required: MARQUEE_MIN_ITEMS });
          seen.add("marquee");
        }
        break;
      }

      case "faq": {
        const current = completeFaqCount(faqItems);
        const incompleteTarget = findIncompleteFaqTarget(faqItems, locale);
        if (current < 1) {
          issues.push({
            type: "faq",
            current,
            required: 1,
            ...(incompleteTarget ?? {}),
          });
          seen.add("faq");
        } else if (incompleteTarget) {
          issues.push({ type: "faq", ...incompleteTarget });
          seen.add("faq");
        }
        break;
      }

      case "gallery": {
        const current = resolveGalleryImages((entry.config ?? {}) as GalleryConfig, locations).length;
        if (current < MIN_GALLERY_IMAGES) {
          issues.push({ type: "gallery", current, required: MIN_GALLERY_IMAGES });
          seen.add("gallery");
        }
        break;
      }

      case "team": {
        const current = teamMemberCount(locations);
        if (current < MIN_TEAM_MEMBERS) {
          issues.push({ type: "team", current, required: MIN_TEAM_MEMBERS });
          seen.add("team");
        }
        break;
      }

      case "testimonials": {
        const current = reviewCount(locations, reviews);
        if (current < MIN_TESTIMONIAL_REVIEWS) {
          issues.push({
            type: "testimonials",
            current,
            required: MIN_TESTIMONIAL_REVIEWS,
          });
          seen.add("testimonials");
        }
        break;
      }

      default:
        break;
    }
  }

  return issues;
}
