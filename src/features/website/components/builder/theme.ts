/**
 * Theme tokens for the Website Builder preview.
 *
 * The preview is a faithful, scaled-down render of the public "lookbook" microsite: a warm paper
 * canvas with an editorial serif display, a mono label face, and a single owner-controlled accent.
 * The owner's brand is expressed through two knobs only — the accent colour (from the branding form)
 * and a font "personality" — so a page stays on-brand and can't be made ugly.
 *
 * Palette + fonts mirror the microsite source (Web app/microsite.css). The accent is the only
 * brand-driven colour; bg/fg/muted/line are the fixed paper palette.
 */
import type { CSSProperties } from "react";

/** Static presentation grouping only. Ownership, availability, prices, and checkout identifiers
 * come from the Website catalog API and intentionally do not live in this frontend registry. */
export type ThemeOptionTier = "included" | "premium";
export type FontCategory = "serif" | "sans";
export type FontPreset = "modern" | "classic" | "elegant" | "friendly";

export type FontLoadingMetadata =
  | { source: "bundled" }
  | { source: "google-fonts"; stylesheetUrl: string };

export interface FontOption {
  key: string;
  /** Stable human-readable catalog name; localized UI can continue to use labelKey. */
  name: string;
  /** i18n key under website:businessPage.theme.fonts.<key> */
  labelKey: string;
  tier: ThemeOptionTier;
  category: FontCategory;
  /** Closest production engine personality for layout/behaviour defaults. */
  preset: FontPreset;
  /** Display (heading) stack — varies per personality. */
  stack: string;
  /** Display weight + tracking tuned per face (mirrors microsite [data-font] presets). */
  weight: number;
  tracking: string;
  /** Whether italic pull-quotes/marquee read well in this face (serifs: yes; grotesques: no). */
  italicOk: boolean;
  /** How the selected display face is loaded. Remote faces stay lazy and selection-driven. */
  loading: FontLoadingMetadata;
}

/** Body + label faces are constant across personalities (only the display face changes). */
export const SANS_STACK =
  '"Geist Variable", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, sans-serif';
export const MONO_STACK = '"Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace';

/** Canonical display-font registry. The first four entries preserve the current production
 * mappings exactly; premium entries layer their real face over the closest production preset. */
