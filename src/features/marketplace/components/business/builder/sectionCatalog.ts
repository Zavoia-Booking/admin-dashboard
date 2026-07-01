import {
  Megaphone,
  LayoutTemplate,
  AlignLeft,
  MapPin,
  Images,
  Users,
  Quote,
  HelpCircle,
  Type,
  Film,
  PanelTop,
  PanelBottom,
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
  // Seam for future paid variants/skins: a `paid?: boolean` / `sku?: string` field belongs here (catalog is the single source).
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
    // Always a sticky ribbon pinned above the nav — no layout choice, no reordering (see PINNED_TYPES).
    icon: Megaphone,
    labelKey: "businessPage.sections.announcement.label",
    descriptionKey: "businessPage.sections.announcement.description",
    variants: [v("bar")],
    netNew: true,
    defaultConfig: {},
    defaultHidden: true,
  },
  nav: {
    type: "nav",
    // Sticky brand + section links + CTA, pinned right below the announcement — not reorderable (PINNED_TYPES).
    icon: PanelTop,
    labelKey: "businessPage.sections.nav.label",
    descriptionKey: "businessPage.sections.nav.description",
    variants: [v("default")],
    netNew: false,
    defaultConfig: {},
  },
  hero: {
    type: "hero",
    icon: LayoutTemplate,
    labelKey: "businessPage.sections.hero.label",
    descriptionKey: "businessPage.sections.hero.description",
    // Single section, no layout pills: with a cover photo the hero shows it (full-bleed, or the "cover
    // plate" toggle in the editor); with no cover it floods with the brand accent (the drenched field).
    // The cover/plate choice rides in config.coverLayout — only surfaced once a cover exists.
    variants: [v("default")],
    netNew: false,
    defaultConfig: {},
  },
  marquee: {
    type: "marquee",
    icon: Type,
    labelKey: "businessPage.sections.marquee.label",
    descriptionKey: "businessPage.sections.marquee.description",
    // Motion mode: "scroll" glides the band with page scroll (default — the editorial source's behaviour);
    // "loop" runs an always-on auto drift. First entry is the default for a fresh layout.
    variants: [v("scroll"), v("loop")],
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
    // Single editorial layout — About has no image of its own, so there's no layout choice to make.
    variants: [v("simple")],
    netNew: false,
    defaultConfig: {},
  },
  locations: {
    type: "locations",
    icon: MapPin,
    labelKey: "businessPage.sections.locations.label",
    descriptionKey: "businessPage.sections.locations.description",
    // Single editorial "switcher": a numbered index of places + a featured stage that re-scopes to the
    // selected one (one location drops the index and shows the stage full-width). No layout choice to make.
    variants: [v("switcher")],
    netNew: false,
    // Owner picks which locations to hide; empty = show all.
    defaultConfig: { hiddenLocationIds: [] as number[] },
  },
  gallery: {
    type: "gallery",
    icon: Images,
    labelKey: "businessPage.sections.gallery.label",
    descriptionKey: "businessPage.sections.gallery.description",
    // Four layouts from the source: editorial essay (default), bento, masonry, and a centre-weighted
    // drag carousel. Legacy "grid" saves migrate to "editorial" on read.
    variants: [v("editorial"), v("bento"), v("masonry"), v("carousel")],
    netNew: false,
    defaultConfig: {},
  },
  team: {
    type: "team",
    icon: Users,
    labelKey: "businessPage.sections.team.label",
    descriptionKey: "businessPage.sections.team.description",
    // "portraits" = tall photo cards with a location pin + hover "find at" CTA (default, the source's
    // lookbook grid); "roster" = a numbered editorial list. Legacy grid/list saves migrate on read.
    variants: [v("portraits"), v("roster")],
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
    // Single editorial layout (mirrors the source): rating summary + per-star distribution + an
    // auto-playing quote showcase. Legacy cards/quote saves collapse on read.
    labelKey: "businessPage.sections.testimonials.label",
    descriptionKey: "businessPage.sections.testimonials.description",
    variants: [v("default")],
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
  footer: {
    type: "footer",
    // Editorial closing panel — brand, locations, contact, wordmark. Pinned last, not reorderable (PINNED_TYPES).
    icon: PanelBottom,
    labelKey: "businessPage.sections.footer.label",
    descriptionKey: "businessPage.sections.footer.description",
    variants: [v("default")],
    netNew: false,
    defaultConfig: {},
  },
};

/** Sections locked into fixed positions: non-reorderable (the drag grip becomes a pin). The announcement
 *  is the sticky ribbon (always first); the hero always sits second. The builder disables their drag and
 *  `buildInitialLayout` enforces their order on read. */
export const PINNED_TYPES: ReadonlySet<string> = new Set<SectionType>(["announcement", "nav", "hero", "footer"]);

/** Sections that are always shown — their visibility can't be toggled off (every page needs a header, a
 *  hero, and a footer). A subset of PINNED_TYPES; the announcement is pinned but stays optional. */
export const REQUIRED_TYPES: ReadonlySet<string> = new Set<SectionType>(["nav", "hero", "footer"]);

