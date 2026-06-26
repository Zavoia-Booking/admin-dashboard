import { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Globe,
  Music2,
  Link2,
  ImageOff,
  Plus,
  Sparkles,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
  HeroConfig,
  LocationsConfig,
} from "../../../types";
import { previewVars, displayFontFor } from "./theme";
import { isKnownSectionType } from "./sectionCatalog";
import { splitAboutContent } from "./aboutContent";
import { useLocationTagDictionaries, type ChipOption, type ResolvedTagDictionaries } from "../../../hooks/useLocationTagDictionaries";
import { tagIcon } from "../../../utils/tagIcons";
import { cn } from "../../../../../shared/lib/utils";
import { UserRole } from "../../../../../shared/types/auth";

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
  logo: string | null;
  heroImageUrl: string | null;
  tagline: string;
  aboutContent: string;
  email: string;
  phone: string;
  social: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    website?: string | null;
    pinterest?: string | null;
  };
  locations: LocationWithAssignments[];
  faq: FaqItem[];
  announcement: AnnouncementContent;
  brandColor: string;
  fontKey: string;
  locale: "en" | "ro";
  /** Curated 5★ quotes for the Reviews section (empty/absent → aggregate-only render). */
  reviews?: PreviewReview[];
  /** Per team-member rating keyed by member id (from the reviews stats endpoint; absent → no stars). */
  teamRatings?: Record<number, { rating: number; count: number }>;
}

interface LivePreviewProps {
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
}

type T = (k: string, o?: Record<string, unknown>) => string;

// Shared display / mono text styles (resolve the per-personality faces set on the root).
const DISPLAY: CSSProperties = {
  fontFamily: "var(--mc-display)",
  fontWeight: "var(--mc-display-weight)" as CSSProperties["fontWeight"],
  letterSpacing: "var(--mc-display-tracking)",
};
const MONO: CSSProperties = { fontFamily: "var(--mc-mono)" };

/** Section types that don't get a numbered "0N —" kicker (full-bleed hero/announcement + decorative bands). */
export const UNNUMBERED = new Set<string>(["hero", "announcement", "marquee", "interlude"]);

// Nav frosting over the hero: scroll distance to full blur, and the fraction of it by which the warm
// paper tint + dark text have fully arrived (kept short so it never dwells in a muddy, unreadable state).
const FROST_DIST = 240;
const FROST_TINT_AT = 0.32;

/**
 * Faithful, scaled-down render of the public "lookbook" microsite — a warm paper canvas, editorial
 * serif display, mono numbered kickers, and a single brand accent. Sections render in layout order
 * from the owner's real data; booking/links are inert (this is a preview) and empty content shows
 * calm placeholders. Fluid type keys off the preview's own width via container-query units, so the
 * same component reads well in the small per-section card and the full-page dialog alike.
 */
function LivePreviewImpl({ layout, data, chrome = true, startNumber = 1 }: LivePreviewProps) {
  const { t } = useTranslation("marketplace");
  const visible = layout.filter((s) => s.visible);

  // The announcement is always the sticky ribbon above the nav (pinned first, single "bar" variant).
  const bar = visible.find((s) => s.type === "announcement");
  const stacked = visible.filter((s) => s.type !== "announcement");

  // The nav floats transparently and frosts on scroll over every photo/accent hero — the cinematic cover,
  // the drenched accent field, and the cover plate (whose photo + accent field fill the strip behind the
  // bar). Only an announcement bar above the nav forces the solid paper bar from the top. Over the drenched
  // field the CTA also frosts (white→accent), since a static accent pill would blend into the same-hue field.
  const first = stacked[0];
  const firstHeroMode =
    !bar && first?.type === "hero" ? heroMode((first.config ?? {}) as HeroConfig, !!data.heroImageUrl) : null;
  const overHero =
    firstHeroMode === "cinematic" || firstHeroMode === "drenched" || firstHeroMode === "coverPlate";
  const ctaFrost = firstHeroMode === "drenched";

  // Scroll chrome: the nav sticks to the dialog's scroll container and frosts gradually as the hero scrolls
  // up behind it. `navH` lets the nav give back its flow height (negative margin) so it overlays the hero.
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [navH, setNavH] = useState(0);
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => setNavH(nav.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [chrome]);

  useEffect(() => {
    if (!chrome || !overHero) {
      setProgress(0);
      return;
    }
    // Reduced motion: skip the scroll-driven frost and land the settled (paper) bar, which stays legible
    // over both the hero and the paper sections — mirrors how the parallax + CSS reveals bail.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    const nav = navRef.current;
    if (!nav || !heroRef.current) return;
    let scroller: HTMLElement | null = nav.parentElement;
    while (scroller) {
      const oy = getComputedStyle(scroller).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      scroller = scroller.parentElement;
    }
    if (!scroller) return;
    const sc = scroller;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Drive off absolute scroll distance so the frost arrives quickly and consistently regardless of hero height.
      setProgress(Math.round(Math.min(1, sc.scrollTop / FROST_DIST) * 100) / 100);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chrome, overHero, stacked.length]);

  // Section numbers (mono kicker) follow the visible non-bar order, mirroring the microsite's "0N —".
  // `startNumber` lets the scoped one-section preview carry its real page ordinal instead of restarting at 1.
  let n = startNumber - 1;

  return (
    <div
      className={chrome ? "" : "overflow-hidden rounded-xl ring-1 ring-black/5"}
      style={{ ...previewVars(data.brandColor, data.fontKey), backgroundColor: "var(--mc-bg)", containerType: "inline-size" } as CSSProperties}
    >
      {bar ? (
        // Announcement ribbon + nav travel together, pinned to the top of the scroll container.
        <div className="sticky top-0 z-30">
          <AnnouncementBar data={data} t={t} sample={!chrome} />
          {chrome && stacked.length > 0 && (
            <Nav
              data={data}
              layout={layout}
              t={t}
              overHero={false}
              progress={0}
              navRef={navRef}
              marginBottom={0}
              sticky={false}
            />
          )}
        </div>
      ) : (
        chrome &&
        stacked.length > 0 && (
          <Nav
            data={data}
            layout={layout}
            t={t}
            overHero={overHero}
            ctaFrost={ctaFrost}
            progress={progress}
            navRef={navRef}
            marginBottom={overHero ? -navH : 0}
          />
        )
      )}
      {stacked.length === 0 ? (
        bar ? null : (
          <div className="px-6 py-16 text-center text-sm" style={{ color: "var(--mc-muted)" }}>
            {t("businessPage.builder.preview.allHidden")}
          </div>
        )
      ) : (
        stacked.map((s, i) => {
          if (!UNNUMBERED.has(s.type)) n += 1;
          const no = UNNUMBERED.has(s.type) ? "" : String(n).padStart(2, "0");
          // Re-key the hero on its effective layout (cover present + coverLayout) so toggling full-bleed ⇄
          // cover plate remounts it; in the scoped preview that remount plays the swap scale-fade.
          const heroKey =
            s.type === "hero"
              ? `hero-${data.heroImageUrl ? ((s.config as HeroConfig | undefined)?.coverLayout ?? "full") : "none"}`
              : s.type;
          return (
            <div
              key={heroKey}
              ref={overHero && i === 0 ? heroRef : undefined}
              className={cn("relative", !chrome && s.type === "hero" && "mc-hero-swap")}
            >
              <SectionView entry={s} data={data} t={t} no={no} chrome={chrome} />
            </div>
          );
        })
      )}
      {chrome && stacked.length > 0 && <Footer data={data} t={t} />}
    </div>
  );
}

/**
 * Memoised so a keystroke in an inspector field (which re-renders SectionBuilder) only re-renders the
 * preview when its `data`/`layout` props actually change. SectionBuilder memoises `previewData` to keep
 * that reference stable.
 */
export const LivePreview = memo(LivePreviewImpl);

// ---------------------------------------------------------------------------

function SectionView({ entry, data, t, no, chrome }: { entry: SectionEntry; data: PreviewData; t: T; no: string; chrome: boolean }) {
  if (!isKnownSectionType(entry.type)) return null; // unknown stored type → skipped on the public side
  switch (entry.type) {
    case "hero":
      // Parallax only in the full-page preview; the scoped one-section preview has no hero-scroll, so a
      // page-scroll-driven shift would lift the cover off its buffer and bare the bottom edge.
      return <Hero entry={entry} data={data} t={t} parallax={chrome} />;
    case "marquee":
      return <Marquee data={data} entry={entry} chrome={chrome} />;
    case "interlude":
      return <Interlude data={data} t={t} />;
    case "about":
      return <About data={data} t={t} no={no} />;
    case "locations":
      return <Locations entry={entry} data={data} t={t} no={no} />;
    case "gallery":
      return <Gallery entry={entry} data={data} t={t} no={no} />;
    case "team":
      return <Team entry={entry} data={data} t={t} no={no} />;
    case "testimonials":
      return <Reviews entry={entry} data={data} t={t} no={no} />;
    case "faq":
      return <Faq entry={entry} data={data} t={t} no={no} />;
    case "contact":
      return <Contact entry={entry} data={data} t={t} no={no} />;
    default:
      return null;
  }
}

const localized = (v: { en: string; ro: string } | undefined, locale: "en" | "ro") =>
  (v ? v[locale] || v.en || v.ro : "") || "";

const locationPhoto = (l: LocationWithAssignments): string | null =>
  l.featuredImage || l.portfolioImages?.[0]?.url || null;

/** Weighted average rating + total count across rated locations (mirrors the microsite aggregate). */
function aggregateReviews(locations: LocationWithAssignments[]) {
  const rated = locations.filter((l) => (l.totalReviews ?? 0) > 0);
  const count = rated.reduce((s, l) => s + (l.totalReviews ?? 0), 0);
  const rating =
    count > 0 ? rated.reduce((s, l) => s + (l.averageRating ?? 0) * (l.totalReviews ?? 0), 0) / count : 0;
  return { rating, count };
}

/** The serif lede (headline) + muted body for the About section, split on the first blank line via the
 *  shared {@link splitAboutContent} contract and trimmed for display — so editor, preview and validation
 *  all agree on where the break falls. No blank line ⇒ the whole text is the lede. */
function splitLede(text: string): { lede: string; body: string } {
  const { title, body } = splitAboutContent(text);
  return { lede: title.trim(), body: body.trim() };
}

// ---- Hero ----------------------------------------------------------------

// Entrance stagger (ms) + parallax depth — mirrors the microsite's reveal cascade and MicroImg speed.
const HERO_DELAY = { eyebrow: 100, title: 170, titleStep: 70, tagline: 460, rating: 560, cta: 680 };
const HERO_PARALLAX = 0.06;

