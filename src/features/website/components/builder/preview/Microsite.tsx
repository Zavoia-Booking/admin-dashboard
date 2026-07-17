import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { SectionEntry } from "../../../types";
import { previewVars } from "../theme";
import { isKnownSectionType } from "../sectionCatalog";
import { cn } from "../../../../../shared/lib/utils";

import "./shared/animations.css";
import { UNNUMBERED } from "./shared/constants";
import { findScrollParent, prefersReducedMotion } from "./shared/util";
import { useFooterReveal } from "./shared/hooks";
import { AnnouncementBar } from "./sections/announcement/Announcement";
import { About } from "./sections/about/About";
import { Faq } from "./sections/faq/Faq";
import { Marquee } from "./sections/marquee/Marquee";
import { Team } from "./sections/team/Team";
import { Gallery } from "./sections/gallery/Gallery";
import { Reviews } from "./sections/reviews/Reviews";
import { Hero } from "./sections/hero/Hero";
import { Locations } from "./sections/locations/Locations";
import { Nav, FROST_DIST } from "./sections/nav/Nav";
import { Footer, normalizeFooterStyle } from "./sections/footer/Footer";
import type { PreviewData, LivePreviewProps, T } from "./shared/types";

/**
 * Faithful, scaled-down render of the public "lookbook" microsite — a warm paper canvas, editorial
 * serif display, mono numbered kickers, and a single brand accent. Sections render in layout order
 * from the owner's real data; booking/links are inert (this is a preview) and empty content shows
 * calm placeholders. Fluid type keys off the preview's own width via container-query units, so the
 * same component reads well in the small per-section card and the full-page dialog alike.
 */
function LivePreviewImpl({ layout, data, chrome = true, startNumber = 1, focusType }: LivePreviewProps) {
  const { t } = useTranslation("website");
  const visible = layout.filter((s) => s.visible);

  // The announcement is the sticky ribbon above the nav; the nav + footer are chrome pinned at the top /
  // bottom — all three are excluded from the in-flow section list in the full page. In the scoped
  // one-section preview (no chrome) nav/footer instead render inline via SectionView so their own card
  // shows a live sample.
  const bar = visible.find((s) => s.type === "announcement");
  const stacked = visible.filter(
    (s) => s.type !== "announcement" && ((s.type !== "nav" && s.type !== "footer") || !chrome),
  );
  // Nav/footer are on unless their (now section) entry is explicitly hidden; a layout without the entry (an
  // older save) keeps them, matching the always-on chrome they were before becoming sections.
  const navOn = !layout.some((s) => s.type === "nav" && !s.visible);
  const footerOn = !layout.some((s) => s.type === "footer" && !s.visible);
  const footerVariant = normalizeFooterStyle(layout.find((s) => s.type === "footer")?.variant);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(() => data.locations[0]?.id ?? null);

  useEffect(() => {
    if (!data.locations.some((location) => location.id === selectedLocationId)) {
      setSelectedLocationId(data.locations[0]?.id ?? null);
    }
  }, [data.locations, selectedLocationId]);

  // Every hero variant is an immersive, full-bleed header the nav floats over and frosts on scroll. Only an
  // announcement bar above the nav forces the solid paper bar from the top. Tumble is a warm-paper (light)
  // hero — the nav renders dark ink over it until it frosts (mirrors the design's useMCLightHero, which only
  // Tumble calls); every other hero is dark at the top and takes light chrome. Over the drenched field (the
  // free base with no cover) the CTA also frosts white→accent, so a static accent pill doesn't blend in.
  const first = stacked[0];
  const firstHeroVariant = !bar && first?.type === "hero" ? first.variant : null;
  const overHero = firstHeroVariant !== null;
  const overHeroTone: "light" | "dark" = firstHeroVariant === "tumble" ? "light" : "dark";
  const ctaFrost = firstHeroVariant === "default" && !data.heroImageUrl;

  // Scroll chrome: the nav sticks to the dialog's scroll container and frosts gradually as the hero scrolls
  // up behind it. The over-hero composition is a CSS grid overlap, so the hero starts under the transparent
  // navbar on the first frame without measuring or mutating layout in JavaScript.
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const reducedMotion = prefersReducedMotion();
  const progress = !chrome || !overHero ? 0 : reducedMotion ? 1 : scrollProgress;
  const editorialFooterReveal = chrome && footerOn && stacked.length > 0 && footerVariant === "editorial";

  // The footer is pinned behind the page and uncovered on scroll — drive its reveal off the scroll container.
  useFooterReveal(rootRef, footerRef, editorialFooterReveal);

  useEffect(() => {
    if (!chrome || !overHero || reducedMotion) return;
    const nav = navRef.current;
    if (!nav || !heroRef.current) return;
    const sc = findScrollParent(nav);
    if (!sc) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Drive off absolute scroll distance so the frost arrives quickly and consistently regardless of hero height.
      setScrollProgress(Math.round(Math.min(1, sc.scrollTop / FROST_DIST) * 100) / 100);
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
  }, [chrome, overHero, reducedMotion, stacked.length]);

  // Section numbers (mono kicker) follow the visible non-bar order, mirroring the microsite's "0N —".
  // `startNumber` lets the scoped one-section preview carry its real page ordinal instead of restarting at 1.
  let n = startNumber - 1;

  return (
    <div
      className={cn(
        "mc-root",
        editorialFooterReveal && "mc-root--editorial-footer",
        !chrome && "overflow-hidden rounded-xl ring-1 ring-black/5",
      )}
      ref={rootRef}
      style={{ ...previewVars(data.brandColor, data.fontKey), backgroundColor: "var(--mc-bg)", containerType: "inline-size" } as CSSProperties}
    >
      <div className={chrome ? cn("mc-content", overHero && "mc-content--nav-overlay") : undefined}>
      {bar ? (
        // Announcement ribbon + nav travel together, pinned to the top of the scroll container.
        <div className="sticky top-0 z-30">
          <AnnouncementBar entry={bar} data={data} t={t} sample={!chrome} />
          {chrome && navOn && stacked.length > 0 && (
            <Nav
              data={data}
              layout={layout}
              t={t}
              overHero={false}
              progress={0}
              navRef={navRef}
              sticky={false}
            />
          )}
        </div>
      ) : (
        chrome &&
        navOn &&
        stacked.length > 0 && (
          <Nav
            data={data}
            layout={layout}
            t={t}
            overHero={overHero}
            overHeroTone={overHeroTone}
            ctaFrost={ctaFrost}
            progress={progress}
            navRef={navRef}
          />
        )
      )}
      <div className="mc-page-flow">
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
            // Re-key the hero on its variant + cover presence so switching styles (or adding/removing a
            // cover) remounts it; in the scoped preview that remount plays the swap scale-fade.
            const heroKey =
              s.type === "hero" ? `hero-${s.variant}-${data.heroImageUrl ? "cover" : "none"}` : s.type;
            return (
              <div
                key={heroKey}
                data-preview-section={s.type}
                data-preview-focus={focusType === s.type ? "true" : undefined}
                ref={overHero && i === 0 ? heroRef : undefined}
                className={cn("relative scroll-mt-6", !chrome && s.type === "hero" && "mc-hero-swap")}
              >
                <SectionView
                  entry={s}
                  data={data}
                  t={t}
                  no={no}
                  chrome={chrome}
                  layout={layout}
                  selectedLocationId={selectedLocationId}
                  onSelectLocation={setSelectedLocationId}
                />
              </div>
            );
          })
        )}
      </div>
      </div>
      {chrome && footerOn && stacked.length > 0 && (
        <Footer
          data={data}
          t={t}
          footerRef={footerRef}
          layout={layout}
          selectedLocationId={selectedLocationId}
          variant={footerVariant}
        />
      )}
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

