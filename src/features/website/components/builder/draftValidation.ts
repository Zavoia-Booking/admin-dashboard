import type { TFunction } from "i18next";
import type {
  AnnouncementContent,
  FaqItem,
  SectionEntry,
} from "../../types";
import {
  validateUrlField,
  validateWebsiteCopy,
} from "../../../../shared/utils/validation";
import { splitAboutContent } from "./aboutContent";
import {
  ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
  ANNOUNCEMENT_DETAILS_MAX_LENGTH,
  ANNOUNCEMENT_MESSAGE_MAX_LENGTH,
} from "./announcementConstraints";

export type WebsiteDraftIssueLocale = "en" | "ro";
export type WebsiteDraftIssueSurface = "section" | "brand";

/**
 * One actionable draft-save blocker. Unlike the old aggregate strings, this keeps enough identity
 * for the header, section list, inspector, and field itself to all describe and repair the same issue.
 */
export interface WebsiteDraftIssue {
  id: string;
  surface: WebsiteDraftIssueSurface;
  /** Section type, or `brand` for the identity band above the section list. */
  type: string;
  field: string;
  fieldLabel: string;
  message: string;
  controlId: string;
  locale?: WebsiteDraftIssueLocale;
  itemIndex?: number;
}

interface DraftValidationValues {
  tagline: string;
  aboutContent: string;
  establishedYear: number | null;
  brandColorHex: string;
  brandColorKey: string;
  fontKey: string;
  layout: SectionEntry[];
  faqItems: FaqItem[];
  announcementContent: AnnouncementContent;
}

interface CollectWebsiteDraftIssuesInput extends DraftValidationValues {
  baseline: DraftValidationValues;
  t: TFunction;
}

type CopyFieldKey = "heading" | "headline" | "sublede" | "eyebrow" | "description";

const API_ABOUT_CONTENT_MAX_LENGTH = 6000;
const API_CONFIG_COPY_MAX_LENGTH = 400;
const API_FAQ_LOCALE_TEXT_MAX_LENGTH = 2000;

export const isValidAnnouncementDateKey = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

export const isValidAnnouncementTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

