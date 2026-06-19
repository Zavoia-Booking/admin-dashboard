import {
  Megaphone,
  LayoutTemplate,
  AlignLeft,
  MapPin,
  Images,
  Users,
  Quote,
  HelpCircle,
  Mail,
  Type,
  Film,
  type LucideIcon,
} from "lucide-react";
import type { SectionEntry, SectionType } from "../../../types";

/**
 * Section catalog — the single source of truth for the business-page builder's data layer.
 *
 * The page is a themed *arrangement* over existing business data: each section is a configurable
 * view (order / visibility / variant + small refs in `config`). Only the FAQ and Announcement
 * sections carry their own (net-new) content. This file holds no React — just the metadata the
 * hook + editor + (later) renderer all read from.
 */

/** Schema version stamped on a saved layout (for future upgrade-on-read migrations). */
export const LAYOUT_SCHEMA_VERSION = 1;

/** Default font "personality" when none is saved — the editorial serif the lookbook design ships with. */
export const DEFAULT_FONT_KEY = "elegant";

export interface SectionVariant {
  id: string;
  /** i18n key under marketplace:businessPage.sections.variants.<id> */
  labelKey: string;
}

export interface SectionMeta {
  type: SectionType;
  icon: LucideIcon;
  /** i18n keys under marketplace:businessPage.sections.<type>.{label,description} */
  labelKey: string;
  descriptionKey: string;
  variants: SectionVariant[];
  /** FAQ + Announcement carry their own content; the rest are views over existing data. */
  netNew: boolean;
  /** Small per-section refs/toggles only — never duplicated content. */
  defaultConfig: Record<string, unknown>;
  /** Hidden by default in a fresh layout (e.g. the promotional announcement). */
  defaultHidden?: boolean;
}

const v = (id: string): SectionVariant => ({
  id,
  labelKey: `businessPage.sections.variants.${id}`,
});

export const SECTION_META: Record<SectionType, SectionMeta> = {
  announcement: {
    type: "announcement",
    icon: Megaphone,
    labelKey: "businessPage.sections.announcement.label",
    descriptionKey: "businessPage.sections.announcement.description",
    variants: [v("bar"), v("inline")],
    netNew: true,
    defaultConfig: {},
    defaultHidden: true,
  },
  hero: {
    type: "hero",
    icon: LayoutTemplate,
    labelKey: "businessPage.sections.hero.label",
    descriptionKey: "businessPage.sections.hero.description",
    variants: [v("centered"), v("split"), v("minimal")],
    netNew: false,
    defaultConfig: {},
  },
  marquee: {
    type: "marquee",
    icon: Type,
    labelKey: "businessPage.sections.marquee.label",
    descriptionKey: "businessPage.sections.marquee.description",
    variants: [v("default")],
    netNew: false,
    defaultConfig: {},
    // Decorative band derived from existing data — opt-in so a fresh page isn't busy.
    defaultHidden: true,
  },
  about: {
    type: "about",
    icon: AlignLeft,
    labelKey: "businessPage.sections.about.label",
    descriptionKey: "businessPage.sections.about.description",
    variants: [v("simple"), v("imageLeft")],
    netNew: false,
    defaultConfig: {},
  },
  locations: {
    type: "locations",
    icon: MapPin,
    labelKey: "businessPage.sections.locations.label",
    descriptionKey: "businessPage.sections.locations.description",
    variants: [v("cards"), v("list")],
    netNew: false,
    // Owner picks which locations to hide; empty = show all.
    defaultConfig: { hiddenLocationIds: [] as number[] },
  },
  gallery: {
    type: "gallery",
    icon: Images,
    labelKey: "businessPage.sections.gallery.label",
    descriptionKey: "businessPage.sections.gallery.description",
    variants: [v("grid"), v("carousel")],
    netNew: false,
    defaultConfig: {},
  },
  team: {
    type: "team",
    icon: Users,
    labelKey: "businessPage.sections.team.label",
    descriptionKey: "businessPage.sections.team.description",
    variants: [v("grid"), v("list")],
    netNew: false,
    defaultConfig: {},
  },
  interlude: {
    type: "interlude",
    icon: Film,
    labelKey: "businessPage.sections.interlude.label",
    descriptionKey: "businessPage.sections.interlude.description",
    variants: [v("default")],
    netNew: false,
    defaultConfig: {},
    // Cinematic photo break — opt-in.
    defaultHidden: true,
  },
  testimonials: {
    type: "testimonials",
    icon: Quote,
    labelKey: "businessPage.sections.testimonials.label",
    descriptionKey: "businessPage.sections.testimonials.description",
    variants: [v("cards"), v("quote")],
    netNew: false,
    defaultConfig: {},
  },
  faq: {
    type: "faq",
    icon: HelpCircle,
    labelKey: "businessPage.sections.faq.label",
    descriptionKey: "businessPage.sections.faq.description",
    variants: [v("accordion"), v("list")],
    netNew: true,
    defaultConfig: {},
  },
  contact: {
    type: "contact",
    icon: Mail,
    labelKey: "businessPage.sections.contact.label",
    descriptionKey: "businessPage.sections.contact.description",
    variants: [v("simple"), v("split")],
    netNew: false,
    defaultConfig: {},
  },
};

/** Catalog order used for a fresh default layout. */
export const SECTION_TYPES: SectionType[] = [
  "announcement",
  "hero",
  "marquee",
  "about",
  "locations",
  "gallery",
  "team",
  "interlude",
  "testimonials",
  "faq",
  "contact",
];

const makeEntry = (type: SectionType): SectionEntry => {
  const meta = SECTION_META[type];
  return {
    type,
    variant: meta.variants[0].id,
    visible: !meta.defaultHidden,
    config: { ...meta.defaultConfig },
  };
};

/** A fresh page: every catalog section in default order, announcement hidden. */
export const DEFAULT_LAYOUT: SectionEntry[] = SECTION_TYPES.map(makeEntry);

export function isKnownSectionType(type: string): type is SectionType {
  return Object.prototype.hasOwnProperty.call(SECTION_META, type);
}

/**
 * Build the editor's working layout from a saved one:
 *  - keep saved entries (order / visibility / variant / config) as-is, including any unknown type
 *    (preserved — a render-skip must never delete data);
 *  - append catalog sections missing from the saved layout (default hidden) so newly-added sections
 *    surface without disturbing an existing arrangement.
 * A null/empty saved layout yields the full default layout.
 */
export function buildInitialLayout(saved?: SectionEntry[] | null): SectionEntry[] {
  if (!saved || saved.length === 0) {
    return DEFAULT_LAYOUT.map((s) => ({ ...s, config: { ...s.config } }));
  }
  const present = new Set(saved.map((s) => s.type));
  const appended = SECTION_TYPES.filter((t) => !present.has(t)).map((t) => ({
    ...makeEntry(t),
    visible: false,
  }));
  const normalizedSaved = saved.map((s) => ({
    type: s.type,
    variant: s.variant,
    visible: s.visible,
    config: s.config ? { ...s.config } : {},
  }));
  return [...normalizedSaved, ...appended];
}