function SectionView({
  entry,
  data,
  t,
  no,
  chrome,
  layout,
  selectedLocationId,
  onSelectLocation,
}: {
  entry: SectionEntry;
  data: PreviewData;
  t: T;
  no: string;
  chrome: boolean;
  layout: SectionEntry[];
  selectedLocationId: number | null;
  onSelectLocation: (locationId: number) => void;
}) {
  if (!isKnownSectionType(entry.type)) return null; // unknown stored type → skipped on the public side
  switch (entry.type) {
    case "hero":
      // Parallax only in the full-page preview; the scoped one-section preview has no hero-scroll, so a
      // page-scroll-driven shift would lift the cover off its buffer and bare the bottom edge.
      return <Hero entry={entry} data={data} t={t} parallax={chrome} />;
    case "nav":
      // Only reached in the scoped one-section preview (the full page renders the nav as sticky chrome).
      return <ScopedNav data={data} layout={layout} t={t} variant={entry.variant} />;
    case "footer":
      // Only reached in the scoped one-section preview (the full page renders the footer as pinned chrome).
      return (
        <ScopedFooter
          data={data}
          t={t}
          layout={layout}
          selectedLocationId={selectedLocationId}
          variant={entry.variant}
        />
      );
    case "marquee":
      return <Marquee entry={entry} data={data} chrome={chrome} />;
    case "about":
      return <About entry={entry} data={data} t={t} no={no} />;
    case "locations":
      return (
        <Locations
          entry={entry}
          data={data}
          t={t}
          no={no}
          selectedLocationId={selectedLocationId}
          onSelectLocation={onSelectLocation}
        />
      );
    case "gallery":
      return <Gallery entry={entry} data={data} t={t} no={no} />;
    case "team":
      return <Team entry={entry} data={data} t={t} no={no} />;
    case "testimonials":
      return <Reviews entry={entry} data={data} t={t} no={no} />;
    case "faq":
      return <Faq entry={entry} data={data} t={t} no={no} />;
    default:
      return null;
  }
}

/** Static nav for the scoped one-section preview: a solid paper bar (no hero-frost, no sticky), so the nav
 *  card shows a live sample without the full-page scroll chrome. */
function ScopedNav({ data, layout, t, variant }: { data: PreviewData; layout: SectionEntry[]; t: T; variant?: string }) {
  const ref = useRef<HTMLElement>(null);
  const scopedLayout = layout.some((section) => section.type === "nav")
    ? layout.map((section) => (section.type === "nav" ? { ...section, variant: variant ?? section.variant } : section))
    : [{ type: "nav", variant: variant ?? "default", visible: true }, ...layout];
  return <Nav data={data} layout={scopedLayout} t={t} overHero={false} progress={1} navRef={ref} sticky={false} />;
}

/** Static footer for the scoped one-section preview: the reveal engine only runs in the full page, so it
 *  renders as a normal block here (--mc-reveal defaults to 1 → the settled paper state). */
function ScopedFooter({
  data,
  t,
  layout,
  selectedLocationId,
  variant,
}: {
  data: PreviewData;
  t: T;
  layout: SectionEntry[];
  selectedLocationId: number | null;
  variant?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  return (
    <Footer
      data={data}
      t={t}
      footerRef={ref}
      layout={layout}
      selectedLocationId={selectedLocationId}
      variant={variant}
    />
  );
}

export default LivePreview;