type HeroMode = "cinematic" | "coverPlate" | "drenched";
/** Resolve the hero's render mode from its cover photo + the cover-layout toggle. No cover ⇒ the hero
 *  floods with the brand accent (the drenched field). With a cover, the owner's `coverLayout` picks the
 *  full-bleed cinematic cover or the "cover plate" (tall photo bleed + paper card). Shared with the nav:
 *  every cover/accent hero floats the frosted bar; only an announcement ribbon forces the solid paper nav. */
function heroMode(cfg: HeroConfig, hasImage: boolean): HeroMode {
  if (!hasImage) return "drenched";
  return cfg.coverLayout === "plate" ? "coverPlate" : "cinematic";
}

/** Headline split into per-word masks that rise into place (mirrors the design's SplitReveal). */
function WordRise({ text, base, step, className, style }: { text: string; base: number; step: number; className?: string; style?: CSSProperties }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <h1 className={className} style={style}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="mc-rev-word">
            <span style={{ animationDelay: `${base + i * step}ms` }}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </h1>
  );
}

/** Two-letter brand monogram from the business name (first + last word, or first two letters of one word). */
function monogramOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function Hero({ entry, data, t, parallax }: { entry: SectionEntry; data: PreviewData; t: T; parallax: boolean }) {
  const cfg = (entry.config ?? {}) as HeroConfig;
  const { rating, count } = aggregateReviews(data.locations);
  const locs = data.locations;
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const monogram = monogramOf(name);
  const mode = heroMode(cfg, !!data.heroImageUrl);
  const showRating = count > 0 && cfg.showRating !== false;
  // Booking button copy is fixed (not owner-editable); the button always opens the booking flow.
  const ctaLabel = t("businessPage.builder.preview.bookNow");
  // Eyebrow is auto-built from the locations (owner only toggles it on/off): a single location shows
  // its city, multiple show "{n} locations across {place}" (shared city when all in one, else
  // country), falling back to a count.
  let derivedEyebrow = "";
  if (locs.length === 1) {
    derivedEyebrow = locs[0].addressComponents?.city || "";
  } else if (locs.length > 1) {
    const cities = new Set(locs.map((l) => l.addressComponents?.city).filter(Boolean));
    const country = locs.map((l) => l.addressComponents?.country).find(Boolean);
    const place = cities.size === 1 ? [...cities][0] : country;
    derivedEyebrow = place
      ? t("businessPage.builder.preview.hero.locationsAcross", { num: locs.length, place })
      : t("businessPage.builder.preview.locationCount", { count: locs.length });
  }
  const eyebrow = cfg.showEyebrow === false ? "" : derivedEyebrow;

  const headerRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Cover parallax tied to the preview's scroll container (full-page preview only; skipped under
  // reduced-motion / no image / scoped one-section preview).
  useEffect(() => {
    const host = parallaxRef.current;
    const header = headerRef.current;
    if (!parallax || !host || !header || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let scroller: HTMLElement | null = header.parentElement;
    while (scroller) {
      const oy = getComputedStyle(scroller).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      scroller = scroller.parentElement;
    }
    if (!scroller) return;
    const sc = scroller;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Stacked cover-plate (narrow container, ≤720px) drops the image overscan — its photo fills an exact
      // 16/10 box — so any parallax shift would bare an edge. Keep it static there (matches the mockup,
      // which doesn't parallax when stacked); the cinematic cover keeps its overscan at every width.
      if (mode === "coverPlate" && header.getBoundingClientRect().width <= 720) {
        host.style.transform = "";
        return;
      }
      const r = host.getBoundingClientRect();
      const cr = sc.getBoundingClientRect();
      const d = r.top + r.height / 2 - (cr.top + cr.height / 2);
      // Clamp inside the image overscan (top:-14% / height:128%) so an edge can never enter the frame.
      const buffer = header.getBoundingClientRect().height * 0.13;
      const ty = Math.max(-buffer, Math.min(buffer, -d * HERO_PARALLAX));
      host.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    // Recompute on resize too, so toggling the preview between desktop and mobile re-evaluates the stacked
    // guard above (the component doesn't remount on toggle, so a scroll-only listener would go stale).
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(update);
    });
    ro.observe(header);
    update();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [data.heroImageUrl, parallax, mode]);

  const eyebrowDot = <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />;

  // Cinematic full-bleed cover — the photo-forward hero (default when a cover image exists).
  if (mode === "cinematic") {
    return (
      <header ref={headerRef} className="mc-hero-cine relative isolate flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div ref={parallaxRef} className="absolute left-0 right-0" style={{ top: "-14%", height: "128%", willChange: "transform" }}>
            <img src={data.heroImageUrl ?? undefined} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(20,16,14,0.62) 0%, rgba(20,16,14,0.42) 18%, rgba(20,16,14,0.34) 42%, rgba(20,16,14,0.38) 62%, rgba(20,16,14,0.84) 100%)" }}
        />
        <div className="mx-auto w-full max-w-[1320px] px-[clamp(20px,5cqw,48px)] pb-[clamp(40px,6cqw,72px)] pt-12 text-white">
          {eyebrow && (
            <p className="mc-rev-fade inline-flex items-center gap-[9px] text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "rgba(255,255,255,0.92)", animationDelay: `${HERO_DELAY.eyebrow}ms` }}>
              {eyebrowDot}
              {eyebrow}
            </p>
          )}
          <WordRise
            text={name}
            base={HERO_DELAY.title}
            step={HERO_DELAY.titleStep}
            className="mt-3 max-w-[14ch] text-balance"
            style={{ ...DISPLAY, fontSize: "clamp(38px,12cqw,96px)", lineHeight: 0.96 }}
          />
          {data.tagline && (
            <p className="mc-rev-up mt-5 max-w-[540px] text-[clamp(14px,2.4cqw,21px)]" style={{ lineHeight: 1.45, color: "rgba(255,255,255,0.9)", animationDelay: `${HERO_DELAY.tagline}ms` }}>
              {data.tagline}
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
            {showRating && (
              <div className="mc-rev-up flex items-center gap-2.5" style={{ color: "#fff", animationDelay: `${HERO_DELAY.rating}ms` }}>
                <span style={{ ...DISPLAY, fontSize: "clamp(30px,6cqw,44px)", lineHeight: 0.85, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>
                  {rating.toFixed(1)}
                </span>
                <span className="flex flex-col gap-1">
                  <Stars value={rating} size={13} color="#fff" empty="rgba(255,255,255,0.34)" />
                  <span className="text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "rgba(255,255,255,0.8)", textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
                    {t("businessPage.builder.preview.reviewsCount", { count })}
                  </span>
                </span>
              </div>
            )}
            <div className="mc-rev-up" style={{ animationDelay: `${HERO_DELAY.cta}ms` }}>
              <BookButton label={ctaLabel} tone="paper" />
            </div>
          </div>
        </div>
        {/* Scroll cue — the full-page preview scrolls in the dialog, so this reads truthfully. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[26px] z-10 flex flex-col items-center gap-2 text-[10px] uppercase"
          style={{ ...MONO, letterSpacing: "0.2em", color: "rgba(255,255,255,0.8)" }}
        >
          {t("businessPage.builder.preview.hero.scrollCue")}
          <span className="mc-cue-line h-8 w-px" style={{ background: "rgba(255,255,255,0.5)" }} />
        </div>
      </header>
    );
  }

  // Cover plate — three layers: the drenched accent FIELD on the left (accent flood + ghost monogram +
  // masthead hairline, the same treatment as the no-cover hero), the cover PHOTO bleeding full-height on
  // the right, and a white CARD straddling the seam (the signature overlap). The .mc-plate* layout
  // (absolute field + photo + the overlapping card + the stack breakpoint) lives in globals.css.
  if (mode === "coverPlate") {
    return (
      <header ref={headerRef} className="mc-plate">
        <div className="mc-plate-field">
          {/* Oversized brand monogram bled off the top-left as a ~7% letterpress ghost — texture, not decoration. */}
          {monogram && (
            <span
              aria-hidden
              className="pointer-events-none absolute select-none whitespace-nowrap"
              style={{ ...DISPLAY, top: "-13%", left: "-7%", fontSize: "50cqw", lineHeight: 0.8, color: "color-mix(in oklch, var(--mc-on-accent) 7%, transparent)", textShadow: "0 2px 0 rgba(255,255,255,0.04), 0 -2px 0 rgba(0,0,0,0.06)" }}
            >
              {monogram}
            </span>
          )}
          {/* Masthead hairline under the floating nav — only in the full-page preview, where the nav sits
              above it (the scoped card has no nav, and the field is hidden once stacked). */}
          {parallax && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-[clamp(22px,3.4cqw,52px)] right-[clamp(16px,3cqw,40px)] top-[clamp(84px,13cqw,116px)] h-px"
              style={{ background: "color-mix(in oklch, var(--mc-on-accent) 18%, transparent)" }}
            />
          )}
        </div>
        <div className="mc-plate-photo">
          <div ref={parallaxRef} className="mc-plate-track">
            <img src={data.heroImageUrl ?? undefined} alt="" />
          </div>
        </div>
        <div className="mc-plate-card">
          {eyebrow && (
            <p className="mc-rev-fade inline-flex items-center gap-[9px] text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-muted)", animationDelay: `${HERO_DELAY.eyebrow}ms` }}>
              {eyebrowDot}
              {eyebrow}
            </p>
          )}
          <WordRise
            text={name}
            base={HERO_DELAY.title}
            step={HERO_DELAY.titleStep}
            className="mt-4 max-w-[13ch] text-balance"
            style={{ ...DISPLAY, fontSize: "clamp(30px,4.4cqw,52px)", lineHeight: 1 }}
          />
          {data.tagline && (
            <p className="mc-rev-up mt-4 max-w-[38ch] text-[clamp(14px,1.7cqw,17px)]" style={{ lineHeight: 1.5, color: "var(--mc-muted)", animationDelay: `${HERO_DELAY.tagline}ms` }}>
              {data.tagline}
            </p>
          )}
          {/* Baseline rule under the lockup. */}
          <div aria-hidden className="mc-rev-up mt-7 h-px w-[60px]" style={{ background: "var(--mc-line)", animationDelay: `${HERO_DELAY.tagline}ms` }} />
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3.5">
            {showRating && (
              <div className="mc-rev-up flex items-center gap-2.5" style={{ animationDelay: `${HERO_DELAY.rating}ms` }}>
                <span style={{ ...DISPLAY, fontSize: "clamp(26px,3.8cqw,38px)", lineHeight: 0.85, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{rating.toFixed(1)}</span>
                <span className="flex flex-col gap-1">
                  <Stars value={rating} size={13} />
                  <span className="text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
                    {t("businessPage.builder.preview.reviewsCount", { count })}
                  </span>
                </span>
              </div>
            )}
            <div className="mc-rev-up" style={{ animationDelay: `${HERO_DELAY.cta}ms` }}>
              <BookButton label={ctaLabel} tone="accent" />
            </div>
          </div>
        </div>
        {/* Scroll cue — the full-page preview scrolls, so this reads truthfully (omitted in the scoped card). */}
        {parallax && (
          <div
            className="mc-plate-cue pointer-events-none absolute inset-x-0 bottom-[26px] z-[4] flex flex-col items-center gap-2 text-[10px] uppercase"
            style={{ ...MONO, letterSpacing: "0.2em", color: "rgba(255,255,255,0.82)" }}
          >
            {t("businessPage.builder.preview.hero.scrollCue")}
            <span className="mc-cue-line h-8 w-px" style={{ background: "rgba(255,255,255,0.5)" }} />
          </div>
        )}
      </header>
    );
  }

  // Minimal / no cover — drenched accent field. With no photo the hero floods with the owner's brand
  // accent (deepened just enough for AA-legible warm-white type) and the type carries the whole
  // composition. Content sits bottom-left so a cover, once added, slots into the same hero frame.
  return (
    <header
      ref={headerRef}
      className="mc-hero-drench relative isolate flex flex-col justify-end overflow-hidden px-[clamp(20px,5cqw,48px)] pb-[clamp(36px,6cqw,68px)] pt-[clamp(56px,10cqw,104px)]"
      style={{ background: "var(--mc-accent-field)", color: "var(--mc-on-accent)" }}
    >
      {/* Oversized brand monogram as a ~6% letterpress ghost — texture, not decoration. Size + offset live
          in .mc-hero-mono (globals): width-driven on desktop (a giant ghost bled off the top-right corner),
          but on the tall, narrow phone hero it's enlarged and vertically centred so it fills the field
          instead of sitting stuck at the top. */}
      {monogram && (
        <span
          aria-hidden
          className="mc-hero-mono pointer-events-none absolute z-0 select-none whitespace-nowrap"
          style={{ ...DISPLAY, right: "-5%", lineHeight: 0.8, color: "color-mix(in oklch, var(--mc-on-accent) 6%, transparent)", textShadow: "0 2px 0 rgba(255,255,255,0.04), 0 -2px 0 rgba(0,0,0,0.06)" }}
        >
          {monogram}
        </span>
      )}
      {/* Editorial hairline under the masthead zone — only in the full-page preview, where the floating nav
          sits above it. In the scoped one-section card (no nav) it would float orphaned, so it's omitted. */}
      {parallax && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[clamp(20px,5cqw,48px)] right-[clamp(20px,5cqw,48px)] top-[clamp(88px,15cqw,124px)] z-[1] h-px"
          style={{ background: "color-mix(in oklch, var(--mc-on-accent) 16%, transparent)" }}
        />
      )}
      <div className="relative z-[2] mx-auto w-full max-w-[1320px]">
        {eyebrow && (
          <p className="mc-rev-fade inline-flex items-center gap-[9px] text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-on-accent)", animationDelay: `${HERO_DELAY.eyebrow}ms` }}>
            {eyebrowDot}
            {eyebrow}
          </p>
        )}
        <WordRise
          text={name}
          base={HERO_DELAY.title}
          step={HERO_DELAY.titleStep}
          className="mt-4 max-w-[15ch] text-balance"
          style={{ ...DISPLAY, fontSize: "clamp(40px,11cqw,84px)", lineHeight: 0.96 }}
        />
        {data.tagline && (
          <p className="mc-rev-up mt-5 max-w-[540px] text-[clamp(14px,2.4cqw,21px)]" style={{ lineHeight: 1.45, color: "var(--mc-on-accent)", animationDelay: `${HERO_DELAY.tagline}ms` }}>
            {data.tagline}
          </p>
        )}
        {/* Baseline rule under the lockup — the second editorial hairline. */}
        <div aria-hidden className="mc-rev-up mt-7 h-px w-16" style={{ background: "color-mix(in oklch, var(--mc-on-accent) 36%, transparent)", animationDelay: `${HERO_DELAY.tagline}ms` }} />
        <div className="mt-6 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
          {showRating && (
            <div className="mc-rev-up flex items-center gap-2.5" style={{ animationDelay: `${HERO_DELAY.rating}ms` }}>
              <span style={{ ...DISPLAY, fontSize: "clamp(28px,6cqw,42px)", lineHeight: 0.85, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{rating.toFixed(1)}</span>
              <span className="flex flex-col gap-1">
                <Stars value={rating} size={13} color="var(--mc-on-accent)" empty="color-mix(in oklch, var(--mc-on-accent) 32%, transparent)" />
                <span className="text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-on-accent)" }}>
                  {t("businessPage.builder.preview.reviewsCount", { count })}
                </span>
              </span>
            </div>
          )}
          <div className="mc-rev-up" style={{ animationDelay: `${HERO_DELAY.cta}ms` }}>
            <BookButton label={ctaLabel} tone="paper" />
          </div>
        </div>
      </div>
    </header>
  );
}

