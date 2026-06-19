import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Instagram,
  Facebook,
  Globe,
  Music2,
  Link2,
  ImageOff,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type {
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
} from "../../../types";
import { previewVars, displayFontFor } from "./theme";
import { isKnownSectionType } from "./sectionCatalog";
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
  /** Section currently open in the inspector — gets a calm highlight so the owner sees what they edit. */
  selectedType?: string | null;
  /**
   * Render the site chrome (fixed nav + editorial footer) around the sections — true for the full-page
   * preview, false for the per-section scoped card (where a single section is shown on its own).
   */
  chrome?: boolean;
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
const UNNUMBERED = new Set<string>(["hero", "announcement", "marquee", "interlude"]);

/**
 * Faithful, scaled-down render of the public "lookbook" microsite — a warm paper canvas, editorial
 * serif display, mono numbered kickers, and a single brand accent. Sections render in layout order
 * from the owner's real data; booking/links are inert (this is a preview) and empty content shows
 * calm placeholders. Fluid type keys off the preview's own width via container-query units, so the
 * same component reads well in the small per-section card and the full-page dialog alike.
 */
function LivePreviewImpl({ layout, data, selectedType, chrome = true }: LivePreviewProps) {
  const { t } = useTranslation("marketplace");
  const visible = layout.filter((s) => s.visible);

  const bar = visible.find((s) => s.type === "announcement" && s.variant === "bar");
  const stacked = visible.filter((s) => !(s.type === "announcement" && s.variant === "bar"));

  // The nav floats transparently over a cinematic (full-bleed, dark cover) hero, exactly as the microsite
  // does. Only legible over that dark cover, so any other lead section (split/minimal hero, a non-hero, or
  // an announcement bar above the nav) falls back to the solid paper bar.
  const first = stacked[0];
  const overHero =
    !bar &&
    first?.type === "hero" &&
    !!data.heroImageUrl &&
    first.variant !== "split" &&
    first.variant !== "minimal";

  // Scroll chrome: the nav sticks to the dialog's scroll container and cross-fades to a blurred paper bar
  // once the hero has scrolled past. `navH` lets the nav give back its flow height (negative margin) so it
  // overlays the hero instead of sitting above it.
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [navH, setNavH] = useState(0);
  const [past, setPast] = useState(false);

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
      setPast(false);
      return;
    }
    const nav = navRef.current;
    const hero = heroRef.current;
    if (!nav || !hero) return;
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
      // Flip to the blurred paper bar only once the hero has fully scrolled up behind the nav. Compare
      // live rects (not cached offsetHeight) so it can't trip early on a stale/zero height measurement —
      // the nav stays transparent over the whole hero, then switches at its bottom edge.
      setPast(hero.getBoundingClientRect().bottom <= nav.getBoundingClientRect().bottom);
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
  let n = 0;

  return (
    <div
      className={chrome ? "" : "overflow-hidden rounded-xl ring-1 ring-black/5"}
      style={{ ...previewVars(data.brandColor, data.fontKey), backgroundColor: "var(--mc-bg)", containerType: "inline-size" } as CSSProperties}
    >
      {bar && <AnnouncementBar data={data} />}
      {chrome && stacked.length > 0 && (
        <Nav
          data={data}
          layout={layout}
          t={t}
          overHero={overHero}
          past={past}
          navRef={navRef}
          marginBottom={overHero ? -navH : 0}
        />
      )}
      {stacked.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm" style={{ color: "var(--mc-muted)" }}>
          {t("businessPage.builder.preview.allHidden")}
        </div>
      ) : (
        stacked.map((s, i) => {
          if (!UNNUMBERED.has(s.type)) n += 1;
          const no = UNNUMBERED.has(s.type) ? "" : String(n).padStart(2, "0");
          return (
            <div
              key={s.type}
              ref={overHero && i === 0 ? heroRef : undefined}
              className="relative"
              style={
                selectedType === s.type
                  ? ({
                      outline: "2px solid var(--mc-accent)",
                      outlineOffset: "-2px",
                    } as CSSProperties)
                  : undefined
              }
            >
              <SectionView entry={s} data={data} t={t} no={no} />
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
 * preview when its `data`/`layout`/`selectedType` props actually change. SectionBuilder memoises
 * `previewData` to keep that reference stable.
 */
export const LivePreview = memo(LivePreviewImpl);

// ---------------------------------------------------------------------------

function SectionView({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  if (!isKnownSectionType(entry.type)) return null; // unknown stored type → skipped on the public side
  switch (entry.type) {
    case "announcement":
      return <AnnouncementInline data={data} />;
    case "hero":
      return <Hero entry={entry} data={data} t={t} />;
    case "marquee":
      return <Marquee data={data} />;
    case "interlude":
      return <Interlude data={data} t={t} />;
    case "about":
      return <About entry={entry} data={data} t={t} no={no} />;
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

/** Split long About copy into a serif lede (opening line) + a muted body (the rest). */
function splitLede(text: string): { lede: string; body: string } {
  const clean = text.trim();
  if (clean.length <= 180) return { lede: clean, body: "" };
  const para = clean.indexOf("\n\n");
  if (para > 40 && para < 260) return { lede: clean.slice(0, para).trim(), body: clean.slice(para).trim() };
  const dot = clean.indexOf(". ", 80);
  if (dot > 0 && dot < 220) return { lede: clean.slice(0, dot + 1).trim(), body: clean.slice(dot + 1).trim() };
  return { lede: clean.slice(0, 170).trim() + "…", body: clean.slice(170).trim() };
}

// ---- Hero ----------------------------------------------------------------
function Hero({ entry, data, t }: { entry: SectionEntry; data: PreviewData; t: T }) {
  const { rating, count } = aggregateReviews(data.locations);
  const city = data.locations.find((l) => l.addressComponents?.city)?.addressComponents?.city;
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  // Brand eyebrow — primary city, else the location count. No fabricated "Est. {year}": there is no
  // establishment-date field, and the account-creation date would misrepresent it. The brand lockup
  // (logo + wordmark) lives in the nav, mirroring the microsite hero, which is image + name only.
  const eyebrow =
    city || (data.locations.length > 0 ? t("businessPage.builder.preview.locationCount", { count: data.locations.length }) : "");

  const Rating =
    count > 0 ? (
      <div className="flex items-center gap-2.5" style={{ color: "#fff" }}>
        <span style={{ ...DISPLAY, fontSize: "clamp(28px,6cqw,40px)", lineHeight: 0.85 }}>
          {rating.toFixed(1)}
        </span>
        <span className="flex flex-col gap-1">
          <Stars value={rating} size={12} color="#fff" empty="rgba(255,255,255,0.34)" />
          <span className="text-[10px] uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "rgba(255,255,255,0.82)" }}>
            {t("businessPage.builder.preview.reviewsCount", { count })}
          </span>
        </span>
      </div>
    ) : null;

  // Cinematic full-bleed cover — the default "centered" treatment when a cover image exists.
  if (data.heroImageUrl && entry.variant !== "split" && entry.variant !== "minimal") {
    return (
      <header className="relative isolate flex min-h-[clamp(360px,72cqw,620px)] flex-col justify-end overflow-hidden">
        <img src={data.heroImageUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(20,16,14,0.62) 0%, rgba(20,16,14,0.42) 18%, rgba(20,16,14,0.34) 42%, rgba(20,16,14,0.38) 62%, rgba(20,16,14,0.84) 100%)" }}
        />
        <div className="px-[clamp(20px,5cqw,48px)] pb-[clamp(28px,5cqw,52px)] pt-12 text-white">
          {eyebrow && (
            <p className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.18em", color: "rgba(255,255,255,0.9)" }}>
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2.5 max-w-[14ch] text-balance" style={{ ...DISPLAY, fontSize: "clamp(34px,9.5cqw,72px)", lineHeight: 0.96 }}>
            {name}
          </h1>
          {data.tagline && (
            <p className="mt-3 max-w-[42ch] text-[clamp(13px,1.9cqw,18px)] leading-snug" style={{ color: "rgba(255,255,255,0.9)" }}>
              {data.tagline}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            {Rating}
            <BookButton label={t("businessPage.builder.preview.book")} tone="paper" />
          </div>
        </div>
        {/* Scroll cue — the full-page preview scrolls in the dialog, so this reads truthfully. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex flex-col items-center gap-1.5 text-[9px] uppercase"
          style={{ ...MONO, letterSpacing: "0.2em", color: "rgba(255,255,255,0.78)" }}
        >
          {t("businessPage.builder.preview.hero.scrollCue")}
          <span className="h-6 w-px" style={{ background: "rgba(255,255,255,0.5)" }} />
        </div>
      </header>
    );
  }

  // Split — editorial paper column beside the cover image.
  if (entry.variant === "split" && data.heroImageUrl) {
    return (
      <header className="grid [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        <div className="flex flex-col justify-center px-[clamp(20px,5cqw,44px)] py-[clamp(36px,6cqw,64px)]">
          {eyebrow && (
            <p className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.18em", color: "var(--mc-ink)" }}>
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 text-balance" style={{ ...DISPLAY, fontSize: "clamp(26px,6cqw,46px)", lineHeight: 0.98 }}>
            {name}
          </h1>
          {data.tagline && (
            <p className="mt-3 max-w-[40ch] text-[14.5px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
              {data.tagline}
            </p>
          )}
          <div className="mt-5">
            <BookButton label={t("businessPage.builder.preview.book")} tone="accent" />
          </div>
        </div>
        <div className="min-h-[240px] bg-cover bg-center" style={{ backgroundImage: `url(${data.heroImageUrl})` }} />
      </header>
    );
  }

  // Minimal / no image — paper hero, editorial left-aligned lockup.
  return (
    <header
      className="px-[clamp(20px,5cqw,48px)] py-[clamp(44px,8cqw,80px)]"
      style={{ background: "linear-gradient(180deg, color-mix(in oklch, var(--mc-accent) 6%, var(--mc-bg)), var(--mc-bg))" }}
    >
      {eyebrow && (
        <p className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.18em", color: "var(--mc-ink)" }}>
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2.5 max-w-[16ch] text-balance" style={{ ...DISPLAY, fontSize: "clamp(30px,8cqw,58px)", lineHeight: 0.98 }}>
        {name}
      </h1>
      {data.tagline && (
        <p className="mt-4 max-w-[46ch] text-[clamp(14px,2cqw,18px)] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
          {data.tagline}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {count > 0 && (
          <div className="flex items-center gap-2.5">
            <span style={{ ...DISPLAY, fontSize: "clamp(24px,5cqw,38px)", lineHeight: 0.85 }}>{rating.toFixed(1)}</span>
            <span className="flex flex-col gap-1">
              <Stars value={rating} size={12} />
              <span className="text-[10px] uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
                {t("businessPage.builder.preview.reviewsCount", { count })}
              </span>
            </span>
          </div>
        )}
        <BookButton label={t("businessPage.builder.preview.book")} tone="accent" />
      </div>
    </header>
  );
}

// ---- About ---------------------------------------------------------------
function About({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const { rating, count } = aggregateReviews(data.locations);
  const teamCount = dedupeTeam(data.locations.flatMap((l) => l.teamMembers ?? [])).length;
  const body = data.aboutContent?.trim() ?? "";
  const { lede, body: rest } = body ? splitLede(body) : { lede: "", body: "" };

  const stats = [
    data.locations.length > 0 && { n: String(data.locations.length), label: t("businessPage.builder.preview.kicker.locations") },
    teamCount > 0 && { n: String(teamCount), label: t("businessPage.builder.preview.kicker.team") },
    count > 0 && { n: count >= 1000 ? `${Math.round(count / 100) / 10}k` : String(count), label: t("businessPage.builder.preview.kicker.reviews") },
    count > 0 && { n: rating.toFixed(1), label: t("businessPage.builder.preview.statRating") },
  ].filter(Boolean) as { n: string; label: string }[];

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
    <Placeholder>{t("businessPage.builder.preview.aboutEmpty")}</Placeholder>
  );

  return (
    <Section>
      {entry.variant === "imageLeft" && data.heroImageUrl ? (
        <>
          <Kicker no={no}>{t("businessPage.builder.preview.kicker.about")}</Kicker>
          <div className="grid items-start gap-[clamp(18px,3cqw,44px)] [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <img src={data.heroImageUrl} alt="" className="w-full rounded-md object-cover [aspect-ratio:4/5]" />
            <div>{Copy}</div>
          </div>
        </>
      ) : (
        // Editorial split — the numbered kicker in a slim left rail, lede + body in the wide column.
        <div className="grid items-start gap-[clamp(18px,3.5cqw,56px)] [grid-template-columns:minmax(0,0.7fr)_minmax(0,2.3fr)]">
          <Kicker no={no}>{t("businessPage.builder.preview.kicker.about")}</Kicker>
          <div>{Copy}</div>
        </div>
      )}
      {stats.length > 0 && (
        <div
          className="mt-[clamp(28px,5cqw,56px)] grid gap-5 border-t pt-7 [grid-template-columns:repeat(auto-fit,minmax(110px,1fr))]"
          style={{ borderColor: "var(--mc-line)" }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{ ...DISPLAY, fontSize: "clamp(24px,4.6cqw,42px)", lineHeight: 1 }}>{s.n}</div>
              <div className="mt-1.5 text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.1em", color: "var(--mc-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ---- Locations -----------------------------------------------------------
function Locations({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const hidden = new Set((entry.config?.hiddenLocationIds as number[] | undefined) ?? []);
  const shown = data.locations.filter((l) => !hidden.has(l.id));
  const list = entry.variant === "list";

  return (
    <Section soft>
      <SectionHead
        no={no}
        kicker={t("businessPage.builder.preview.kicker.locations")}
        heading={t("businessPage.builder.preview.subhead.locations")}
        sublede={t("businessPage.builder.preview.sublede.locations")}
      />
      {shown.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.locationsEmpty")}</Placeholder>
      ) : (
        <div
          className={cn(
            "grid gap-[clamp(12px,2cqw,22px)]",
            list ? "grid-cols-1" : "[grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]",
          )}
        >
          {shown.map((l) => {
            const photo = locationPhoto(l);
            return (
              <div
                key={l.id}
                className={cn(
                  "group/loc overflow-hidden rounded-lg border transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.2,.7,.3,1)] hover:-translate-y-0.5",
                  list && "flex items-stretch",
                )}
                style={{ borderColor: "var(--mc-line)", background: "var(--mc-card)" }}
              >
                {photo && (
                  <div className={cn("overflow-hidden", list ? "w-28 shrink-0" : "[aspect-ratio:4/3]")}>
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.7,.3,1)] group-hover/loc:scale-[1.04]"
                    />
                  </div>
                )}
                <div className="flex-1 px-4 pb-4 pt-3.5">
                  <div className="flex items-baseline gap-2" style={{ ...DISPLAY, fontSize: "clamp(17px,2.8cqw,23px)" }}>
                    <span className="truncate">{l.name}</span>
                  </div>
                  <p className="mt-1 flex items-start gap-1 text-[12.5px] leading-snug" style={{ color: "var(--mc-muted)" }}>
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.6} />
                    <span className="line-clamp-2">{l.address || t("businessPage.builder.preview.noAddress")}</span>
                  </p>
                  <div className="mt-3.5 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--mc-line)" }}>
                    {(l.totalReviews ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                        <Star className="h-3.5 w-3.5" style={{ color: "var(--mc-accent)" }} fill="var(--mc-accent)" />
                        {(l.averageRating ?? 0).toFixed(1)}
                        <span style={{ color: "var(--mc-muted)", fontWeight: 400 }}>· {l.totalReviews}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: "var(--mc-ink)" }}>
                      {t("businessPage.builder.preview.book")}
                      <ArrowRight className="h-3 w-3" strokeWidth={2} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
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
function AnnouncementBar({ data }: { data: PreviewData }) {
  const msg = localized(data.announcement.message, data.locale);
  if (!msg.trim()) return null;
  return (
    <div className="flex items-center justify-center gap-3 px-5 py-2.5 text-center text-[12.5px]" style={{ background: "var(--mc-fg)", color: "var(--mc-bg)" }}>
      <span>{msg}</span>
      {data.announcement.link && <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
    </div>
  );
}

function AnnouncementInline({ data }: { data: PreviewData }) {
  const msg = localized(data.announcement.message, data.locale);
  if (!msg.trim()) return null;
  return (
    <Section>
      <div
        className="flex items-center justify-center gap-3 rounded-lg px-5 py-4 text-center text-[15px] font-semibold"
        style={{ background: "color-mix(in oklch, var(--mc-accent) 10%, var(--mc-bg))", color: "var(--mc-ink)" } as CSSProperties}
      >
        <span>{msg}</span>
        {data.announcement.link && <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2} />}
      </div>
    </Section>
  );
}

// ---- Marquee + Interlude (decorative bands, default-hidden) --------------

/** Kinetic-looking strip of service categories. Rendered static (the contained preview has no scroll
 *  clock); self-hides when there are too few categories to read as an intentional band. */
function Marquee({ data }: { data: PreviewData }) {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const l of data.locations) {
    for (const s of l.services ?? []) {
      const name = s.category?.name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        items.push(name);
      }
    }
  }
  if (items.length < 3) return null;
  const italic = displayFontFor(data.fontKey).italicOk;

  return (
    <div className="overflow-hidden" style={{ background: "var(--mc-fg)", color: "var(--mc-bg)" }}>
      <div className="flex items-center whitespace-nowrap py-[clamp(12px,1.7cqw,20px)]">
        {items.map((it, i) => (
          <span
            key={it}
            className={cn("inline-flex items-center gap-[0.6em] px-[0.45em]", italic && "italic")}
            style={{ ...DISPLAY, fontSize: "clamp(18px,2.6cqw,34px)" }}
          >
            {it}
            {i < items.length - 1 && (
              <span className="not-italic" style={{ color: "var(--mc-accent)" }} aria-hidden>
                ·
              </span>
            )}
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
 * Brand lockup (logo + wordmark + city/locations subtitle) · section links · "Get started" CTA. Mirrors
 * the microsite nav: it sticks to the preview's scroll container and lives in one of two skins —
 * transparent with white text while it floats over the cinematic hero (`onHero`), then a translucent
 * blurred paper bar once the hero scrolls past (`past`). With no dark hero to sit over it is the solid
 * paper bar from the top. Only colour/background cross-fade; padding (and so the overlay offset) is fixed.
 * Center links hide on a narrow (mobile) preview width.
 */
function Nav({
  data,
  layout,
  t,
  overHero,
  past,
  navRef,
  marginBottom,
}: {
  data: PreviewData;
  layout: SectionEntry[];
  t: T;
  overHero: boolean;
  past: boolean;
  navRef: Ref<HTMLElement>;
  marginBottom: number;
}) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const mark = name.trim().charAt(0).toUpperCase() || "•";
  const city = data.locations.find((l) => l.addressComponents?.city)?.addressComponents?.city;
  const sub =
    city ||
    (data.locations.length > 0
      ? t("businessPage.builder.preview.locationCount", { count: data.locations.length })
      : "");
  const links = layout
    .filter((s) => s.visible && NAV_LABELS[s.type])
    .map((s) => ({ type: s.type, label: t(NAV_LABELS[s.type]) }));

  const onHero = overHero && !past;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  const skin: CSSProperties = onHero
    ? { background: "transparent" }
    : past
      ? {
          background: "color-mix(in oklch, var(--mc-bg) 82%, transparent)",
          backdropFilter: "blur(18px) saturate(150%)",
          WebkitBackdropFilter: "blur(18px) saturate(150%)",
          boxShadow: "0 1px 0 var(--mc-line)",
        }
      : { background: "var(--mc-bg)", borderBottom: "1px solid var(--mc-line)" };

  const fg = onHero ? "#fff" : "var(--mc-fg)";
  const subColor = onHero ? "rgba(255,255,255,0.82)" : "var(--mc-muted)";
  const txShadow = onHero ? "0 1px 14px rgba(0,0,0,0.35)" : undefined;
  const txt = `color 360ms ${EASE}, text-shadow 360ms ${EASE}, border-color 360ms ${EASE}`;

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-[clamp(16px,4.5cqw,40px)] px-[clamp(18px,6cqw,56px)] py-4"
      style={{ marginBottom, transition: `background-color 360ms ${EASE}, box-shadow 360ms ${EASE}`, ...skin }}
    >
      <span className="inline-flex min-w-0 items-center gap-3 justify-self-start">
        {data.logo ? (
          <img
            src={data.logo}
            alt=""
            className={cn("h-[38px] w-[38px] shrink-0 rounded-full object-cover ring-1", onHero ? "ring-white/40" : "ring-black/10")}
          />
        ) : (
          <span
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-[19px] leading-none"
            style={{
              ...DISPLAY,
              color: onHero ? "#fff" : "var(--mc-accent)",
              border: onHero ? "1px solid rgba(255,255,255,0.6)" : "1px solid color-mix(in oklch, var(--mc-accent) 48%, var(--mc-line))",
              transition: txt,
            } as CSSProperties}
          >
            {mark}
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-[3px]">
          <span className="truncate leading-none" style={{ ...DISPLAY, fontSize: "clamp(19px,3cqw,24px)", color: fg, textShadow: txShadow, transition: txt }}>
            {name}
          </span>
          {sub && (
            <span
              className="truncate text-[9.5px] font-semibold uppercase leading-none"
              style={{ ...MONO, letterSpacing: "0.24em", color: subColor, textShadow: onHero ? "0 1px 10px rgba(0,0,0,0.4)" : undefined, transition: txt }}
            >
              {sub}
            </span>
          )}
        </span>
      </span>

      <div className="hidden items-center gap-[clamp(18px,3cqw,34px)] justify-self-center @xl:flex">
        {links.map((l) => (
          <span
            key={l.type}
            className="whitespace-nowrap text-[11.5px] font-semibold uppercase"
            style={{ letterSpacing: "0.13em", color: fg, opacity: 0.7, textShadow: txShadow, transition: txt }}
          >
            {l.label}
          </span>
        ))}
      </div>

      <div className="justify-self-end">
        <BookButton label={t("businessPage.builder.preview.getStarted")} tone="accent" size="nav" />
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
      <div className={cn("mx-auto w-full", narrow ? "max-w-[620px]" : "max-w-[860px]")}>{children}</div>
    </section>
  );
}

function Kicker({ no, children }: { no?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-ink)" }}>
      {no && <span>{no}</span>}
      {no && <span aria-hidden>—</span>}
      <span>{children}</span>
    </div>
  );
}

/**
 * Section header — numbered kicker + display heading on the left, an optional muted sublede on the
 * right. Mirrors the microsite's `.mc-shead`; shared by Locations, Gallery, Team, FAQ, Reviews, Contact.
 */
function SectionHead({ no, kicker, heading, sublede }: { no?: string; kicker: string; heading: string; sublede?: string }) {
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

function BookButton({ label, tone, size = "md" }: { label: string; tone: "accent" | "paper"; size?: "sm" | "md" | "lg" | "nav" }) {
  const style: CSSProperties =
    tone === "paper"
      ? { background: "#fff", color: "var(--mc-ink)" }
      : { background: "var(--mc-accent)", color: "var(--mc-on-accent)" };
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