export const FONT_CATALOG: FontOption[] = [
  {
    key: "modern",
    name: "Modern",
    labelKey: "businessPage.theme.fonts.modern",
    tier: "included",
    category: "sans",
    preset: "modern",
    stack: '"Geist Variable", system-ui, -apple-system, sans-serif',
    weight: 700,
    tracking: "-0.035em",
    italicOk: false,
    loading: { source: "bundled" },
  },
  {
    key: "classic",
    name: "Classic",
    labelKey: "businessPage.theme.fonts.classic",
    tier: "included",
    category: "serif",
    preset: "classic",
    stack: '"Libre Caslon Display", Georgia, "Times New Roman", serif',
    weight: 400,
    tracking: "-0.005em",
    italicOk: true,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&display=swap",
    },
  },
  {
    key: "elegant",
    name: "Elegant",
    labelKey: "businessPage.theme.fonts.elegant",
    tier: "included",
    category: "serif",
    preset: "elegant",
    stack: '"Bodoni Moda", Georgia, "Times New Roman", serif',
    weight: 600,
    tracking: "-0.02em",
    italicOk: true,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,500;1,6..96,600&display=swap",
    },
  },
  {
    key: "friendly",
    name: "Friendly",
    labelKey: "businessPage.theme.fonts.friendly",
    tier: "included",
    category: "sans",
    preset: "friendly",
    stack: '"Bricolage Grotesque", system-ui, -apple-system, sans-serif',
    weight: 600,
    tracking: "-0.02em",
    italicOk: false,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&display=swap",
    },
  },
  {
    key: "playfair",
    name: "Playfair",
    labelKey: "businessPage.theme.fonts.playfair",
    tier: "premium",
    category: "serif",
    preset: "elegant",
    stack: '"Playfair Display", Georgia, "Times New Roman", serif',
    weight: 500,
    tracking: "-0.02em",
    italicOk: true,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap",
    },
  },
  {
    key: "cormorant",
    name: "Cormorant",
    labelKey: "businessPage.theme.fonts.cormorant",
    tier: "premium",
    category: "serif",
    preset: "elegant",
    stack: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    weight: 600,
    tracking: "-0.02em",
    italicOk: true,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
    },
  },
  {
    key: "italiana",
    name: "Italiana",
    labelKey: "businessPage.theme.fonts.italiana",
    tier: "premium",
    category: "serif",
    preset: "elegant",
    // Italiana intentionally stays faithful to Atelier. Its sparse glyph coverage falls through
    // to Bodoni/Georgia per character, so Romanian and other unsupported text remains readable.
    stack: '"Italiana", "Bodoni Moda", Georgia, "Times New Roman", serif',
    weight: 400,
    tracking: "-0.02em",
    italicOk: false,
    loading: {
      source: "google-fonts",
      stylesheetUrl: "https://fonts.googleapis.com/css2?family=Italiana&display=swap",
    },
  },
  {
    key: "marcellus",
    name: "Marcellus",
    labelKey: "businessPage.theme.fonts.marcellus",
    tier: "premium",
    category: "serif",
    preset: "classic",
    stack: '"Marcellus", Georgia, "Times New Roman", serif',
    weight: 400,
    tracking: "-0.005em",
    italicOk: false,
    loading: {
      source: "google-fonts",
      stylesheetUrl: "https://fonts.googleapis.com/css2?family=Marcellus&display=swap",
    },
  },
  {
    key: "dmserif",
    name: "DM Serif",
    labelKey: "businessPage.theme.fonts.dmserif",
    tier: "premium",
    category: "serif",
    preset: "classic",
    stack: '"DM Serif Display", Georgia, "Times New Roman", serif',
    weight: 400,
    tracking: "-0.005em",
    italicOk: true,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap",
    },
  },
  {
    key: "crimson",
    name: "Crimson",
    labelKey: "businessPage.theme.fonts.crimson",
    tier: "premium",
    category: "serif",
    preset: "classic",
    stack: '"Crimson Pro", Georgia, "Times New Roman", serif',
    weight: 500,
    tracking: "-0.005em",
    italicOk: true,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&display=swap",
    },
  },
  {
    key: "grotesk",
    name: "Grotesk",
    labelKey: "businessPage.theme.fonts.grotesk",
    tier: "premium",
    category: "sans",
    preset: "modern",
    stack: '"Space Grotesk", "Geist Variable", system-ui, -apple-system, sans-serif',
    weight: 600,
    tracking: "-0.035em",
    italicOk: false,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    },
  },
  {
    key: "sora",
    name: "Sora",
    labelKey: "businessPage.theme.fonts.sora",
    tier: "premium",
    category: "sans",
    preset: "modern",
    stack: '"Sora", "Geist Variable", system-ui, -apple-system, sans-serif',
    weight: 600,
    tracking: "-0.035em",
    italicOk: false,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap",
    },
  },
  {
    key: "manrope",
    name: "Manrope",
    labelKey: "businessPage.theme.fonts.manrope",
    tier: "premium",
    category: "sans",
    preset: "friendly",
    stack: '"Manrope", "Bricolage Grotesque", system-ui, -apple-system, sans-serif',
    weight: 700,
    tracking: "-0.02em",
    italicOk: false,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
    },
  },
  {
    key: "unbounded",
    name: "Unbounded",
    labelKey: "businessPage.theme.fonts.unbounded",
    tier: "premium",
    category: "sans",
    preset: "friendly",
    stack: '"Unbounded", "Bricolage Grotesque", system-ui, -apple-system, sans-serif',
    weight: 500,
    tracking: "-0.02em",
    italicOk: false,
    loading: {
      source: "google-fonts",
      stylesheetUrl:
        "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600&display=swap",
    },
  },
];

export const INCLUDED_FONT_OPTIONS = FONT_CATALOG.filter((font) => font.tier === "included");
export const PREMIUM_FONT_OPTIONS = FONT_CATALOG.filter((font) => font.tier === "premium");

/** Compatibility export for the current editor, which only understands included choices. */
export const FONT_OPTIONS = INCLUDED_FONT_OPTIONS;

const DEFAULT_FONT = INCLUDED_FONT_OPTIONS[0];

export function fontOptionFor(key: string | null | undefined): FontOption | undefined {
  return FONT_CATALOG.find((font) => font.key === key);
}

export function displayFontFor(key: string | null | undefined): FontOption {
  return fontOptionFor(key) ?? DEFAULT_FONT;
}

export function fontStylesheetFor(key: string | null | undefined): string | undefined {
  const font = fontOptionFor(key);
  return font?.loading.source === "google-fonts" ? font.loading.stylesheetUrl : undefined;
}

// ---------------------------------------------------------------------------
// Paper palette — fixed (only the accent is brand-driven). Mirrors microsite.css :root.
// ---------------------------------------------------------------------------