interface CopyFieldDefinition {
  key: CopyFieldKey;
  maxLength: number;
  controlId: string;
  labelKey: string;
  applies: (entry: SectionEntry, locale: WebsiteDraftIssueLocale) => boolean;
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const localeFlag = (
  config: Record<string, unknown>,
  key: "headingHidden" | "headlineHidden" | "subledeHidden",
  locale: WebsiteDraftIssueLocale,
): boolean => {
  const flags = isPlainRecord(config[key]) ? config[key] : {};
  return flags[locale] === true;
};

const copyValue = (
  entry: SectionEntry | undefined,
  key: CopyFieldKey,
  locale: WebsiteDraftIssueLocale,
): string => {
  const config = isPlainRecord(entry?.config) ? entry.config : {};
  const copy = isPlainRecord(config[key]) ? config[key] : {};
  return stringValue(copy[locale]);
};

const visible = (entry: SectionEntry): boolean => entry.visible === true;

const COPY_FIELDS_BY_SECTION: Record<string, readonly CopyFieldDefinition[]> = {
  hero: [{
    key: "eyebrow",
    maxLength: 80,
    controlId: "hero-eyebrow",
    labelKey: "businessPage.builder.hero.eyebrowCopyLabel",
    applies: (entry) => visible(entry) && entry.config?.showEyebrow !== false,
  }],
  services: [
    {
      key: "heading",
      maxLength: 80,
      controlId: "services-heading",
      labelKey: "businessPage.builder.settings.headingLabel",
      applies: (entry, locale) => {
        const config = isPlainRecord(entry.config) ? entry.config : {};
        return visible(entry) && !localeFlag(config, "headingHidden", locale);
      },
    },
    {
      key: "sublede",
      maxLength: 220,
      controlId: "services-sublede",
      labelKey: "businessPage.builder.settings.subledeLabel",
      applies: (entry, locale) => {
        const config = isPlainRecord(entry.config) ? entry.config : {};
        return visible(entry) && !localeFlag(config, "subledeHidden", locale);
      },
    },
  ],
  team: [
    {
      key: "heading",
      maxLength: 80,
      controlId: "team-heading",
      labelKey: "businessPage.builder.settings.headingLabel",
      applies: (entry, locale) => {
        const config = isPlainRecord(entry.config) ? entry.config : {};
        return visible(entry) && !localeFlag(config, "headingHidden", locale);
      },
    },
    {
      key: "sublede",
      maxLength: 220,
      controlId: "team-sublede",
      labelKey: "businessPage.builder.settings.subledeLabel",
      applies: (entry, locale) => {
        const config = isPlainRecord(entry.config) ? entry.config : {};
        return visible(entry) && !localeFlag(config, "subledeHidden", locale);
      },
    },
  ],
  gallery: [{
    key: "heading",
    maxLength: 80,
    controlId: "gallery-heading",
    labelKey: "businessPage.builder.settings.headingLabel",
    applies: (entry, locale) => {
      const config = isPlainRecord(entry.config) ? entry.config : {};
      return visible(entry) && !localeFlag(config, "headingHidden", locale);
    },
  }],
  testimonials: [{
    key: "heading",
    maxLength: 80,
    controlId: "reviews-heading",
    labelKey: "businessPage.builder.settings.headingLabel",
    applies: (entry, locale) => {
      const config = isPlainRecord(entry.config) ? entry.config : {};
      return visible(entry) && !localeFlag(config, "headingHidden", locale);
    },
  }],
  faq: [{
    key: "heading",
    maxLength: 80,
    controlId: "faq-heading",
    labelKey: "businessPage.builder.settings.headingLabel",
    applies: (entry, locale) => {
      const config = isPlainRecord(entry.config) ? entry.config : {};
      return visible(entry) && entry.variant !== "index" && !localeFlag(config, "headingHidden", locale);
    },
  }],
  footer: [
    {
      key: "headline",
      maxLength: 80,
      controlId: "footer-headline",
      labelKey: "businessPage.builder.settings.footerHeadlineLabel",
      applies: (entry, locale) => {
        const config = isPlainRecord(entry.config) ? entry.config : {};
        return entry.variant === "editorial" && !localeFlag(config, "headlineHidden", locale);
      },
    },
    {
      key: "description",
      maxLength: 120,
      controlId: "footer-description",
      labelKey: "businessPage.builder.settings.footerDescriptionLabel",
      applies: (entry) => entry.variant === "directory" || entry.variant === "editorial",
    },
  ],
};

const pushCopyIssue = ({
  issues,
  id,
  type,
  field,
  fieldLabel,
  controlId,
  locale,
  value,
  baselineValue,
  maxLength,
  t,
  itemIndex,
  untouchedMaxLength = maxLength,
  untouchedValueLength = value.length,
}: {
  issues: WebsiteDraftIssue[];
  id: string;
  type: string;
  field: string;
  fieldLabel: string;
  controlId: string;
  locale?: WebsiteDraftIssueLocale;
  value: string;
  baselineValue: string;
  maxLength: number;
  t: TFunction;
  itemIndex?: number;
  /** API ceiling for an untouched legacy value; current edits still use the stricter editor maximum. */
  untouchedMaxLength?: number;
  /** Length of the API-normalized legacy value when the backend canonicalizes before storing. */
  untouchedValueLength?: number;
}) => {
  const message = value.length > maxLength
    ? t("common:validation.maxLengthGeneric", { max: maxLength })
    : validateWebsiteCopy(value, t, { fieldLabel, maxLength });
  if (!message) return;
  if (value === baselineValue && untouchedValueLength <= untouchedMaxLength) return;
  issues.push({
    id,
    surface: "section",
    type,
    field,
    fieldLabel,
    message,
    controlId,
    locale,
    itemIndex,
  });
};

/**
 * Collect every current save blocker instead of returning the first one. Untouched server values are
 * allowed to round-trip: the API deliberately accepts older editorial limits, while every newly edited
 * value is held to the current builder policy.
 */
export function collectWebsiteDraftIssues({
  tagline,
  aboutContent,
  establishedYear,
  brandColorHex,
  brandColorKey,
  fontKey,
  layout,
  faqItems,
  announcementContent,
  baseline,
  t,
}: CollectWebsiteDraftIssuesInput): WebsiteDraftIssue[] {
  const issues: WebsiteDraftIssue[] = [];
  const currentByType = new Map(layout.map((entry) => [entry.type, entry]));
  const baselineByType = new Map(baseline.layout.map((entry) => [entry.type, entry]));

  pushCopyIssue({
    issues,
    id: "hero:tagline",
    type: "hero",
    field: "tagline",
    fieldLabel: t("businessPage.branding.tagline.label"),
    controlId: "business-page-tagline",
    value: tagline,
    baselineValue: baseline.tagline,
    maxLength: 200,
    t,
  });

  const aboutEntry = currentByType.get("about");
  const baselineAbout = splitAboutContent(baseline.aboutContent);
  const currentAbout = splitAboutContent(aboutContent);
  if (aboutEntry?.visible) {
    if (aboutEntry.config?.headlineHidden !== true) {
      pushCopyIssue({
        issues,
        id: "about:headline",
        type: "about",
        field: "headline",
        fieldLabel: t("businessPage.about.titleLabel"),
        controlId: "business-page-about-title",
        value: currentAbout.title,
        baselineValue: baselineAbout.title,
        maxLength: 200,
        t,
        untouchedMaxLength: API_ABOUT_CONTENT_MAX_LENGTH,
      });
    }
    pushCopyIssue({
      issues,
      id: "about:story",
      type: "about",
      field: "story",
      fieldLabel: t("businessPage.about.bodyLabel"),
      controlId: "business-page-about-body",
      value: currentAbout.body,
      baselineValue: baselineAbout.body,
      maxLength: 1800,
      t,
      untouchedMaxLength: API_ABOUT_CONTENT_MAX_LENGTH,
    });
  }

  if (aboutContent.length > API_ABOUT_CONTENT_MAX_LENGTH) {
    const headlineIsLarger = currentAbout.title.length > currentAbout.body.length;
    issues.push({
      id: "about:content-size",
      surface: "section",
      type: "about",
      field: headlineIsLarger ? "headline" : "story",
      fieldLabel: t(
        headlineIsLarger
          ? "businessPage.about.titleLabel"
          : "businessPage.about.bodyLabel",
      ),
      message: t("businessPage.about.combinedLengthError", {
        max: API_ABOUT_CONTENT_MAX_LENGTH,
      }),
      controlId: headlineIsLarger
        ? "business-page-about-title"
        : "business-page-about-body",
    });
  }

  if (establishedYear !== null) {
    const minYear = 1000;
    const maxYear = new Date().getUTCFullYear();
    const valid = Number.isInteger(establishedYear) && establishedYear >= minYear && establishedYear <= maxYear;
    if (!valid) {
      issues.push({
        id: "about:established-year",
        surface: "section",
        type: "about",
        field: "establishedYear",
        fieldLabel: t("businessPage.about.establishedYearLabel"),
        message: t("businessPage.about.establishedYearError", { minYear, maxYear }),
        controlId: "business-page-about-established-year",
      });
    }
  }

  const announcementEntry = currentByType.get("announcement");
  const announcementVisible = announcementEntry?.visible === true;
  const announcementCopy = [
    {
      field: "message",
      labelKey: "businessPage.builder.announcement.messageLabel",
      controlId: "announcement-message",
      maxLength: ANNOUNCEMENT_MESSAGE_MAX_LENGTH,
      value: announcementContent.message,
      baselineValue: baseline.announcementContent.message,
    },
    {
      field: "details",
      labelKey: "businessPage.builder.announcement.detailsLabel",
      controlId: "announcement-details",
      maxLength: ANNOUNCEMENT_DETAILS_MAX_LENGTH,
      value: announcementContent.details ?? { en: "", ro: "" },
      baselineValue: baseline.announcementContent.details ?? { en: "", ro: "" },
    },
  ] as const;

  for (const definition of announcementCopy) {
    for (const locale of ["en", "ro"] as const) {
      const value = definition.value[locale] ?? "";
      if (announcementVisible || value.length > definition.maxLength) {
        pushCopyIssue({
          issues,
          id: `announcement:${definition.field}:${locale}`,
          type: "announcement",
          field: definition.field,
          fieldLabel: t(definition.labelKey),
          controlId: definition.controlId,
          locale,
          value,
          baselineValue: definition.baselineValue[locale] ?? "",
          maxLength: definition.maxLength,
          t,
        });
      }
    }
  }

  for (const locale of ["en", "ro"] as const) {
    const value = announcementContent.cta.label[locale];
    if (
      (announcementVisible && announcementContent.cta.enabled) ||
      value.length > ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH
    ) {
      pushCopyIssue({
        issues,
        id: `announcement:cta-label:${locale}`,
        type: "announcement",
        field: "cta-label",
        fieldLabel: t("businessPage.builder.announcement.cta.labelLabel"),
        controlId: "announcement-cta-label",
        locale,
        value,
        baselineValue: baseline.announcementContent.cta.label[locale],
        maxLength: ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
        t,
      });
    }
  }

  const currentUrl = announcementContent.cta.url.trim();
  const baselineUrl = baseline.announcementContent.cta.url.trim();
  const apiUrlMessage = (() => {
    if (!currentUrl) return null;
    if (currentUrl.length > 500) {
      return t("common:validation.maxLengthGeneric", { max: 500 });
    }
    const normalized = /^https?:\/\//i.test(currentUrl) ? currentUrl : `https://${currentUrl}`;
    try {
      const parsed = new URL(normalized);
      return /^https?:$/.test(parsed.protocol) ? null : t("common:validation.url");
    } catch {
      return t("common:validation.url");
    }
  })();
  const editorialUrlMessage = currentUrl ? validateUrlField(currentUrl, t) : null;
  // Existing API-valid URLs may predate the editor's tighter 300-character recommendation.
  // Keep those round-trippable up to the DTO's 500-character hard ceiling; new edits use 300.
  const urlMessage = apiUrlMessage ?? (
    currentUrl === baselineUrl && currentUrl.length <= 500
      ? null
      : editorialUrlMessage
  );
  // A disabled button never renders (see Announcement.tsx's `showCta`), so a stale URL left
  // over from before it was turned off has no effect on the live site — mirrors the label
  // check above, which is already gated on `cta.enabled`.
  if (announcementContent.cta.enabled && urlMessage) {
    issues.push({
      id: "announcement:cta-url",
      surface: "section",
      type: "announcement",
      field: "cta-url",
      fieldLabel: t("businessPage.builder.announcement.cta.urlLabel"),
      message: urlMessage,
      controlId: "announcement-cta-url",
    });
  }

  const schedule = announcementContent.schedule;
  if (schedule) {
    const scheduleMessage = !schedule.start || !schedule.end
      ? t("businessPage.builder.announcement.schedule.requiredError")
      : !isValidAnnouncementDateKey(schedule.start) || !isValidAnnouncementDateKey(schedule.end)
        ? t("businessPage.builder.announcement.schedule.invalidError")
        : schedule.start > schedule.end
          ? t("businessPage.builder.announcement.schedule.orderError")
          : schedule.timezone && !isValidAnnouncementTimeZone(schedule.timezone)
            ? t("businessPage.builder.announcement.schedule.timezoneError")
            : null;
    if (scheduleMessage) {
      issues.push({
        id: "announcement:schedule",
        surface: "section",
        type: "announcement",
        field: "schedule",
        fieldLabel: t("businessPage.builder.announcement.schedule.title"),
        message: scheduleMessage,
        controlId: "announcement-schedule",
      });
    }
  }

  for (const [type, definitions] of Object.entries(COPY_FIELDS_BY_SECTION)) {
    const entry = currentByType.get(type);
    if (!entry) continue;
    const baselineEntry = baselineByType.get(type);
    for (const definition of definitions) {
      for (const locale of ["en", "ro"] as const) {
        const value = copyValue(entry, definition.key, locale);
        const applies = definition.applies(entry, locale);
        const serverMaxLength = type === "hero" || type === "footer"
          ? definition.maxLength
          : API_CONFIG_COPY_MAX_LENGTH;
        if (!applies && value.length <= serverMaxLength) continue;
        pushCopyIssue({
          issues,
          id: `${type}:${definition.key}:${locale}`,
          type,
          field: definition.key,
          fieldLabel: t(definition.labelKey),
          controlId: definition.controlId,
          locale,
          value,
          baselineValue: copyValue(baselineEntry, definition.key, locale),
          maxLength: definition.maxLength,
          t,
          untouchedMaxLength: serverMaxLength,
          untouchedValueLength: type === "hero" ? value.trim().length : value.length,
        });
      }
    }
  }

  const faqVisible = currentByType.get("faq")?.visible === true;
  if (faqVisible || faqItems.some((item) =>
    ([item.q.en, item.q.ro, item.a.en, item.a.ro] as string[])
      .some((value) => value.length > API_FAQ_LOCALE_TEXT_MAX_LENGTH)
  )) {
    for (let itemIndex = 0; itemIndex < faqItems.length; itemIndex += 1) {
      const item = faqItems[itemIndex];
      const baselineItem = baseline.faqItems[itemIndex];
      for (const locale of ["en", "ro"] as const) {
        const questionValue = item.q[locale] ?? "";
        const answerValue = item.a[locale] ?? "";
        if (!faqVisible && questionValue.length <= API_FAQ_LOCALE_TEXT_MAX_LENGTH &&
          answerValue.length <= API_FAQ_LOCALE_TEXT_MAX_LENGTH) continue;
        pushCopyIssue({
          issues,
          id: `faq:question:${itemIndex}:${locale}`,
          type: "faq",
          field: "question",
          fieldLabel: t("businessPage.builder.faq.questionLabel", { number: itemIndex + 1 }),
          controlId: `faq-question-${itemIndex}`,
          locale,
          itemIndex,
          value: questionValue,
          baselineValue: baselineItem?.q[locale] ?? "",
          maxLength: 160,
          t,
          untouchedMaxLength: API_FAQ_LOCALE_TEXT_MAX_LENGTH,
        });
        pushCopyIssue({
          issues,
          id: `faq:answer:${itemIndex}:${locale}`,
          type: "faq",
          field: "answer",
          fieldLabel: t("businessPage.builder.faq.answerLabel"),
          controlId: `faq-answer-${itemIndex}`,
          locale,
          itemIndex,
          value: answerValue,
          baselineValue: baselineItem?.a[locale] ?? "",
          maxLength: 600,
          t,
          untouchedMaxLength: API_FAQ_LOCALE_TEXT_MAX_LENGTH,
        });
      }
    }
  }

  if (brandColorHex && !/^#[0-9a-fA-F]{6}$/.test(brandColorHex)) {
    issues.push({
      id: "brand:color",
      surface: "brand",
      type: "brand",
      field: "brandColor",
      fieldLabel: t("businessPage.theme.accentColor"),
      message: t("businessPage.errors.brandColorInvalid"),
      controlId: "brand-color-control",
    });
  }

  if (brandColorKey.trim().length > 64) {
    issues.push({
      id: "brand:color-key",
      surface: "brand",
      type: "brand",
      field: "brandColorKey",
      fieldLabel: t("businessPage.theme.accentColor"),
      message: t("common:validation.maxLengthGeneric", { max: 64 }),
      controlId: "brand-color-control",
    });
  }

  if (fontKey.trim().length > 32) {
    issues.push({
      id: "brand:font-key",
      surface: "brand",
      type: "brand",
      field: "fontKey",
      fieldLabel: t("businessPage.theme.fontLabel"),
      message: t("common:validation.maxLengthGeneric", { max: 32 }),
      controlId: "font-control",
    });
  }

  return issues;
}
