/**
 * Theme tokens for the business-page builder preview.
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

export interface FontOption {
  key: string;
  /** i18n key under marketplace:businessPage.theme.fonts.<key> */
  labelKey: string;
  /** Display (heading) stack — varies per personality. */
  stack: string;
  /** Display weight + tracking tuned per face (mirrors microsite [data-font] presets). */
  weight: number;
  tracking: string;
  /** Whether italic pull-quotes/marquee read well in this face (serifs: yes; grotesques: no). */
  italicOk: boolean;
  /** Pro-tier face — previewable, but saving requires an upgrade (see the builder paywall banner). */
  pro?: boolean;
}

/** Body + label faces are constant across personalities (only the display face changes). */
export const SANS_STACK =
  '"Geist", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, sans-serif';
export const MONO_STACK = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const FONT_OPTIONS: FontOption[] = [
  {
    key: "modern",
    labelKey: "businessPage.theme.fonts.modern",
    stack: '"Geist", system-ui, -apple-system, sans-serif',
    weight: 700,
    tracking: "-0.035em",
    italicOk: false,
  },
  {
    key: "classic",
    labelKey: "businessPage.theme.fonts.classic",
    stack: '"Libre Caslon Display", Georgia, "Times New Roman", serif',
    weight: 400,
    tracking: "-0.005em",
    italicOk: true,
  },
  {
    key: "elegant",
    labelKey: "businessPage.theme.fonts.elegant",
    stack: '"Bodoni Moda", Georgia, "Times New Roman", serif',
    weight: 600,
    tracking: "-0.02em",
    italicOk: true,
    pro: true,
  },
  {
    key: "friendly",
    labelKey: "businessPage.theme.fonts.friendly",
    stack: '"Bricolage Grotesque", system-ui, -apple-system, sans-serif',
    weight: 600,
    tracking: "-0.02em",
    italicOk: false,
    pro: true,
  },
];

const DEFAULT_FONT = FONT_OPTIONS[0];

export function displayFontFor(key: string | null | undefined): FontOption {
  return FONT_OPTIONS.find((f) => f.key === key) ?? DEFAULT_FONT;
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

/**
 * Curated accent palette — the owner picks ONE swatch (the only brand-driven colour). Each is a deep,
 * muted editorial tone (heritage paint / fashion-house / apothecary) tuned for the warm-paper lookbook:
 * deep enough that warm-white text (#FBF7F0) clears WCAG AA on a fully drenched hero field — every hex
 * verified at ≥5.5:1 (relative luminance ≤ ~0.19), so brandField() leaves them unchanged. Ordered as a
 * warm → cool → neutral arc; terracotta is the signature default (FALLBACK_BRAND), not necessarily index 0.
 * i18n names live under marketplace:businessPage.branding.brandColor.swatches.<key>.
 */
// `pro: true` = locked behind the paywall (previewable, save needs an upgrade). The free tier is a
// curated 8 spanning the warm→cool→neutral arc so a non-paying owner still has real range; the split
// is just data — a future entitlements backend can flip these flags per business.
export const BRAND_ACCENTS: { key: string; hex: string; pro?: boolean }[] = [
  { key: "burgundy", hex: "#8E2C45" },
  { key: "brick", hex: "#7A2E2A", pro: true },
  { key: "terracotta", hex: "#C2552F" },
  { key: "rust", hex: "#9A3B22", pro: true },
  { key: "amber", hex: "#A66A1E" },
  { key: "caramel", hex: "#6B3A24", pro: true },
  { key: "olive", hex: "#5F6324" },
  { key: "pine", hex: "#3E6B36", pro: true },
  { key: "forest", hex: "#1B4332", pro: true },
  { key: "teal", hex: "#1E6E6E" },
  { key: "peacock", hex: "#0E3D44", pro: true },
  { key: "navy", hex: "#283B52" },
  { key: "indigo", hex: "#3E4E80", pro: true },
  { key: "violet", hex: "#3E2E55", pro: true },
  { key: "plum", hex: "#86436F" },
  { key: "rose", hex: "#7A3850", pro: true },
  { key: "slate", hex: "#3A3F3D", pro: true },
  { key: "greige", hex: "#4A4039", pro: true },
  { key: "graphite", hex: "#2A2E33", pro: true },
  { key: "ink", hex: "#26211C" },
];

/** Fallback brand accent when the owner hasn't picked one — the lookbook's signature terracotta. */
export const FALLBACK_BRAND = "#C2552F";

export function safeBrandColor(hex: string | null | undefined): string {
  return hex && HEX6.test(hex) ? hex : FALLBACK_BRAND;
}

/**
 * Paywall predicates. A Pro accent/font is fully previewable (it drives the live render) but can't be
 * saved until the owner upgrades — the builder surfaces that with a preview banner. Today nothing Pro is
 * owned, so "is this pick Pro?" === "is this a preview-only pick?"; when entitlements land, subtract the
 * business's owned SKUs here.
 */
export function accentIsPro(hex: string | null | undefined): boolean {
  const h = safeBrandColor(hex).toLowerCase();
  return BRAND_ACCENTS.some((a) => a.pro === true && a.hex.toLowerCase() === h);
}

export function fontIsPro(key: string | null | undefined): boolean {
  return displayFontFor(key).pro === true;
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
 * field. Most curated swatches already pass and return unchanged; only the two lightest (terracotta,
 * amber) are nudged a couple of points darker. A flat fill — the vivid brand hue is kept and there is no
 * gradient (the old paper wash read as cheap). 4.5:1 vs warm-white ⇒ field luminance ≤ ~0.166.
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