export const PAPER = {
  bg: "#FBFAF7", // warm paper canvas
  fg: "#1C1C1A", // near-black ink (warm)
  muted: "#6B6862", // warm grey, secondary text
  line: "rgba(28,28,26,0.12)", // hairline rules / borders
  soft: "#F3F1ED", // alternating section tint (≈ fg 3.5% over bg)
  card: "#FFFFFF",
} as const;

export const EASE_OUT = "cubic-bezier(.2,.7,.3,1)";
export const EASE_SPRING = "cubic-bezier(.34,1.56,.64,1)";
/** The microsite's strong ease-out — mirrors --ease-out-strong in globals.css. Injected by previewVars so
 *  the preview's animations don't depend on the host stylesheet defining the token. */
export const EASE_OUT_STRONG = "cubic-bezier(0.23, 1, 0.32, 1)";

const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Curated raw accents from Atelier plus the requested extensions. The registry preserves every
 * authored hex exactly; contrast-safe preview derivatives are calculated below without mutating it. */
export interface BrandAccentOption {
  key: string;
  name: string;
  hex: string;
  tier: ThemeOptionTier;
}

/** Canonical accent registry. Tier is only the static design grouping; the server catalog remains
 * authoritative for ownership, sale availability, pricing, and checkout identifiers. */
export const BRAND_ACCENT_CATALOG: BrandAccentOption[] = [
  // Included Atelier palette.
  { key: "terracotta", name: "Terracotta", hex: "#C2552F", tier: "included" },
  { key: "jade", name: "Jade", hex: "#1B9C85", tier: "included" },
  { key: "mulberry", name: "Mulberry", hex: "#7A3B57", tier: "included" },
  { key: "forest", name: "Forest", hex: "#2F5D4A", tier: "included" },
  { key: "marine", name: "Marine", hex: "#2F6E8F", tier: "included" },

  // Premium Atelier palette.
  { key: "ink", name: "Ink", hex: "#1C1C1A", tier: "premium" },
  { key: "espresso", name: "Espresso", hex: "#5A4335", tier: "premium" },
  { key: "ochre", name: "Ochre", hex: "#A97E22", tier: "premium" },
  { key: "olive", name: "Olive", hex: "#71722F", tier: "premium" },
  { key: "moss", name: "Moss", hex: "#4F6E3D", tier: "premium" },
  { key: "pine", name: "Pine", hex: "#1F5F4E", tier: "premium" },
  { key: "petrol", name: "Petrol", hex: "#206E78", tier: "premium" },
  { key: "slate", name: "Slate", hex: "#47617C", tier: "premium" },
  { key: "indigo", name: "Indigo", hex: "#4A4F9E", tier: "premium" },
  { key: "violet", name: "Violet", hex: "#71499A", tier: "premium" },
  { key: "orchid", name: "Orchid", hex: "#9A4B85", tier: "premium" },
  { key: "plum", name: "Plum", hex: "#83365D", tier: "premium" },
  { key: "rosewood", name: "Rosewood", hex: "#A64457", tier: "premium" },
  { key: "blush", name: "Blush", hex: "#BC6E76", tier: "premium" },
  { key: "copper", name: "Copper", hex: "#A55E2E", tier: "premium" },

  // Requested coherent extensions to the premium palette.
  { key: "brick", name: "Brick", hex: "#7A2E2A", tier: "premium" },
  { key: "rust", name: "Rust", hex: "#9A3B22", tier: "premium" },
  { key: "amber", name: "Amber", hex: "#A66A1E", tier: "premium" },
  { key: "caramel", name: "Caramel", hex: "#6B3A24", tier: "premium" },
  { key: "greige", name: "Greige", hex: "#4A4039", tier: "premium" },
  { key: "teal", name: "Teal", hex: "#1E6E6E", tier: "premium" },
  { key: "peacock", name: "Peacock", hex: "#0E3D44", tier: "premium" },
  { key: "navy", name: "Navy", hex: "#283B52", tier: "premium" },
  { key: "burgundy", name: "Burgundy", hex: "#8E2C45", tier: "premium" },
  { key: "graphite", name: "Graphite", hex: "#2A2E33", tier: "premium" },
];

export const INCLUDED_BRAND_ACCENTS = BRAND_ACCENT_CATALOG.filter(
  (accent) => accent.tier === "included",
);
export const PREMIUM_BRAND_ACCENTS = BRAND_ACCENT_CATALOG.filter(
  (accent) => accent.tier === "premium",
);

