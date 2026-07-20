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
  Rows3,
  PanelTop,
  PanelBottom,
  type LucideIcon,
} from "lucide-react";
import type { SectionEntry, SectionType } from "../../types";
import {
  DEFAULT_STRIP_SEPARATOR,
  DEFAULT_STRIP_SEPARATOR_SIZE,
  DEFAULT_STRIP_TEXT_SIZE,
} from "./stripSeparator";

/**
 * Section catalog — the single source of truth for the Website Builder's data layer.
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
  /** i18n key under website:businessPage.sections.variants.<id> */
  labelKey: string;
}

export interface SectionMeta {
  type: SectionType;
  icon: LucideIcon;
  /** i18n keys under website:businessPage.sections.<type>.{label,description} */
  labelKey: string;
  descriptionKey: string;
  /**
   * Variant keys with an implemented component, NOT the offering. The backend catalog
   * (GET /website-variants/catalog) decides what surfaces in the builder: an optional isBase row is
   * the section's included default, paid-only sections may intentionally have no base, and every
   * offered key renders from its price + ownership state. Catalog keys with no component here are
   * ignored. `variants[0]` is only the local renderer fallback while the catalog is unavailable or
   * names no implemented base; it does not imply that the style is included.
   * Shipping a new variant = implement the component, register its key here, add the catalog row.
   */
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
    // Persisted keys stay stable for drafts/entitlements while their design identities follow the source:
    // bar → Ribbon, split → Ticker, hairline → Pill. The backend offering intentionally has no free base.
    icon: Megaphone,
    labelKey: "businessPage.sections.announcement.label",
    descriptionKey: "businessPage.sections.announcement.description",
    variants: [
      { id: "bar", labelKey: "businessPage.sections.variants.ribbon" },
      { id: "split", labelKey: "businessPage.sections.variants.ticker" },
      { id: "hairline", labelKey: "businessPage.sections.variants.pill" },
    ],
    netNew: true,
    defaultConfig: {},
    defaultHidden: true,
  },
  nav: {
    type: "nav",
    // Sticky brand + section links + CTA, pinned right below the announcement — not reorderable
    // (PINNED_TYPES). `default` is the persisted catalog key for the included Editorial design.
    icon: PanelTop,
    labelKey: "businessPage.sections.nav.label",
    descriptionKey: "businessPage.sections.nav.description",
    variants: [
      { id: "default", labelKey: "businessPage.sections.variants.editorial" },
      v("capsule"),
      v("split"),
      v("underlay"),
    ],
    netNew: false,
    defaultConfig: {},
  },
  hero: {
    type: "hero",
    icon: LayoutTemplate,
    labelKey: "businessPage.sections.hero.label",
    descriptionKey: "businessPage.sections.hero.description",
    // Free base `default` uses the drenched text-panel treatment. The five premium designs are
    // photo-forward (cinematic), typographic (poster),
    // scroll-jacked (portal), an aurora field (drift), and falling ink glyphs (tumble). `default`'s label
    // is overridden to "Text panel"; the rest map one-to-one to their variant components + catalog rows.
    variants: [
      { id: "default", labelKey: "businessPage.sections.variants.textPanel" },
      v("cinematic"),
      v("poster"),
      v("portal"),
      v("drift"),
      v("tumble"),
    ],
    netNew: false,
    defaultConfig: {},
  },
  marquee: {
    type: "marquee",
    icon: Type,
    labelKey: "businessPage.sections.marquee.label",
    descriptionKey: "businessPage.sections.marquee.description",
    // Paid-only Strip motion styles over the same source-faithful visual treatment. `scroll` moves
    // exclusively with page movement; `loop` runs a calm automatic pass. The catalog
    // intentionally has no base row: both implemented keys are premium choices.
    variants: [v("scroll"), v("loop")],
    netNew: false,
    defaultConfig: {
      separatorStyle: DEFAULT_STRIP_SEPARATOR,
      separatorSize: DEFAULT_STRIP_SEPARATOR_SIZE,
      textSize: DEFAULT_STRIP_TEXT_SIZE,
      useBrandColorBackground: false,
    },
    // Decorative band derived from existing data — opt-in so a fresh page isn't busy.
    defaultHidden: true,
  },
  about: {
    type: "about",
    icon: AlignLeft,
    labelKey: "businessPage.sections.about.label",
    descriptionKey: "businessPage.sections.about.description",
    // Exact design-source set. Manifesto leads because variants[0] is the safe local fallback and must
    // match the Included/base catalog row; `sticky` is the persisted key for customer-facing Story.
    variants: [v("manifesto"), v("editorial"), { id: "sticky", labelKey: "businessPage.sections.variants.sticky" }],
    netNew: false,
    defaultConfig: {},
  },
  services: {
    type: "services",
    icon: Rows3,
    labelKey: "businessPage.sections.services.label",
    descriptionKey: "businessPage.sections.services.description",
    // Exact design-source set. Feature is the Included/base menu; `grid` is the persisted
    // design key for the customer-facing Cards treatment.
    variants: [
      v("feature"),
      v("bento"),
      { id: "grid", labelKey: "businessPage.sections.variants.cards" },
    ],
    netNew: false,
    defaultConfig: {},
  },
  locations: {
    type: "locations",
    icon: MapPin,
    labelKey: "businessPage.sections.locations.label",
    descriptionKey: "businessPage.sections.locations.description",
    // Exact design-source set. Panorama is first because the first implemented key is the safe local
    // fallback and must match the Included/base catalog row. `cards` is the persisted key for Bento.
    variants: [v("panorama"), v("showcase"), { id: "cards", labelKey: "businessPage.sections.variants.bento" }, v("atlas")],
    netNew: false,
    // Owner picks which locations to hide; amenity-capable layouts own their fixed icon-row treatment.
    defaultConfig: { hiddenLocationIds: [] as number[] },
  },
  gallery: {
    type: "gallery",
    icon: Images,
    labelKey: "businessPage.sections.gallery.label",
    descriptionKey: "businessPage.sections.gallery.description",
    // Five executable layouts from the design source. Bento is the safe local fallback and the sole
    // included catalog style; `index` is the persisted design key for the customer-facing Mosaic style.
    variants: [
      v("bento"),
      v("carousel"),
      v("masonry"),
      { id: "index", labelKey: "businessPage.sections.variants.mosaic" },
      v("fan"),
    ],
    netNew: false,
    defaultConfig: {},
  },
  team: {
    type: "team",
    icon: Users,
    labelKey: "businessPage.sections.team.label",
    descriptionKey: "businessPage.sections.team.description",
    // "portraits" = the free lookbook grid of photo cards (default); "roster" = a numbered editorial list;
    // "columns" = a row of expanding per-location doors; "carousel" = a centre-stage drag rail. Legacy
    // grid/list saves migrate on read.
    variants: [v("portraits"), v("roster"), v("columns"), v("carousel")],
    netNew: false,
    defaultConfig: {},
  },
  testimonials: {
    type: "testimonials",
    icon: Quote,
    // Each voice owns its head + rating-summary form: the pinboard wall (included base), the auto-playing
    // showcase (catalog key `default`), two drifting marquee lanes, a dark spotlight panel, or a draggable
    // deck. Wall leads — it's the free fallback base; legacy cards/quote saves collapse to it on read.
    labelKey: "businessPage.sections.testimonials.label",
    descriptionKey: "businessPage.sections.testimonials.description",
    variants: [
      v("wall"),
      { id: "default", labelKey: "businessPage.sections.variants.showcase" },
      v("marquee"),
      v("spotlight"),
      v("deck"),
    ],
    netNew: false,
    defaultConfig: {},
  },
  faq: {
    type: "faq",
    // Exact design-source set. Grid leads because variants[0] is the safe local fallback and must match
    // the Included/base catalog row; Accordion and Index are paid treatments.
    icon: HelpCircle,
    labelKey: "businessPage.sections.faq.label",
    descriptionKey: "businessPage.sections.faq.description",
    variants: [v("grid"), v("accordion"), v("index")],
    netNew: true,
    defaultConfig: {},
  },
  footer: {
    type: "footer",
    // Directory is the included/base footer. The remaining four live design-file treatments are paid catalog
    // variants. Footer stays pinned last and required regardless of which treatment is selected.
    icon: PanelBottom,
    labelKey: "businessPage.sections.footer.label",
    descriptionKey: "businessPage.sections.footer.description",
    variants: [v("directory"), v("editorial"), v("signature"), v("masthead"), v("marque")],
    netNew: false,
    defaultConfig: {},
  },
};