// ---- About ---------------------------------------------------------------

function About({ data, t, no }: { data: PreviewData; t: T; no: string }) {
  const body = data.aboutContent?.trim() ?? "";
  const { lede, body: rest } = body ? splitLede(body) : { lede: "", body: "" };

  const Copy = body ? (
    <>
      <p className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(21px,4cqw,40px)", lineHeight: 1.26 }}>
        {lede}
      </p>
      {rest && (
        <p className="mt-6 max-w-[62ch] whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
          {rest}
        </p>
      )}
    </>
  ) : (
    // Empty: render the real editorial layout with sample copy, desaturated, so the owner sees the shape
    // they'll fill rather than a dashed placeholder box. aria-hidden — it's a ghost, not real content.
    <div className="select-none opacity-35" aria-hidden>
      <p className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(21px,4cqw,40px)", lineHeight: 1.26 }}>
        {t("businessPage.builder.preview.aboutGhostLede")}
      </p>
      <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
        {t("businessPage.builder.preview.aboutGhostBody")}
      </p>
    </div>
  );

  return (
    <Section>
      {/* Editorial split — the numbered kicker in a slim left rail, lede + body in the wide column. On a
          narrow preview (mobile) it stacks to one column (mirrors the microsite's `.lb-about-grid` collapse). */}
      <div className="grid items-start gap-[clamp(18px,3.5cqw,56px)] grid-cols-1 @2xl:[grid-template-columns:minmax(0,0.7fr)_minmax(0,2.3fr)]">
        <Kicker no={no}>{t("businessPage.builder.preview.kicker.about")}</Kicker>
        <div>{Copy}</div>
      </div>
    </Section>
  );
}

// ---- Locations -----------------------------------------------------------
/** City/area line for a location — prefers the structured city, falls back to the address head. */
const locationArea = (l: LocationWithAssignments): string =>
  l.addressComponents?.city?.trim() || l.address?.split(",")[0]?.trim() || "";

/** Pretty caption address — structured "street, city" (no postal code / country), falling back to the
 *  raw formatted address only when components are absent. */
const prettyAddress = (l: LocationWithAssignments): string => {
  const c = l.addressComponents;
  const street = c?.street?.trim()
    ? `${c.streetNumber?.trim() ? `${c.streetNumber.trim()} ` : ""}${c.street.trim()}`
    : "";
  return [street, c?.city?.trim()].filter(Boolean).join(", ") || l.address?.trim() || "";
};

/** Whether a location has any opening hours worth showing (mirrors the Contact hours gate). */
const hasOpeningHours = (l: LocationWithAssignments): boolean => {
  const wh = (l.workingHours ?? {}) as Partial<Record<DayKey, { isOpen?: boolean }>>;
  return !!l.open247 || DAY_KEYS.some((d) => wh[d]?.isOpen);
};

/** Dialable tel: href — keeps a leading + (E.164) and drops visual separators. */
const telHref = (phone: string): string => `tel:${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}`;

/** Platform-aware "show this place on the map" link. Uses the SEARCH endpoint (a pinned place card), never
 *  directions — a directions link has to invent an `origin`, which defaults to the device location and is
 *  unreliable on desktop (IP geolocation), so the route's start point comes out wrong. With search, the user
 *  taps Directions from the card where Maps uses their real location. On Apple devices `ll`+`q` pins the exact
 *  coords AND labels them with the business name; Google can't label bare coords without a Place ID (and
 *  discourages coordinate queries), so it gets the address string. Null when remote or no usable location.
 *  https://developers.google.com/maps/documentation/urls/get-started */
const isApplePlatform = (): boolean =>
  typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

const mapHref = (l: LocationWithAssignments): string | null => {
  if (l.isRemote) return null;
  const c = l.addressComponents;
  const coords = typeof c?.latitude === "number" && typeof c?.longitude === "number" ? `${c.latitude},${c.longitude}` : "";
  const addr = l.address?.trim();
  if (isApplePlatform()) {
    if (coords) return `https://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(l.name)}`;
    if (addr) return `https://maps.apple.com/?q=${encodeURIComponent(addr)}`;
    return null;
  }
  if (addr) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  if (coords) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
  return null;
};