/** Compatibility export for the current editor, which only understands included choices. */
export const BRAND_ACCENTS = INCLUDED_BRAND_ACCENTS;

/** Fallback brand accent when the owner hasn't picked one — the lookbook's signature terracotta. */
export const FALLBACK_BRAND = "#C2552F";

export function safeBrandColor(hex: string | null | undefined): string {
  return hex && HEX6.test(hex) ? hex : FALLBACK_BRAND;
}

/** Readable on-accent text colour (warm white or near-black) from relative luminance. */
export function onBrandText(hex: string): string {
  const c = safeBrandColor(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // The microsite always paints warm-white (#FBF7F0) on the accent — its curated palette (terracotta,
  // teal, plum, green, blue, ink) is saturated enough to carry it. Match that look: keep warm-white on
  // any reasonably deep accent and only flip to ink for genuinely light custom colours (the dashboard
  // allows a free hex). The pure b/w 4.5:1 tie (~0.179) sits just under terracotta #C2552F (lum 0.182),
  // wrongly flipping it to ink; 0.45 holds warm-white across the whole brand palette and still protects
  // pale accents.
  return lum > 0.45 ? "#1C1C1A" : "#FBF7F0";
}

const relLuminance = (r: number, g: number, b: number) => {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/**
 * Accent darkened just enough to read as TEXT on the paper canvas. Dark accents (terracotta, teal,
 * plum) pass through unchanged so the page keeps its exact brand hue; only very pale accents are
 * deepened until legible. Used for kickers, CTAs, ratings — never for fills (those use the raw accent).
 */
export function brandInk(hex: string): string {
  const c = safeBrandColor(hex).slice(1);
  let r = parseInt(c.slice(0, 2), 16);
  let g = parseInt(c.slice(2, 4), 16);
  let b = parseInt(c.slice(4, 6), 16);
  let guard = 0;
  while (relLuminance(r, g, b) > 0.16 && guard < 24) {
    r = Math.round(r * 0.85);
    g = Math.round(g * 0.85);
    b = Math.round(b * 0.85);
    guard += 1;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/** Warm-white (#FBF7F0) relative luminance — the on-accent text colour painted on a drenched field. */
const WARM_WHITE_LUM = 0.933;

/**
 * Accent deepened just enough that warm-white body text clears WCAG AA (4.5:1) on a fully drenched hero
 * field. Swatches that already pass return unchanged; lighter swatches and custom colours are nudged
 * darker. A flat fill keeps the brand hue and avoids introducing a theme-dependent gradient.
 * 4.5:1 vs warm-white ⇒ field luminance ≤ ~0.166.
 */
export function brandField(hex: string): string {
  const c = safeBrandColor(hex).slice(1);
  let r = parseInt(c.slice(0, 2), 16);
  let g = parseInt(c.slice(2, 4), 16);
  let b = parseInt(c.slice(4, 6), 16);
  let guard = 0;
  while ((WARM_WHITE_LUM + 0.05) / (relLuminance(r, g, b) + 0.05) < 4.55 && guard < 40) {
    r = Math.round(r * 0.96);
    g = Math.round(g * 0.96);
    b = Math.round(b * 0.96);
    guard += 1;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * CSS custom properties for the preview root. Sets the paper palette, the brand-driven accent (raw
 * fill + legible ink + on-accent text + AA-safe drenched field), and the active display/mono faces.
 * Sections read these via `var(--mc-*)`, exactly mirroring the microsite renderer contract.
 */
export function previewVars(
  brandColor: string | null | undefined,
  fontKey: string | null | undefined,
): CSSProperties {
  const accent = safeBrandColor(brandColor);
  const font = displayFontFor(fontKey);
  return {
    "--mc-accent": accent,
    "--mc-accent-field": brandField(accent),
    "--mc-ink": brandInk(accent),
    "--mc-on-accent": onBrandText(accent),
    "--mc-bg": PAPER.bg,
    "--mc-fg": PAPER.fg,
    "--mc-muted": PAPER.muted,
    "--mc-line": PAPER.line,
    "--mc-soft": PAPER.soft,
    "--mc-card": PAPER.card,
    "--mc-display": font.stack,
    "--mc-display-weight": String(font.weight),
    "--mc-display-tracking": font.tracking,
    "--mc-mono": MONO_STACK,
    // Motion easing the section CSS + inline transitions reference; set here so the preview carries it
    // locally (globals.css also defines it for the rest of the app — identical value, no visual change).
    "--ease-out-strong": EASE_OUT_STRONG,
    fontFamily: SANS_STACK,
    color: PAPER.fg,
  } as CSSProperties;
}