/** Catalog order used for a fresh default layout. */
export const SECTION_TYPES: SectionType[] = [
  "announcement",
  "nav",
  "hero",
  "marquee",
  "about",
  "locations",
  "gallery",
  "team",
  "interlude",
  "testimonials",
  "faq",
  "footer",
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
  // Drop malformed entries — e.g. a corrupted save that stored `[]` per section instead of an object.
  // Keep only real objects with a non-empty string `type`; unknown-but-valid string types are preserved
  // (forward-compat / render-skip). All-malformed (or empty/null) falls back to the default layout.
  const raw: unknown[] = Array.isArray(saved) ? (saved as unknown[]) : [];
  const valid = raw.filter(
    (s): s is SectionEntry =>
      !!s &&
      typeof s === "object" &&
      !Array.isArray(s) &&
      typeof (s as { type?: unknown }).type === "string" &&
      (s as { type: string }).type.length > 0 &&
      // The standalone Contact ("Visit") section was removed — its content now lives in the footer. Drop any
      // saved contact entries (a deliberate deprecation, unlike the forward-compat preservation of unknown types).
      (s as { type: string }).type !== "contact",
  );
  if (valid.length === 0) {
    return DEFAULT_LAYOUT.map((s) => ({ ...s, config: { ...s.config } }));
  }
  const present = new Set(valid.map((s) => s.type));
  const appended = SECTION_TYPES.filter((t) => !present.has(t)).map((t) => ({
    ...makeEntry(t),
    // Newly-added catalog sections default hidden so they don't disturb an existing page — except the
    // always-shown chrome (nav/hero/footer), which must stay visible so existing pages don't lose them.
    visible: REQUIRED_TYPES.has(t),
  }));
  const normalizedSaved = valid.map((s) => ({
    type: s.type,
    variant: s.variant,
    // The header, hero, and footer are always shown — force them visible even if a legacy save hid one.
    visible: REQUIRED_TYPES.has(s.type) ? true : s.visible,
    config: s.config ? { ...s.config } : {},
  }));
  const result = [...normalizedSaved, ...appended];
  // Announcement is pinned to the top of the page and is always the "bar" ribbon — enforce both on read
  // so a legacy save (different order / "inline" variant) opens in the locked arrangement.
  const ai = result.findIndex((s) => s.type === "announcement");
  if (ai !== -1) {
    const [a] = result.splice(ai, 1);
    result.unshift({ ...a, variant: "bar" });
  }
  // Hero is pinned second (right after the announcement) and not reorderable — enforce its position on
  // read. The hero is now single-variant; a legacy "split" save carries its layout intent into the new
  // config.coverLayout ("plate"), and any other variant collapses to the single "default".
  const hi = result.findIndex((s) => s.type === "hero");
  if (hi !== -1) {
    const [h] = result.splice(hi, 1);
    const config =
      h.variant === "split" && !(h.config as { coverLayout?: string } | undefined)?.coverLayout
        ? { ...h.config, coverLayout: "plate" }
        : h.config;
    const heroIndex = result[0]?.type === "announcement" ? 1 : 0;
    result.splice(heroIndex, 0, { ...h, variant: SECTION_META.hero.variants[0].id, config });
  }
  // Nav is pinned right after the announcement (above the hero) and not reorderable — enforce its slot on read.
  const ni = result.findIndex((s) => s.type === "nav");
  if (ni !== -1) {
    const [nav] = result.splice(ni, 1);
    const navIndex = result[0]?.type === "announcement" ? 1 : 0;
    result.splice(navIndex, 0, nav);
  }
  // Footer is pinned to the very end and not reorderable — enforce its slot on read.
  const fi = result.findIndex((s) => s.type === "footer");
  if (fi !== -1) {
    const [footer] = result.splice(fi, 1);
    result.push(footer);
  }
  // Marquee gained a motion choice (scroll-driven default vs auto-loop); a legacy single-variant save
  // ("default") opens on the new default so its pill reads as selected.
  const mi = result.findIndex((s) => s.type === "marquee");
  if (mi !== -1 && !SECTION_META.marquee.variants.some((variant) => variant.id === result[mi].variant)) {
    result[mi] = { ...result[mi], variant: SECTION_META.marquee.variants[0].id };
  }
  // Locations collapsed from cards/list to the single "switcher" layout — a legacy variant opens on it.
  const li = result.findIndex((s) => s.type === "locations");
  if (li !== -1 && !SECTION_META.locations.variants.some((variant) => variant.id === result[li].variant)) {
    result[li] = { ...result[li], variant: SECTION_META.locations.variants[0].id };
  }
  // Team renamed its layout choice (grid/list → portraits/roster); gallery expanded to four named layouts
  // (legacy "grid" was the editorial essay). Map legacy ids, then collapse anything still unrecognised to
  // the section's default variant so its pill reads as selected.
  const LEGACY_VARIANTS: Partial<Record<SectionType, Record<string, string>>> = {
    team: { grid: "portraits", list: "roster" },
    gallery: { grid: "editorial" },
    testimonials: {}, // cards/quote collapsed to the single "default" layout
  };
  for (const [type, remap] of Object.entries(LEGACY_VARIANTS)) {
    const idx = result.findIndex((s) => s.type === type);
    if (idx === -1) continue;
    const meta = SECTION_META[type as SectionType];
    let variant = remap[result[idx].variant] ?? result[idx].variant;
    if (!meta.variants.some((vr) => vr.id === variant)) variant = meta.variants[0].id;
    if (variant !== result[idx].variant) result[idx] = { ...result[idx], variant };
  }
  return result;
}