/** Sections locked into fixed positions: non-reorderable (the drag grip becomes a pin). Announcement,
 *  nav, hero and Strip form the fixed opening sequence; footer closes the page. The builder disables
 *  their drag and `buildInitialLayout` enforces their order on read. */
export const PINNED_TYPES: ReadonlySet<string> = new Set<SectionType>([
  "announcement",
  "nav",
  "hero",
  "marquee",
  "footer",
]);

/** Sections that are always shown — their visibility can't be toggled off (every page needs a header, a
 *  hero, and a footer). A subset of PINNED_TYPES; Announcement and Strip are pinned but stay optional. */
export const REQUIRED_TYPES: ReadonlySet<string> = new Set<SectionType>(["nav", "hero", "footer"]);

/** Catalog order used for a fresh default layout. */
export const SECTION_TYPES: SectionType[] = [
  "announcement",
  "nav",
  "hero",
  "marquee",
  "about",
  "services",
  "locations",
  "gallery",
  "team",
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

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

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
    (s): s is Record<string, unknown> =>
      isPlainRecord(s) &&
      typeof s.type === "string" &&
      s.type.trim().length > 0 &&
      // Contact and Photo break were deliberately removed. Unlike unknown forward-compatible entries,
      // deprecated section records must not survive into the working layout or a later save.
      s.type !== "contact" &&
      s.type !== "interlude",
  );
  if (valid.length === 0) {
    return DEFAULT_LAYOUT.map((s) => ({ ...s, config: { ...s.config } }));
  }

  // Known entries are runtime-normalized before entering controlled React state. The wire
  // endpoint exposes legacy JSONB, so its compile-time SectionEntry[] type cannot guarantee
  // booleans, variants, configs, or uniqueness. Unknown entries stay byte-for-byte opaque
  // (forward compatibility); known duplicates keep the first occurrence deterministically.
  const seenKnown = new Set<SectionType>();
  const normalizedSaved: SectionEntry[] = [];
  valid.forEach((rawEntry) => {
    const type = rawEntry.type as string;
    if (!isKnownSectionType(type)) {
      normalizedSaved.push(JSON.parse(JSON.stringify(rawEntry)) as SectionEntry);
      return;
    }
    if (seenKnown.has(type)) return;
    seenKnown.add(type);

    const meta = SECTION_META[type];
    const config = isPlainRecord(rawEntry.config)
      ? { ...meta.defaultConfig, ...rawEntry.config }
      : { ...meta.defaultConfig };
    normalizedSaved.push({
      type,
      variant:
        typeof rawEntry.variant === "string" && rawEntry.variant.trim()
          ? rawEntry.variant
          : meta.variants[0].id,
      visible: REQUIRED_TYPES.has(type)
        ? true
        : typeof rawEntry.visible === "boolean"
          ? rawEntry.visible
          : !meta.defaultHidden,
      config,
    });
  });

  if (normalizedSaved.length === 0) {
    return DEFAULT_LAYOUT.map((s) => ({ ...s, config: { ...s.config } }));
  }

  const present = new Set(normalizedSaved.map((s) => s.type));
  const appended = SECTION_TYPES.filter((t) => !present.has(t)).map((t) => ({
    ...makeEntry(t),
    // Newly-added catalog sections default hidden so they don't disturb an existing page — except the
    // always-shown chrome (nav/hero/footer), which must stay visible so existing pages don't lose them.
    visible: REQUIRED_TYPES.has(t),
  }));
  const result = [...normalizedSaved, ...appended];
  // Announcement is pinned to the top of the page — enforce its position on read. Map only the
  // one known legacy key. An otherwise unknown key may belong to a newer dashboard and must
  // survive this older client until the owner explicitly chooses a different style.
  const ai = result.findIndex((s) => s.type === "announcement");
  if (ai !== -1) {
    const [a] = result.splice(ai, 1);
    const variant = a.variant === "inline" ? "bar" : a.variant;
    result.unshift({ ...a, variant });
  }
  // Hero is pinned second (right after the announcement) and not reorderable — enforce its position on
  // read. A legacy "split" save (the retired cover-plate toggle) maps to the free base, which now adapts
  // to the cover photo on its own (drenched field with no cover, text panel with one). Unknown keys are
  // forward-compatible data and remain untouched even though this build renders its safe default for them.
  const hi = result.findIndex((s) => s.type === "hero");
  if (hi !== -1) {
    const [h] = result.splice(hi, 1);
    const heroIndex = result[0]?.type === "announcement" ? 1 : 0;
    result.splice(heroIndex, 0, {
      ...h,
      variant: h.variant === "split" ? SECTION_META.hero.variants[0].id : h.variant,
    });
  }
  // Nav is pinned right after the announcement (above the hero) and not reorderable — enforce its slot on read.
  const ni = result.findIndex((s) => s.type === "nav");
  if (ni !== -1) {
    const [nav] = result.splice(ni, 1);
    const navIndex = result[0]?.type === "announcement" ? 1 : 0;
    result.splice(navIndex, 0, nav);
  }
  // Strip is attached directly to the hero in the design source. It remains optional/hidden-capable,
  // but its slot is fixed so no other section can split the hero from its kinetic service band.
  const mi = result.findIndex((s) => s.type === "marquee");
  if (mi !== -1) {
    const [marquee] = result.splice(mi, 1);
    const heroIndex = result.findIndex((s) => s.type === "hero");
    result.splice(heroIndex + 1, 0, marquee);
  }
  // Footer is pinned to the very end and not reorderable — enforce its slot on read.
  const fi = result.findIndex((s) => s.type === "footer");
  if (fi !== -1) {
    const [footer] = result.splice(fi, 1);
    result.push(footer);
  }
  // Marquee gained a motion choice (scroll-driven default vs auto-loop). Migrate only its
  // former explicit key; do not collapse a key introduced by a newer client.
  const marqueeIndex = result.findIndex((s) => s.type === "marquee");
  if (marqueeIndex !== -1 && result[marqueeIndex].variant === "default") {
    result[marqueeIndex] = { ...result[marqueeIndex], variant: SECTION_META.marquee.variants[0].id };
  }
  // Retired Locations bases (`switcher`, and its older `list` predecessor) land on the new Included
  // Panorama treatment. Existing `cards` and `atlas` identities remain valid but render the rebuilt designs.
  const li = result.findIndex((s) => s.type === "locations");
  if (li !== -1) {
    const entry = result[li];
    const config = { ...entry.config };
    delete config.heading;
    delete config.sublede;
    delete config.amenitiesStyle;
    result[li] = {
      ...entry,
      variant: ["switcher", "list"].includes(entry.variant)
        ? SECTION_META.locations.variants[0].id
        : entry.variant,
      config,
    };
  }
  // Team renamed its layout choice (grid/list → portraits/roster); Gallery retired Editorial and its
  // design-source `grid` key now means Bento. Map only documented legacy ids. Unknown keys
  // round-trip unchanged so this client cannot erase a future catalogue selection.
  const LEGACY_VARIANTS: Partial<Record<SectionType, Record<string, string>>> = {
    // Retired About layouts collapse to the new Included Manifesto. Unknown keys remain forward-compatible.
    about: { simple: "manifesto", portrait: "manifesto", ledger: "manifesto" },
    team: { grid: "portraits", list: "roster" },
    gallery: { editorial: "bento", grid: "bento" },
    // Ancient cards/quote saves land on the new free base (wall); `default` stays a valid paid Showcase key.
    testimonials: { cards: "wall", quote: "wall" },
    // Split, List, and Chips were real FAQ keys in this client but are absent from the executable design
    // registry. Existing drafts land on Included Grid. Unknown keys (including undocumented `default`) stay.
    faq: { split: "grid", list: "grid", chips: "grid" },
    // The former footer designs are intentionally retired. Existing drafts land on the new included
    // Directory treatment so an old paid/unknown id can never bypass the new catalog entitlement model.
    footer: { default: "directory", poster: "directory", minimal: "directory", mega: "directory", index: "directory" },
  };
  for (const [type, remap] of Object.entries(LEGACY_VARIANTS)) {
    const idx = result.findIndex((s) => s.type === type);
    if (idx === -1) continue;
    const variant = remap[result[idx].variant] ?? result[idx].variant;
    if (variant !== result[idx].variant) result[idx] = { ...result[idx], variant };
  }
  return result;
}