/** Count-up that re-runs on mount — eases 0→value with a cubic ease-out (mirrors the microsite RollNum). */
function CountUp({ value, decimals = 0, durationMs = 760, delayMs = 0 }: { value: number; decimals?: number; durationMs?: number; delayMs?: number }) {
  const reduce =
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let start = 0;
    const begin = performance.now() + delayMs;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const step = (now: number) => {
      if (now < begin) {
        raf = requestAnimationFrame(step);
        return;
      }
      if (!start) start = now;
      const p = Math.min(1, (now - start) / durationMs);
      setShown(value * ease(p));
      if (p < 1) raf = requestAnimationFrame(step);
      else setShown(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // Runs once per mount; the parent re-keys per selected location so it replays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{shown.toFixed(decimals)}</>;
}

/** Crossfading featured photo — the outgoing image stays beneath while the new one fades/zooms in over it. */
function StagePhoto({ src, alt }: { src: string; alt: string }) {
  const keyRef = useRef(0);
  const [stack, setStack] = useState<{ src: string; k: number }[]>(() => [{ src, k: 0 }]);
  useEffect(() => {
    setStack((s) => {
      if (s[s.length - 1].src === src) return s;
      keyRef.current += 1;
      return [...s.slice(-1), { src, k: keyRef.current }]; // keep prev (under) + new (over)
    });
  }, [src]);
  useEffect(() => {
    if (stack.length < 2) return;
    const id = setTimeout(() => setStack((s) => s.slice(-1)), 900);
    return () => clearTimeout(id);
  }, [stack]);
  return (
    <div className="absolute inset-0">
      {stack.map((it, i) => (
        <img
          key={it.k}
          src={it.src}
          alt={i === stack.length - 1 ? alt : ""}
          className={cn("absolute inset-0 h-full w-full object-cover", i === stack.length - 1 && "mc-locx-img")}
        />
      ))}
    </div>
  );
}

/**
 * Locations — the editorial "switcher": a numbered index of places stacked over a compact data card on
 * the left (opening hours, stats, contact, tags, Book CTA), and the selected location's photo as a
 * full-height editorial plate on the right that stretches to match the left column. A single location
 * just drops the index. Sliding indicator, count-up stats, crossfading photo, staggered reveals on switch.
 */
function Locations({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const hidden = new Set((entry.config?.hiddenLocationIds as number[] | undefined) ?? []);
  const shown = data.locations.filter((l) => !hidden.has(l.id));
  // Resolve each tag group's IDs → {label, slug} via the shared (cached) dictionary, exactly as the edit slider does.
  const { dictionaries } = useLocationTagDictionaries();
  const [active, setActive] = useState(0);
  const idx = Math.min(active, Math.max(0, shown.length - 1));
  const loc = shown[idx];

  // Heading + sub-lede are editable per locale; a blank override falls back to the default editorial copy.
  const cfg = entry.config as LocationsConfig | undefined;
  const heading =
    cfg?.heading?.[data.locale]?.trim() ||
    t("businessPage.builder.preview.subhead.locations", { count: shown.length });
  const sublede =
    cfg?.sublede?.[data.locale]?.trim() ||
    t("businessPage.builder.preview.sublede.locations", { count: shown.length });

  return (
    <Section soft>
      <SectionHead
        no={no}
        stacked
        kicker={t("businessPage.builder.preview.kicker.locations")}
        heading={heading}
        sublede={sublede}
      />
      {shown.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.locationsEmpty")}</Placeholder>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-[clamp(18px,3cqw,40px)] @3xl:[grid-template-columns:1.12fr_0.88fr]">
          <div className="flex min-w-0 flex-col gap-[clamp(20px,3cqw,28px)]">
            {shown.length > 1 && <LocationIndex shown={shown} active={idx} onSelect={setActive} />}
            <LocationPanel loc={loc} dict={dictionaries} t={t} />
          </div>
          <LocationPhoto loc={loc} t={t} />
        </div>
      )}
    </Section>
  );
}

/** Left index: selectable rows + a sliding accent indicator that springs to the active row. */
function LocationIndex({ shown, active, onSelect }: { shown: LocationWithAssignments[]; active: number; onSelect: (i: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ y: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const row = list.querySelectorAll<HTMLElement>(".mc-locx-row")[active];
    if (row) setInd({ y: row.offsetTop + 14, h: Math.max(0, row.offsetHeight - 28) });
  }, [active, shown.length]);

  return (
    <div ref={listRef} className="relative flex flex-col">
      {ind && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 w-[2px] rounded-full"
          style={{
            transform: `translateY(${ind.y}px)`,
            height: ind.h,
            background: "var(--mc-accent)",
            transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      )}
      {shown.map((l, i) => {
        const on = i === active;
        const rating = (l.totalReviews ?? 0) > 0 ? (l.averageRating ?? 0) : null;
        const area = locationArea(l);
        return (
          <button key={l.id} type="button" className="mc-locx-row" data-on={on ? "1" : "0"} onClick={() => onSelect(i)} aria-pressed={on}>
            <span className="mc-locx-no">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0">
              <span className="mc-locx-nm">{l.name}</span>
              {area && <span className="mc-locx-area">{area}</span>}
            </span>
            <span className="flex items-center gap-2.5">
              {rating !== null && (
                <span className="mc-locx-rate">
                  <Star className="h-3 w-3" style={{ color: "var(--mc-accent)" }} fill="var(--mc-accent)" />
                  {rating.toFixed(1)}
                </span>
              )}
              <span className="mc-locx-mark">
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A location's selected marketplace tags resolved + grouped by category, in reading order — mirrors the
 *  owner-facing amenities slider so the page is scannable. Each group has its own id space (separate
 *  dictionary tables), so IDs are resolved against their own dictionary group. */
const TAG_GROUP_ORDER: { ids: keyof LocationWithAssignments; dict: keyof ResolvedTagDictionaries }[] = [
  { ids: "amenityTagIds", dict: "amenities" },
  { ids: "accessibilityTagIds", dict: "accessibility" },
  { ids: "paymentMethodTagIds", dict: "paymentMethods" },
  { ids: "valueTagIds", dict: "values" },
  { ids: "audienceTagIds", dict: "audience" },
  { ids: "languageTagIds", dict: "languages" },
];
type LocationTagGroup = { key: keyof ResolvedTagDictionaries; items: ChipOption[] };
function buildLocationTagGroups(loc: LocationWithAssignments, dict: ResolvedTagDictionaries | null): LocationTagGroup[] {
  if (!dict) return [];
  const out: LocationTagGroup[] = [];
  for (const g of TAG_GROUP_ORDER) {
    const ids = (loc[g.ids] as number[] | undefined) ?? [];
    if (ids.length === 0) continue;
    const byId = new Map(dict[g.dict].map((o) => [o.id, o]));
    const items = ids.map((id) => byId.get(id)).filter((x): x is ChipOption => !!x);
    if (items.length > 0) out.push({ key: g.dict, items });
  }
  return out;
}

/** Right plate: the selected location's photo as a full-height editorial panel with the caption overlay
 *  (name, blurb, address). Stretches to match the left column; falls back to an accent field with no photo. */
function LocationPhoto({ loc, t }: { loc: LocationWithAssignments; t: T }) {
  const photo = locationPhoto(loc);
  const onPhoto = !!photo;
  const blurb = loc.description?.trim();
  return (
    <div
      className="relative h-full min-h-[clamp(300px,42cqw,520px)] overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--mc-line)", background: onPhoto ? undefined : "var(--mc-accent-field)" }}
    >
      {onPhoto && <StagePhoto src={photo} alt={loc.name} />}
      {onPhoto && (
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,10,9,0.82) 0%, rgba(12,10,9,0.32) 42%, rgba(12,10,9,0) 72%)" }} />
      )}
      <div key={`cap-${loc.id}`} className="absolute inset-x-0 bottom-0 p-[clamp(18px,3cqw,36px)]" style={{ color: onPhoto ? "#fff" : "var(--mc-on-accent)" }}>
        <div className="mc-locx-rise text-balance" style={{ ...DISPLAY, fontSize: "clamp(28px,5.4cqw,52px)", lineHeight: 0.98, animationDelay: "60ms" }}>{loc.name}</div>
        {blurb && (
          <p className="mc-locx-rise mt-2.5 max-w-[42ch] text-[clamp(13px,1.7cqw,15px)] leading-relaxed" style={{ color: onPhoto ? "rgba(255,255,255,0.9)" : "var(--mc-on-accent)", animationDelay: "140ms" }}>
            {blurb}
          </p>
        )}
        <p className="mc-locx-rise mt-3 line-clamp-2 text-[12.5px]" style={{ color: onPhoto ? "rgba(255,255,255,0.78)" : "var(--mc-on-accent)", animationDelay: "220ms" }}>
          {prettyAddress(loc) || t("businessPage.builder.preview.noAddress")}
        </p>
      </div>
    </div>
  );
}

/** One contact row: a full-row link with a muted icon that warms to accent on hover; the raw value stays
 *  selectable text. External (maps) links open a new tab; tel/mailto hand off in place. */
function ContactRow({
  href,
  icon: Icon,
  label,
  external,
  alignTop,
  children,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
  alignTop?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group/c flex gap-2.5 text-[13px] transition-colors [color:var(--mc-fg)] hover:[color:var(--mc-accent)]",
        alignTop ? "items-start" : "items-center",
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors [color:var(--mc-muted)] group-hover/c:[color:var(--mc-accent)]",
          alignTop && "mt-0.5",
        )}
        strokeWidth={1.6}
        aria-hidden
      />
      <span className="min-w-0">{children}</span>
    </a>
  );
}

/** Left data card (under the picker): opening hours + rating/team stats + contact in a compact split that
 *  stacks when the card is narrow (its own `@container/panel`), then the collapsible tag band, then a
 *  full-width Book CTA footer. Keyed blocks re-key per location so their entrance animations replay. */
function LocationPanel({ loc, dict, t }: { loc: LocationWithAssignments; dict: ResolvedTagDictionaries | null; t: T }) {
  const rating = (loc.totalReviews ?? 0) > 0 ? (loc.averageRating ?? 0) : null;
  const teamN = (loc.teamMembers ?? []).length;
  const hasStats = rating !== null || teamN > 1;
  const showHours = hasOpeningHours(loc);
  const mapLink = mapHref(loc);
  const hasContact = !!loc.phone || !!loc.email || !!mapLink;
  const tagGroups = useMemo(() => buildLocationTagGroups(loc, dict), [loc, dict]);

  return (
    <div className="@container/panel overflow-hidden rounded-xl border" style={{ borderColor: "var(--mc-line)", background: "var(--mc-card)" }}>
      <div key={`info-${loc.id}`} className="mc-locx-fade p-[clamp(18px,3cqw,30px)]" style={{ animationDelay: "100ms" }}>
        <div className={cn("grid gap-[clamp(18px,3cqw,36px)]", showHours && "@md/panel:[grid-template-columns:1fr_1fr]")}>
          {showHours && <StageHours loc={loc} t={t} />}
          <div
            className={cn(
              "mc-locx-rise flex min-w-0 flex-col gap-5",
              showHours &&
                "border-t pt-[clamp(18px,3cqw,36px)] @md/panel:border-t-0 @md/panel:pt-0 @md/panel:border-l @md/panel:pl-[clamp(18px,3cqw,36px)]",
            )}
            style={{ borderColor: "var(--mc-line)", animationDelay: "240ms" }}
          >
            {hasStats && (
              <div className="flex gap-[clamp(18px,3cqw,32px)]">
                {rating !== null && (
                  <div className="flex flex-col gap-1">
                    <span style={{ ...DISPLAY, fontSize: "clamp(26px,3.4cqw,38px)", lineHeight: 1 }}><CountUp value={rating} decimals={1} delayMs={220} /></span>
                    <span className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.06em", color: "var(--mc-muted)" }}>
                      {t("businessPage.builder.preview.reviewsCount", { count: loc.totalReviews ?? 0 })}
                    </span>
                  </div>
                )}
                {teamN > 1 && (
                  <div className="flex flex-col gap-1">
                    <span style={{ ...DISPLAY, fontSize: "clamp(26px,3.4cqw,38px)", lineHeight: 1 }}><CountUp value={teamN} delayMs={260} /></span>
                    <span className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.06em", color: "var(--mc-muted)" }}>
                      {t("businessPage.builder.preview.inTheTeam")}
                    </span>
                  </div>
                )}
              </div>
            )}
            {hasContact && (
              <div className={cn("flex flex-col gap-3", hasStats && "border-t pt-4")} style={{ borderColor: "var(--mc-line)" }}>
                {loc.phone && (
                  <ContactRow href={telHref(loc.phone)} icon={Phone} label={t("businessPage.builder.preview.callLabel", { name: loc.name })}>
                    {loc.phone}
                  </ContactRow>
                )}
                {loc.email && (
                  <ContactRow href={`mailto:${loc.email.trim()}`} icon={Mail} label={t("businessPage.builder.preview.emailLabel", { name: loc.name })}>
                    <span className="block truncate">{loc.email}</span>
                  </ContactRow>
                )}
                {mapLink && (
                  <ContactRow
                    href={mapLink}
                    icon={MapPin}
                    label={t("businessPage.builder.preview.mapLabel", { name: loc.name })}
                    external
                    alignTop
                  >
                    <span className="block leading-snug">{loc.address?.trim() || prettyAddress(loc)}</span>
                  </ContactRow>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {tagGroups.length > 0 && <LocationTags key={`amen-${loc.id}`} groups={tagGroups} />}

      {loc.allowOnlineBooking && (
        <div className="mc-locx-fade border-t p-[clamp(18px,3cqw,30px)]" style={{ borderColor: "var(--mc-line)", animationDelay: "320ms" }}>
          <BookButton
            label={t("businessPage.builder.preview.bookAt", { name: loc.name })}
            tone="accent"
            size="lg"
            styleOverride={{ width: "100%", justifyContent: "center" }}
          />
        </div>
      )}
    </div>
  );
}

/** Tag band: category groups of pills. Past ~4 rows it clamps with a frosted bottom fade and a chevron
 *  toggle that springs the band open/closed (max-height tween). Re-mounts per location via key, so it
 *  resets to collapsed and re-measures on switch. */
function LocationTags({ groups }: { groups: LocationTagGroup[] }) {
  const { t } = useTranslation("marketplace");
  // Category labels reuse the owner-facing slider's namespace so copy stays in lockstep (en + ro).
  const { t: tTags } = useTranslation("locationMarketplaceDetails");
  const innerRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(0);
  const [open, setOpen] = useState(false);
  const COLLAPSED = 184; // ~4 pill rows incl. a category label

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setFull(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [groups]);

  const overflows = full > COLLAPSED + 12;
  const clamped = overflows && !open;

  return (
    <div className="mc-locx-fade border-t p-[clamp(18px,3cqw,32px)]" style={{ borderColor: "var(--mc-line)", animationDelay: "300ms" }}>
      <div className="relative">
        <div
          ref={innerRef}
          className="flex flex-col gap-[clamp(16px,2.4cqw,26px)]"
          style={{
            maxHeight: overflows ? (open ? full : COLLAPSED) : undefined,
            overflow: overflows ? "hidden" : undefined,
            transition: "max-height 0.55s var(--ease-out-strong)",
          }}
        >
          {groups.map((grp) => (
            <div key={grp.key}>
              <div className="mb-3 text-[10.5px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
                {tTags(`sections.${grp.key}.title`)}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {grp.items.map(({ label, slug }, i) => {
                  const Icon = tagIcon(slug);
                  return (
                    <span
                      key={slug}
                      className={cn(
                        "mc-locx-rowin inline-flex h-8 items-center gap-2 rounded-full border pr-4 text-[13px] font-semibold",
                        Icon ? "pl-3" : "pl-4",
                      )}
                      style={{ borderColor: "var(--mc-line)", background: "color-mix(in oklch, var(--mc-fg) 3%, transparent)", color: "var(--mc-fg)", animationDelay: `${200 + i * 36}ms` }}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />}
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Frosted fade over the clipped rows — gradient to the card colour + a masked blur for depth. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 backdrop-blur-[1.5px] transition-opacity duration-300"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--mc-card))",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 78%)",
            maskImage: "linear-gradient(to bottom, transparent, #000 78%)",
            opacity: clamped ? 1 : 0,
          }}
        />
      </div>
      {overflows && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t("businessPage.builder.preview.tagsShowLess") : t("businessPage.builder.preview.tagsShowAll")}
            className={cn("inline-flex h-9 w-9 cursor-pointer items-center justify-center transition-opacity hover:opacity-70", !open && "mc-chev-bob")}
            style={{ color: "var(--mc-fg)" }}
          >
            <ChevronDown className={cn("h-[26px] w-[26px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", open && "rotate-180")} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Opening-hours list for the stage — consecutive days with identical hours collapse into ranges
 *  (Mon–Wed), today highlighted, closed days in accent (mirrors the design .lb-locx-hours). */
function StageHours({ loc, t }: { loc: LocationWithAssignments; t: T }) {
  const wh = (loc.workingHours ?? {}) as Partial<Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>>;
  const todayIdx = (new Date().getDay() + 6) % 7;
  const closedLabel = t("businessPage.builder.preview.contactClosed");

  const dayValue = (d: DayKey): string => {
    if (loc.open247) return t("businessPage.builder.preview.contactOpen247");
    const day = wh[d];
    return day && day.isOpen && day.open && day.close ? `${day.open} – ${day.close}` : closedLabel;
  };
  // Collapse consecutive days with identical hours into ranges, in week order.
  const rows: { start: number; end: number; value: string }[] = [];
  DAY_KEYS.forEach((d, i) => {
    const v = dayValue(d);
    const last = rows[rows.length - 1];
    if (last && last.value === v) last.end = i;
    else rows.push({ start: i, end: i, value: v });
  });
  const rowLabel = (r: { start: number; end: number }): string =>
    r.start === r.end
      ? t(`businessPage.builder.preview.daysFull.${DAY_KEYS[r.start]}`)
      : `${t(`businessPage.builder.preview.days.${DAY_KEYS[r.start]}`)}–${t(`businessPage.builder.preview.days.${DAY_KEYS[r.end]}`)}`;

  return (
    <div>
      <div className="mb-3.5 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
        <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
        {t("businessPage.builder.preview.contactHours")}
      </div>
      <div>
        {rows.map((r, i) => {
          const today = todayIdx >= r.start && todayIdx <= r.end;
          const closed = r.value === closedLabel;
          const isLast = i === rows.length - 1;
          return (
            <div
              key={r.start}
              className="mc-locx-rowin flex items-center justify-between gap-6 text-[13.5px]"
              style={{
                padding: today ? "7px 12px" : "7px 0",
                margin: today ? "0 -12px" : undefined,
                borderRadius: today ? 6 : undefined,
                borderBottom: today || isLast ? "1px solid transparent" : "1px solid var(--mc-line)",
                background: today ? "color-mix(in oklch, var(--mc-accent) 7%, transparent)" : undefined,
                animationDelay: `${160 + i * 55}ms`,
              }}
            >
              <span style={{ color: "var(--mc-fg)", fontWeight: today ? 600 : 400 }}>{rowLabel(r)}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: today ? 600 : 400, color: closed ? "var(--mc-accent)" : today ? "var(--mc-fg)" : "var(--mc-muted)" }}>
                {r.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Gallery -------------------------------------------------------------
function Gallery({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const images = data.locations.flatMap((l) => l.portfolioImages?.map((p) => p.url) ?? []).slice(0, 6);
  // Asymmetric "lookbook" spans / ratios / offsets, mirroring the microsite essay grid.
  const spans = [7, 5, 4, 8, 6, 6];
  const ratios = ["7/5", "4/5", "4/5", "16/9", "3/2", "3/2"];
  const tops = ["0", "0", "clamp(14px,3cqw,48px)", "clamp(14px,3cqw,48px)", "0", "0"];

  return (
    <Section>
      <SectionHead
        no={no}
        kicker={t("businessPage.builder.preview.kicker.gallery")}
        heading={t("businessPage.builder.preview.galleryHeading")}
      />
      {images.length === 0 ? (
        <Placeholder icon={<ImageOff className="h-4 w-4" strokeWidth={1.6} />}>
          {t("businessPage.builder.preview.galleryEmpty")}
        </Placeholder>
      ) : entry.variant === "carousel" ? (
        <div className="flex gap-[clamp(8px,1.6cqw,16px)] overflow-x-auto pb-1">
          {images.map((url, i) => (
            <figure key={url} className="shrink-0">
              <img src={url} alt="" className="h-40 w-56 rounded-md object-cover" />
              <Caption index={i + 1} />
            </figure>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-[clamp(8px,1.6cqw,18px)]">
          {images.map((url, i) => (
            <figure key={url} style={{ gridColumn: `span ${spans[i % spans.length]}`, marginTop: tops[i % tops.length] }}>
              <img src={url} alt="" className="w-full rounded-md object-cover" style={{ aspectRatio: ratios[i % ratios.length] }} />
              <Caption index={i + 1} />
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
}

// ---- Team ----------------------------------------------------------------
function Team({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const members = dedupeTeam(data.locations.flatMap((l) => l.teamMembers ?? [])).slice(0, 8);
  const list = entry.variant === "list";
  const ratings = data.teamRatings;

  return (
    <Section>
      <SectionHead
        no={no}
        kicker={t("businessPage.builder.preview.kicker.team")}
        heading={t("businessPage.builder.preview.subhead.team")}
        sublede={t("businessPage.builder.preview.sublede.team")}
      />
      {members.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.teamEmpty")}</Placeholder>
      ) : (
        <div
          className={cn(
            "grid gap-[clamp(14px,2.4cqw,28px)]",
            list ? "grid-cols-1" : "[grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]",
          )}
        >
          {members.map((m) => {
            const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || t("businessPage.builder.preview.teamMember");
            const initials = `${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase() || "•";
            // Only the owner has a meaningful public title (the role enum carries no job titles, and
            // there is no specialty field) — show "Owner", omit for everyone else rather than fabricate.
            const role = m.role === UserRole.OWNER ? t("businessPage.builder.preview.teamRoleOwner") : "";
            const rating = ratings?.[m.id];
            const meta = (
              <>
                <div style={{ ...DISPLAY, fontSize: "clamp(15px,2.6cqw,21px)", color: "var(--mc-fg)" }}>{name}</div>
                {role && (
                  <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--mc-muted)" }}>
                    {role}
                  </div>
                )}
                {rating && rating.count > 0 && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px]" style={{ ...MONO, color: "var(--mc-muted)" }}>
                    <Stars value={rating.rating} size={11} />
                    {rating.rating.toFixed(1)} · {t("businessPage.builder.preview.reviewsCount", { count: rating.count })}
                  </div>
                )}
              </>
            );
            return (
              <div key={m.id} className={cn(list && "flex items-center gap-3.5")}>
                <div className={cn("overflow-hidden rounded-md", list ? "h-16 w-14 shrink-0" : "[aspect-ratio:3/4]")}>
                  {m.profileImage ? (
                    <img src={m.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-xl"
                      style={{ ...DISPLAY, background: "color-mix(in oklch, var(--mc-accent) 12%, var(--mc-soft))", color: "var(--mc-ink)" } as CSSProperties}
                    >
                      {initials}
                    </div>
                  )}
                </div>
                <div className={cn(!list && "mt-3")}>{meta}</div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ---- Reviews -------------------------------------------------------------
// Aggregate score + heading on top (variant-dependent), then a multi-column grid of real 5★ customer
// quotes when present. Falls back to an aggregate-only render when no quote text has loaded.
function Reviews({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const { rating, count } = aggregateReviews(data.locations);
  const quotes = (data.reviews ?? []).filter((q) => q.comment.trim()).slice(0, 6);
  const italic = displayFontFor(data.fontKey).italicOk;
  const heading = t("businessPage.builder.preview.reviewsHeading");

  if (count === 0 && quotes.length === 0) {
    return (
      <Section soft>
        <Kicker no={no}>{t("businessPage.builder.preview.kicker.reviews")}</Kicker>
        <Placeholder>{t("businessPage.builder.preview.testimonialsEmpty")}</Placeholder>
      </Section>
    );
  }

  return (
    <Section soft>
      <Kicker no={no}>{t("businessPage.builder.preview.kicker.reviews")}</Kicker>
      {entry.variant === "quote" ? (
        <div className="mx-auto max-w-[42ch] text-center">
          <div className="leading-none" style={{ ...DISPLAY, fontSize: "clamp(40px,9cqw,72px)", color: "color-mix(in oklch, var(--mc-accent) 45%, transparent)" } as CSSProperties} aria-hidden>
            &ldquo;
          </div>
          {count > 0 && (
            <div className="mt-1 flex justify-center">
              <Stars value={rating} size={18} />
            </div>
          )}
          <h2 className="mt-4 text-balance" style={{ ...DISPLAY, fontSize: "clamp(22px,5cqw,38px)", lineHeight: 1.04 }}>
            {heading}
          </h2>
          {count > 0 && (
            <p className="mt-3 text-[11px] uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
              {t("businessPage.builder.preview.reviewsCount", { count })}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-[clamp(20px,5cqw,56px)] gap-y-5">
          {count > 0 && (
            <div className="flex items-baseline gap-3">
              <span style={{ ...DISPLAY, fontSize: "clamp(46px,12cqw,100px)", lineHeight: 0.86 }}>{rating.toFixed(1)}</span>
              <div>
                <Stars value={rating} size={16} />
                <div className="mt-1.5 text-[11px] uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
                  {t("businessPage.builder.preview.reviewsCount", { count })}
                </div>
              </div>
            </div>
          )}
          <h2 className="max-w-[14ch] text-balance" style={{ ...DISPLAY, fontSize: "clamp(22px,4.6cqw,38px)", lineHeight: 1.02 }}>
            {heading}
          </h2>
        </div>
      )}
      {quotes.length > 0 && (
        <div className="mt-[clamp(28px,5cqw,52px)] columns-1 @2xl:columns-2" style={{ columnGap: "clamp(24px,4cqw,56px)" }}>
          {quotes.map((q) => (
            <figure key={q.id} className="mb-[clamp(20px,3cqw,36px)] break-inside-avoid">
              <Stars value={q.rating} size={14} />
              <blockquote
                className="mt-3"
                style={{ ...DISPLAY, fontSize: "clamp(17px,2.4cqw,24px)", lineHeight: 1.34, color: "var(--mc-fg)", fontStyle: italic ? "italic" : "normal" }}
              >
                &ldquo;{q.comment}&rdquo;
              </blockquote>
              <figcaption className="mt-3.5 text-[11.5px]" style={{ ...MONO, color: "var(--mc-muted)" }}>
                — {q.customerName}
                {q.locationName ? ` · ${q.locationName}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
}

// ---- FAQ -----------------------------------------------------------------
function Faq({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const items = data.faq.filter((f) => localized(f.q, data.locale).trim());
  // Accordion preview is non-interactive: the first item reads open, the rest collapsed.
  const list = entry.variant === "list";

  return (
    <Section narrow>
      <SectionHead
        no={no}
        kicker={t("businessPage.builder.preview.kicker.faq")}
        heading={t("businessPage.builder.preview.subhead.faq")}
      />
      {items.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.faqEmpty")}</Placeholder>
      ) : (
        <div className="border-t" style={{ borderColor: "var(--mc-line)" }}>
          {items.map((f, i) => {
            const open = list || i === 0;
            return (
              <div key={i} className="border-b" style={{ borderColor: "var(--mc-line)" }}>
                <div className="flex items-center justify-between gap-4 py-[clamp(14px,2.4cqw,24px)] text-left">
                  <span style={{ ...DISPLAY, fontSize: "clamp(16px,2.7cqw,24px)" }}>{localized(f.q, data.locale)}</span>
                  {!list && (
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform duration-300"
                      style={{
                        borderColor: open ? "var(--mc-accent)" : "var(--mc-line)",
                        background: open ? "var(--mc-accent)" : "transparent",
                        color: open ? "var(--mc-on-accent)" : "var(--mc-fg)",
                        transform: open ? "rotate(45deg)" : "none",
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  )}
                </div>
                {open && localized(f.a, data.locale) && (
                  <p className="-mt-1 max-w-[68ch] pb-[clamp(14px,2.4cqw,24px)] text-[14.5px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
                    {localized(f.a, data.locale)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

// ---- Contact -------------------------------------------------------------
type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
const DAY_KEYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Opening-hours list for the contact section's first location. `workingHours` is loosely typed upstream. */
function Hours({ loc, t }: { loc: LocationWithAssignments; t: T }) {
  const wh = (loc.workingHours ?? {}) as Partial<Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>>;
  return (
    <div>
      <ContactLabel>{t("businessPage.builder.preview.contactHours")}</ContactLabel>
      {DAY_KEYS.map((d) => {
        const day = wh[d];
        const isOpen = !!loc.open247 || !!(day && day.isOpen && day.open && day.close);
        const value = loc.open247
          ? t("businessPage.builder.preview.contactOpen247")
          : day && day.isOpen && day.open && day.close
            ? `${day.open}–${day.close}`
            : t("businessPage.builder.preview.contactClosed");
        return (
          <div key={d} className="flex justify-between gap-[18px] py-1 text-[14px]" style={{ color: "var(--mc-fg)" }}>
            <span>{t(`businessPage.builder.preview.days.${d}`)}</span>
            <span style={{ ...MONO, fontSize: "12.5px", color: "var(--mc-muted)", opacity: isOpen ? 1 : 0.5 }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function Contact({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const loc = data.locations[0];
  const socials = buildSocials(data.social);
  const wh = (loc?.workingHours ?? null) as Partial<Record<DayKey, { isOpen?: boolean }>> | null;
  const hasHours = !!loc && (!!loc.open247 || (wh ? DAY_KEYS.some((d) => wh[d]?.isOpen) : false));
  const hasContact = !!data.email || !!data.phone || socials.length > 0 || !!loc?.address || hasHours;
  const split = entry.variant === "split";

  const heading = (
    <>
      <Kicker no={no}>{t("businessPage.builder.preview.kicker.contact")}</Kicker>
      <h2 className="max-w-[16ch] text-balance" style={{ ...DISPLAY, fontSize: "clamp(26px,6cqw,52px)", lineHeight: 0.98 }}>
        {t("businessPage.builder.preview.contactHeading")}
      </h2>
    </>
  );

  const details = !hasContact ? (
    <Placeholder>{t("businessPage.builder.preview.contactEmpty")}</Placeholder>
  ) : (
    <div className={cn("grid gap-[clamp(18px,3cqw,40px)]", split ? "grid-cols-1" : "[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]")}>
      {loc?.address && (
        <div>
          <ContactLabel>{t("businessPage.builder.preview.contactAddress")}</ContactLabel>
          <p className="text-[14.5px] leading-relaxed">{loc.address}</p>
        </div>
      )}
      {(data.email || data.phone) && (
        <div>
          <ContactLabel>{t("businessPage.builder.preview.contactReach")}</ContactLabel>
          {data.phone && <p className="text-[14.5px] leading-relaxed">{data.phone}</p>}
          {data.email && <p className="text-[14.5px] leading-relaxed">{data.email}</p>}
        </div>
      )}
      {socials.length > 0 && (
        <div>
          <ContactLabel>{t("businessPage.builder.preview.contactFollow")}</ContactLabel>
          <div className="flex flex-wrap gap-2">
            {socials.map(({ Icon, key }) => (
              <span
                key={key}
                className="flex h-8 w-8 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--mc-line)", color: "var(--mc-ink)" }}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
              </span>
            ))}
          </div>
        </div>
      )}
      {hasHours && loc && <Hours loc={loc} t={t} />}
    </div>
  );

  // Split — heading/CTA column beside the details column. Simple — heading row, CTA right, details below.
  if (split) {
    return (
      <Section soft>
        <div className="grid items-start gap-[clamp(22px,4cqw,52px)] [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <div>
            {heading}
            <div className="mt-5">
              <BookButton label={t("businessPage.builder.preview.book")} tone="accent" />
            </div>
          </div>
          {details}
        </div>
      </Section>
    );
  }

  return (
    <Section soft>
      <div className="mb-[clamp(20px,4cqw,40px)] flex flex-wrap items-end justify-between gap-4">
        <div>{heading}</div>
        <BookButton label={t("businessPage.builder.preview.book")} tone="accent" />
      </div>
      {details}
    </Section>
  );
}

// ---- Announcement --------------------------------------------------------
/** Full-bleed ribbon above the nav: accent dot · message · mono CTA, with a dismiss affordance
 *  pinned to the trailing edge (decorative in the preview; the live page wires it to dismissal). */
function AnnouncementBar({ data, t, sample = false }: { data: PreviewData; t: T; sample?: boolean }) {
  const realMsg = localized(data.announcement.message, data.locale);
  const cta = data.announcement.cta;
  const realCtaLabel = localized(cta.label, data.locale);
  const isEmpty = !realMsg.trim();

  // Live behaviour: an empty bar isn't shown. In the per-section editor preview we instead render a
  // muted SAMPLE so the owner can see how the bar will look — a suggestion, not their real content.
  if (isEmpty && !sample) return null;

  const msg = isEmpty ? t("businessPage.builder.announcement.sampleMessage") : realMsg;
  const ctaLabel = isEmpty ? t("businessPage.builder.announcement.sampleCta") : realCtaLabel;
  const showCta = isEmpty || (cta.enabled && realCtaLabel.trim().length > 0);
  const showArrow = isEmpty ? true : cta.showArrow;

  return (
    <div
      className={cn(
        "relative flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 px-10 py-2.5 text-center text-[12.5px] leading-snug",
        isEmpty && "opacity-60",
      )}
      style={{ background: "var(--mc-fg)", color: "var(--mc-bg)" }}
    >
      <span className="inline-flex items-center gap-2.5">
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: "var(--mc-accent)" }}
          aria-hidden
        />
        <span className="opacity-90">{msg}</span>
      </span>
      {showCta && (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em]">
          {ctaLabel}
          {showArrow && (
            <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          )}
        </span>
      )}
      <X
        className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-45"
        strokeWidth={1.75}
        aria-hidden
      />
    </div>
  );
}

// ---- Marquee + Interlude (decorative bands, default-hidden) --------------

/** Fewest items the marquee needs to read as an intentional band rather than a stray label or two. Below
 *  this the section is pointless, so the builder hides it entirely (see SectionBuilder) and it self-hides on
 *  render — both gate on `marqueeItems` so they can never disagree. */
export const MARQUEE_MIN_ITEMS = 3;

/** The strip's content for a business: the specific offerings (deduped service names), falling back to the
 *  broader categories when only a couple of services are listed, capped so a service-heavy menu stays calm. */
export function marqueeItems(locations: LocationWithAssignments[]): string[] {
  const svcSeen = new Set<string>();
  const services: string[] = [];
  const catSeen = new Set<string>();
  const categories: string[] = [];
  for (const l of locations) {
    for (const s of l.services ?? []) {
      const name = s.name?.trim();
      if (name && !svcSeen.has(name.toLowerCase())) {
        svcSeen.add(name.toLowerCase());
        services.push(name);
      }
      const cat = s.category?.name?.trim();
      if (cat && !catSeen.has(cat.toLowerCase())) {
        catSeen.add(cat.toLowerCase());
        categories.push(cat);
      }
    }
  }
  return (services.length >= MARQUEE_MIN_ITEMS ? services : categories).slice(0, 16);
}

/** Pixels the scroll-driven band glides per pixel of page scroll (matches the editorial source's coupling). */
const MARQUEE_SCROLL_SPEED = 0.35;

/** Kinetic strip of the services a business offers, in one of two motion modes (the section's variant):
 *  "scroll" (default) glides the band with page scroll — the editorial source's behaviour — and "loop" runs
 *  an always-on auto drift. Loop animates everywhere (CSS). Scroll coupling needs a page to scroll, so it
 *  only applies in the full-page preview; in the scoped one-section card (which can't scroll) the scroll mode
 *  simply sits still — the loop variant is what moves on its own. The track holds three copies of the
 *  (identical) item set, so any translation reads as a seamless periodic loop. */
function Marquee({ data, entry, chrome }: { data: PreviewData; entry: SectionEntry; chrome: boolean }) {
  const items = marqueeItems(data.locations);
  const loopMode = entry.variant === "loop";
  const scrollDriven = chrome && !loopMode;
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollDriven) return;
    const track = trackRef.current;
    if (!track) return;
    // Reduced motion: leave the band still rather than tie movement to scroll (mirrors the hero parallax bail).
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Ride the same scroll container the nav-frost does (the dialog's scroller) — walk up to the first
    // scrollable ancestor.
    let scroller: HTMLElement | null = track.parentElement;
    while (scroller) {
      const oy = getComputedStyle(scroller).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      scroller = scroller.parentElement;
    }
    if (!scroller) return;
    const sc = scroller;
    let setWidth = track.scrollWidth / 3 || 1;
    const ro = new ResizeObserver(() => {
      setWidth = track.scrollWidth / 3 || 1;
    });
    ro.observe(track);
    let raf = 0;
    const update = () => {
      raf = 0;
      // Modulo one set width keeps the offset bounded; the three identical copies make the wrap invisible.
      const off = -((sc.scrollTop * MARQUEE_SCROLL_SPEED) % setWidth);
      track.style.transform = `translateX(${off.toFixed(1)}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      track.style.transform = "";
    };
  }, [scrollDriven, items.length]);

  if (items.length < MARQUEE_MIN_ITEMS) return null;

  const italic = displayFontFor(data.fontKey).italicOk;
  // Three copies so translating by exactly one set width loops seamlessly. In loop mode the glide pace is
  // held constant by scaling the CSS duration with the count (~3s to cross per item — a calm editorial pace).
  const loop = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden" style={{ background: "var(--mc-fg)", color: "var(--mc-bg)" }}>
      <div
        ref={trackRef}
        className={cn(
          "flex w-max items-center whitespace-nowrap py-[clamp(12px,1.7cqw,20px)] [will-change:transform]",
          loopMode && "mc-band-track",
        )}
        style={{ "--mc-band-dur": `${items.length * 3}s` } as CSSProperties}
      >
        {loop.map((it, i) => (
          <span
            key={i}
            className={cn("inline-flex items-center gap-[0.6em] px-[0.45em]", italic && "italic")}
            style={{ ...DISPLAY, fontSize: "clamp(18px,2.6cqw,34px)" }}
          >
            {it}
            <span className="not-italic" style={{ color: "var(--mc-accent)" }} aria-hidden>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Cinematic full-bleed photo break with a short line. Uses a portfolio image beyond the gallery's
 *  first six where possible; self-hides if the business has no photos. */
function Interlude({ data, t }: { data: PreviewData; t: T }) {
  const images = data.locations.flatMap((l) => l.portfolioImages?.map((p) => p.url) ?? []);
  if (images.length === 0) return null;
  const src = images[6] ?? images[images.length - 1];
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const line = data.tagline?.trim() || name;
  const city = data.locations.find((l) => l.addressComponents?.city)?.addressComponents?.city;

  return (
    <section className="relative isolate flex min-h-[clamp(280px,52cqw,460px)] flex-col justify-end overflow-hidden">
      <img src={src} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, rgba(16,15,14,0.36) 0%, rgba(16,15,14,0.04) 36%, rgba(16,15,14,0.5) 100%)" }}
      />
      <div className="px-[clamp(20px,5cqw,48px)] pb-[clamp(28px,5cqw,52px)] pt-12" style={{ color: "#F4EFE6" }}>
        {city && (
          <p className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-accent)" }}>
            {city}
          </p>
        )}
        <div className="mt-2.5 max-w-[16ch] text-balance" style={{ ...DISPLAY, fontSize: "clamp(28px,7cqw,64px)", lineHeight: 0.98 }}>
          {line}
        </div>
      </div>
    </section>
  );
}

// ---- Chrome (nav + footer) -----------------------------------------------

/** Visible sections that earn an anchor link in the nav, mapped to their kicker label key. */
const NAV_LABELS: Record<string, string> = {
  about: "businessPage.builder.preview.kicker.about",
  locations: "businessPage.builder.preview.kicker.locations",
  gallery: "businessPage.builder.preview.kicker.gallery",
  team: "businessPage.builder.preview.kicker.team",
  testimonials: "businessPage.builder.preview.kicker.reviews",
  contact: "businessPage.builder.preview.kicker.contact",
};

/**
 * Brand lockup · section links · "Get started" CTA. Over the cinematic hero the nav frosts gradually with
 * `progress` (0 = transparent/white over the hero, 1 = translucent blurred paper bar once the hero clears).
 * With no dark hero it is the solid paper bar from the top. Center links hide on a narrow preview width.
 */
function Nav({
  data,
  layout,
  t,
  overHero,
  ctaFrost = false,
  progress,
  navRef,
  marginBottom,
  sticky = true,
}: {
  data: PreviewData;
  layout: SectionEntry[];
  t: T;
  overHero: boolean;
  /** Over a drenched (accent-coloured) hero, frost the CTA white→accent so it doesn't blend into the field. */
  ctaFrost?: boolean;
  progress: number;
  navRef: Ref<HTMLElement>;
  marginBottom: number;
  /** False when wrapped in the announcement+nav sticky group (the wrapper owns the sticky). */
  sticky?: boolean;
}) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const mark = name.trim().charAt(0).toUpperCase() || "•";
  const links = layout
    .filter((s) => s.visible && NAV_LABELS[s.type])
    .map((s) => ({ type: s.type, label: t(NAV_LABELS[s.type]) }));

  // Floats transparently over every photo/accent hero and frosts on scroll. Below the @xl link breakpoint
  // the center links drop away and the bar carries just the brand + the booking CTA (the editorial source
  // has no mobile menu — it stays a single scroll), so nothing here needs an open/closed state.
  const asFloating = overHero;

  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const pc = (x: number) => `${(x * 100).toFixed(1)}%`;
  // Warm paper tint + dark text arrive fast (front-loaded, done within FROST_TINT_AT) so the bar is legible
  // the moment it frosts — no muddy half-lit dwell. Blur depth ramps gradually over the full scroll.
  const tint = overHero ? 1 - Math.pow(1 - Math.min(1, progress / FROST_TINT_AT), 3) : 1;
  const blurP = overHero ? 1 - (1 - progress) * (1 - progress) : 1;
  const blur = blurP > 0.001 ? `blur(${(18 * blurP).toFixed(2)}px) saturate(${(100 + 50 * blurP).toFixed(0)}%)` : undefined;

  const skin: CSSProperties = asFloating
    ? {
        backgroundColor: `color-mix(in oklch, var(--mc-bg) ${(82 * tint).toFixed(1)}%, transparent)`,
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        boxShadow: `0 1px 0 color-mix(in oklch, var(--mc-line), transparent ${pc(1 - tint)})`,
      }
    : { backgroundColor: "var(--mc-bg)", borderBottom: "1px solid var(--mc-line)" };

  const fg = asFloating ? `color-mix(in oklch, #fff, var(--mc-fg) ${pc(tint)})` : "var(--mc-fg)";
  const txShadow = asFloating && tint < 1 ? `0 1px 14px rgba(0,0,0,${(0.35 * (1 - tint)).toFixed(3)})` : undefined;
  const markColor = asFloating ? `color-mix(in oklch, #fff, var(--mc-accent) ${pc(tint)})` : "var(--mc-accent)";
  const markBorder = asFloating
    ? `color-mix(in oklch, rgba(255,255,255,0.6), color-mix(in oklch, var(--mc-accent) 48%, var(--mc-line)) ${pc(tint)})`
    : "color-mix(in oklch, var(--mc-accent) 48%, var(--mc-line))";
  const ringColor = asFloating ? `color-mix(in oklch, rgba(255,255,255,0.4), rgba(0,0,0,0.1) ${pc(tint)})` : "rgba(0,0,0,0.1)";
  // Over the drenched field the CTA frosts with everything else: a white pill / ink text at rest (legible
  // on the accent), resolving to the accent pill / warm-white once the bar settles onto paper.
  const ctaStyle: CSSProperties | undefined =
    overHero && ctaFrost
      ? {
          // Settle on the AA-safe deepened accent (warm-white clears ~4.8:1 vs ~4.2:1 on the raw hue).
          background: `color-mix(in oklch, #fff, var(--mc-accent-field) ${pc(tint)})`,
          // Snap the label across the bg's light→dark crossover (≈0.6) rather than crossfading through it,
          // so it never collapses to ~1:1 mid-scroll; the 140ms transition keeps the flip smooth.
          color: tint < 0.6 ? "var(--mc-ink)" : "var(--mc-on-accent)",
          transition: `background-color 140ms ${EASE}, color 140ms ${EASE}`,
        }
      : undefined;
  // Over a hero the links sit at full opacity (so white clears AA on the drenched field / dark cover) and
  // only soften once the bar settles onto paper. The solid paper bar keeps the calm 0.7.
  const linkOpacity = overHero ? 1 - 0.3 * tint : 0.7;
  // Short transition only smooths the per-frame quantization — short enough to still track the scroll.
  const txt = overHero ? `color 140ms ${EASE}, text-shadow 140ms ${EASE}, border-color 140ms ${EASE}, box-shadow 140ms ${EASE}` : undefined;
  const chromeTrans = overHero
    ? `background-color 140ms ${EASE}, backdrop-filter 140ms ${EASE}, -webkit-backdrop-filter 140ms ${EASE}, box-shadow 140ms ${EASE}`
    : undefined;

  return (
    <nav
      ref={navRef}
      className={cn(
        sticky ? "sticky top-0" : "relative",
        // Below the @xl link breakpoint the center links drop away, so the grid loses its center track:
        // brand (1fr) keeps the row and the CTA sits flush right; the third track returns with the links.
        "z-30 grid grid-cols-[1fr_auto] items-center gap-[clamp(16px,4.5cqw,40px)] px-[clamp(18px,6cqw,56px)] py-4 @xl:grid-cols-[1fr_auto_1fr]",
      )}
      style={{ marginBottom, transition: chromeTrans, ...skin }}
    >
      <span className="flex min-w-0 items-center gap-3">
        {data.logo ? (
          <img
            src={data.logo}
            alt=""
            className="h-[44px] w-[44px] shrink-0 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 1px ${ringColor}`, transition: txt }}
          />
        ) : (
          <span
            className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full text-[22px] leading-none"
            style={{
              ...DISPLAY,
              color: markColor,
              border: `1px solid ${markBorder}`,
              transition: txt,
            } as CSSProperties}
          >
            {mark}
          </span>
        )}
        <span className="min-w-0 truncate leading-none" style={{ ...DISPLAY, fontSize: "clamp(21px,3.4cqw,27px)", color: fg, textShadow: txShadow, transition: txt }}>
          {name}
        </span>
      </span>

      <div className="hidden items-center gap-[clamp(18px,3cqw,34px)] justify-self-center @xl:flex">
        {links.map((l) => (
          <span
            key={l.type}
            className="whitespace-nowrap text-[11.5px] font-semibold uppercase"
            style={{ letterSpacing: "0.13em", color: fg, opacity: linkOpacity, textShadow: txShadow, transition: txt }}
          >
            {l.label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-self-end">
        <BookButton label={t("businessPage.builder.preview.getStarted")} tone="accent" size="nav" styleOverride={ctaStyle} />
      </div>
    </nav>
  );
}

/** Big closing wordmark + Book CTA, then locations / now-viewing / follow columns, and a Zavoia credit. */
function Footer({ data, t }: { data: PreviewData; t: T }) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const loc = data.locations[0];
  const socials = buildSocials(data.social);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t px-[clamp(20px,5cqw,48px)] pb-9 pt-[clamp(40px,7cqw,80px)]" style={{ borderColor: "var(--mc-line)" }}>
      <div className="mx-auto w-full max-w-[860px]">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b pb-[clamp(28px,5cqw,52px)]" style={{ borderColor: "var(--mc-line)" }}>
          <div className="leading-[0.9]" style={{ ...DISPLAY, fontSize: "clamp(34px,11cqw,88px)", color: "var(--mc-fg)" }}>
            {name}
          </div>
          <BookButton label={t("businessPage.builder.preview.book")} tone="accent" size="lg" />
        </div>

        <div className="mt-[clamp(26px,4cqw,46px)] grid gap-[clamp(18px,3cqw,28px)] [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
          {data.locations.length > 0 && (
            <div>
              <ContactLabel>{t("businessPage.builder.preview.kicker.locations")}</ContactLabel>
              {data.locations.map((l) => {
                const lc = l.addressComponents?.city;
                return (
                  <p key={l.id} className="text-[13.5px] leading-relaxed">
                    {l.name}
                    {lc ? ` — ${lc}` : ""}
                  </p>
                );
              })}
            </div>
          )}
          {loc && (
            <div>
              <ContactLabel>{t("businessPage.builder.preview.footer.nowViewing")}</ContactLabel>
              {loc.address && <p className="text-[13.5px] leading-relaxed">{loc.address}</p>}
              {(data.phone || loc.phone) && (
                <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
                  {data.phone || loc.phone}
                </p>
              )}
            </div>
          )}
          {socials.length > 0 && (
            <div>
              <ContactLabel>{t("businessPage.builder.preview.contactFollow")}</ContactLabel>
              {socials.map((s) => (
                <p key={s.key} className="text-[13.5px] leading-relaxed">
                  {s.label}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-[11.5px]" style={{ ...MONO, color: "var(--mc-muted)" }}>
          <span>{t("businessPage.builder.preview.footer.rights", { year, name })}</span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" strokeWidth={1.6} style={{ color: "var(--mc-accent)" }} />
            {t("businessPage.builder.preview.footer.poweredBy")}
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Owner's social links, in display order, dropping any that aren't set. Shared by Footer + Contact. */
function buildSocials(social: PreviewData["social"]): { key: string; label: string; url: string; Icon: LucideIcon }[] {
  const all: { key: string; label: string; url?: string | null; Icon: LucideIcon }[] = [
    { key: "instagram", label: "Instagram", url: social.instagram, Icon: Instagram },
    { key: "facebook", label: "Facebook", url: social.facebook, Icon: Facebook },
    { key: "tiktok", label: "TikTok", url: social.tiktok, Icon: Music2 },
    { key: "website", label: "Website", url: social.website, Icon: Globe },
    { key: "pinterest", label: "Pinterest", url: social.pinterest, Icon: Link2 },
  ];
  return all.filter((s): s is { key: string; label: string; url: string; Icon: LucideIcon } => !!s.url);
}

// ---- shared bits ---------------------------------------------------------
function Section({ children, soft, narrow }: { children: React.ReactNode; soft?: boolean; narrow?: boolean }) {
  return (
    <section
      className="px-[clamp(20px,5cqw,48px)] py-[clamp(40px,7cqw,76px)]"
      style={soft ? { background: "var(--mc-soft)" } : undefined}
    >
      <div className={cn("mx-auto w-full", narrow ? "max-w-[940px]" : "max-w-[1320px]")}>{children}</div>
    </section>
  );
}

function Kicker({ no, children }: { no?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-ink)" }}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {no && <span>{no}</span>}
      {no && <span aria-hidden>—</span>}
      <span>{children}</span>
    </div>
  );
}

/**
 * Section header — numbered kicker + display heading on the left, an optional muted sublede on the
 * right. Mirrors the microsite's `.mc-shead`; shared by Locations, Gallery, Team, FAQ, Reviews, Contact.
 * `stacked` switches to the design's single-column variant (kicker → large heading → sublede below),
 * used by Locations (`#locations .mc-shead` / `.lb-locx-sublede`).
 */
function SectionHead({ no, kicker, heading, sublede, stacked }: { no?: string; kicker: string; heading: string; sublede?: string; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="mb-[clamp(24px,4.5cqw,52px)]">
        <Kicker no={no}>{kicker}</Kicker>
        <h2 className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(34px,7cqw,68px)", lineHeight: 0.98 }}>
          {heading}
        </h2>
        {sublede && (
          <p className="mt-[clamp(14px,2.2cqw,20px)] max-w-[540px] text-[clamp(14px,1.7cqw,16px)] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
            {sublede}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="mb-[clamp(20px,4cqw,44px)] flex flex-wrap items-end justify-between gap-x-[clamp(16px,3cqw,40px)] gap-y-3">
      <div className="max-w-[22ch]">
        <Kicker no={no}>{kicker}</Kicker>
        <h2 className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(26px,6cqw,52px)", lineHeight: 0.98 }}>
          {heading}
        </h2>
      </div>
      {sublede && (
        <p className="max-w-[300px] text-[14px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
          {sublede}
        </p>
      )}
    </div>
  );
}

function Caption({ index }: { index: number }) {
  return (
    <figcaption className="mt-2.5 flex items-center justify-between gap-3 text-[10.5px]" style={{ ...MONO, color: "var(--mc-muted)", letterSpacing: "0.04em" }}>
      <span />
      <span>{String(index).padStart(2, "0")}</span>
    </figcaption>
  );
}

function ContactLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-muted)" }}>
      {children}
    </div>
  );
}

function Placeholder({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-[13.5px]"
      style={{ borderColor: "var(--mc-line)", background: "color-mix(in oklch, var(--mc-fg) 2%, transparent)", color: "var(--mc-muted)" } as CSSProperties}
    >
      {icon}
      {children}
    </div>
  );
}

function BookButton({ label, tone, size = "md", styleOverride }: { label: string; tone: "accent" | "paper"; size?: "sm" | "md" | "lg" | "nav"; styleOverride?: CSSProperties }) {
  const style: CSSProperties = {
    // Accent fills use the AA-safe deepened accent (--mc-accent-field) so warm-white labels clear 4.5:1 even
    // on the lightest swatches (raw terracotta/amber sit at ~4.2:1). Identical to --mc-accent for the other 6.
    ...(tone === "paper"
      ? { background: "#fff", color: "var(--mc-ink)" }
      : { background: "var(--mc-accent-field)", color: "var(--mc-on-accent)" }),
    ...styleOverride,
  };
  const sizing =
    size === "sm"
      ? "px-4 py-2 text-[12.5px]"
      : size === "lg"
        ? "px-6 py-3 text-[14.5px]"
        : size === "nav"
          ? "px-[22px] py-3 text-[14px]" // matches the microsite .mc-btn nav CTA (no resting shadow)
          : "px-5 py-2.5 text-[13.5px]";
  return (
    <span
      className={cn("pointer-events-none inline-flex items-center gap-2 rounded-full font-semibold", size !== "nav" && "shadow-sm", sizing)}
      style={style}
    >
      {label}
      {/* Nav CTA is text-only, matching the microsite `.mc-btn` in the header; hero/footer keep the arrow. */}
      {size !== "nav" && <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />}
    </span>
  );
}

function Stars({ value, size = 14, color, empty }: { value: number; size?: number; color?: string; empty?: string }) {
  const on = color ?? "var(--mc-accent)";
  const off = empty ?? "color-mix(in oklch, var(--mc-fg) 20%, transparent)";
  const rounded = Math.round(value);
  return (
    <span className="inline-flex" style={{ gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} style={{ width: size, height: size, color: i < rounded ? on : off }} fill={i < rounded ? on : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function dedupeTeam<TMember extends { id: number }>(members: TMember[]): TMember[] {
  const seen = new Set<number>();
  return members.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}

export default LivePreview;
