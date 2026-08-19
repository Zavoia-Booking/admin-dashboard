import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { WebsiteBuilderLocation, SectionEntry } from "../../../types";
import { previewVars } from "../theme";
import { isKnownSectionType } from "../sectionCatalog";
import { resolvePreviewLocations } from "../locationSelection";
import { cn } from "../../../../../shared/lib/utils";

import "./shared/animations.css";
import { UNNUMBERED } from "./shared/constants";
import { findScrollParent, prefersReducedMotion } from "./shared/util";
import { PreviewAtRestContext, StaticPreviewContext, useFooterReveal } from "./shared/hooks";
import {
  AnnouncementBar,
  normalizeAnnouncementLayout,
} from "./sections/announcement/Announcement";
import { About } from "./sections/about/About";
import { Services } from "./sections/services/Services";
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
function LivePreviewImpl({
  layout,
  data,
  chrome = true,
  startNumber = 1,
  focusType,
  selectedLocationId: controlledSelectedLocationId,
  onSelectedLocationChange,
  locationScope,
}: LivePreviewProps) {
  const { t } = useTranslation("website");
  const visible = layout.filter((s) => s.visible);

  // Announcement and site chrome are excluded from the page flow. Ribbon/Ticker travel above the nav;
  // Pill instead floats below it without changing the hero or nav offset.
  const bar = visible.find((s) => s.type === "announcement");
  const hasBar = bar !== undefined;
  const [announcementShowing, setAnnouncementShowing] = useState(hasBar);
  useEffect(() => {
    // Dismissal is interactive but local to this builder preview. Any Announcement content,
    // setting, style, locale, or visibility change must make the updated result inspectable again.
    setAnnouncementShowing(hasBar);
  }, [bar, data.announcement, data.locale, hasBar]);
  const activeBar = bar && announcementShowing ? bar : undefined;
  const announcementLayout = bar ? normalizeAnnouncementLayout(bar.variant) : null;
  const floatingAnnouncement = !!activeBar && chrome && announcementLayout === "pill";
  const stacked = visible.filter(
    (s) => s.type !== "announcement" && ((s.type !== "nav" && s.type !== "footer") || !chrome),
  );
  // Nav/footer are on unless their (now section) entry is explicitly hidden; a layout without the entry (an
  // older save) keeps them, matching the always-on chrome they were before becoming sections.
  const navOn = !layout.some((s) => s.type === "nav" && !s.visible);
  const footerOn = !layout.some((s) => s.type === "footer" && !s.visible);
  const footerVariant = normalizeFooterStyle(layout.find((s) => s.type === "footer")?.variant);
  // Memoised so the per-section memo below holds while the nav frost re-renders this component on scroll.
  const preferredLocations = useMemo(
    () => locationScope ?? resolvePreviewLocations(layout, data.locations),
    [locationScope, layout, data.locations],
  );
  const preferredLocationKey = preferredLocations.map((location) => location.id).join(",");
  const preferredLocationId = preferredLocations[0]?.id ?? null;
  const [internalSelectedLocationId, setInternalSelectedLocationId] =
    useState<number | null>(preferredLocationId);
  const isLocationSelectionControlled = controlledSelectedLocationId !== undefined;
  const selectedLocationId = controlledSelectedLocationId === undefined
    ? internalSelectedLocationId
    : controlledSelectedLocationId;
  const setSelectedLocationId = useCallback(
    (locationId: number | null) => {
      if (!isLocationSelectionControlled) {
        setInternalSelectedLocationId(locationId);
      }
      onSelectedLocationChange?.(locationId);
    },
    [isLocationSelectionControlled, onSelectedLocationChange],
  );
  const previousPreferredLocationId = useRef(preferredLocationId);
  const reportedInitialLocationRef = useRef(false);
  const selectedLocationIsVisible =
    selectedLocationId !== null &&
    preferredLocations.some((location) => location.id === selectedLocationId);

  useEffect(() => {
    const firstLocationChanged = previousPreferredLocationId.current !== preferredLocationId;
    previousPreferredLocationId.current = preferredLocationId;

    if (
      (!isLocationSelectionControlled && firstLocationChanged) ||
      (selectedLocationId !== null && !selectedLocationIsVisible) ||
      (selectedLocationId === null && preferredLocationId !== null)
    ) {
      setSelectedLocationId(preferredLocationId);
    }
  }, [
    preferredLocationId,
    preferredLocationKey,
    isLocationSelectionControlled,
    selectedLocationId,
    selectedLocationIsVisible,
    setSelectedLocationId,
  ]);

  useEffect(() => {
    if (
      reportedInitialLocationRef.current ||
      isLocationSelectionControlled ||
      !onSelectedLocationChange
    ) return;
    reportedInitialLocationRef.current = true;
    onSelectedLocationChange(internalSelectedLocationId);
  }, [internalSelectedLocationId, isLocationSelectionControlled, onSelectedLocationChange]);

  // Every hero variant is an immersive, full-bleed header the nav floats over and frosts on scroll. Only an
  // announcement bar above the nav forces the solid paper bar from the top. Tumble is a warm-paper (light)
  // hero — the nav renders dark ink over it until it frosts (mirrors the design's useMCLightHero, which only
  // Tumble calls); every other hero is dark at the top and takes light chrome. Over the drenched field (the
  // free text-panel base) the CTA also frosts white→accent, so a static accent pill doesn't blend in.
  const first = stacked[0];
  const firstHeroVariant = (!activeBar || announcementLayout === "pill") && first?.type === "hero"
    ? first.variant
    : null;
  const overHero = firstHeroVariant !== null;
  const overHeroTone: "light" | "dark" = firstHeroVariant === "tumble" ? "light" : "dark";
  const ctaFrost = firstHeroVariant === "default";

  // Scroll chrome: the nav sticks to the dialog's scroll container and frosts gradually as the hero scrolls
  // up behind it. The over-hero composition is a CSS grid overlap, so the hero starts under the transparent
  // navbar on the first frame without measuring or mutating layout in JavaScript.
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const reducedMotion = prefersReducedMotion();
  // Static snapshot (ScaledPreview): page at rest — nav un-frosted over the hero, no scroll-jack/parallax.
  const staticPreview = useContext(StaticPreviewContext);
  // Settled-but-scrollable (the phone's scaled-down desktop mock): heavy self-running motion parks; the
  // leaf hooks read the same context through useReducedMotion, this flag only drives the hero props below.
  const atRest = useContext(PreviewAtRestContext);
  const progress = !chrome || !overHero || staticPreview ? 0 : reducedMotion ? 1 : scrollProgress;
  const editorialFooterReveal = chrome && footerOn && stacked.length > 0 && footerVariant === "editorial";

  // The footer is pinned behind the page and uncovered on scroll — drive its reveal off the scroll container.
  useFooterReveal(rootRef, footerRef, editorialFooterReveal);

  useEffect(() => {
    if (!chrome || !overHero || reducedMotion || staticPreview) return;
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
  }, [chrome, overHero, reducedMotion, staticPreview, stacked.length]);

  // Section numbers (mono kicker) follow the visible non-bar order, mirroring the microsite's "0N —".
  // `startNumber` lets the scoped one-section preview carry its real page ordinal instead of restarting at 1.
  let n = startNumber - 1;
  const announcementNode = activeBar ? (
    <AnnouncementBar
      entry={activeBar}
      data={data}
      t={t}
      sample={!chrome}
      showPlaceholder={chrome}
      onVisibilityChange={setAnnouncementShowing}
    />
  ) : null;

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
      {activeBar && !floatingAnnouncement ? (
        // Ribbon/Ticker + nav travel together, pinned to the top of the full preview.
        <div className={chrome ? "sticky top-0 z-30" : undefined}>
          {announcementNode}
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
        <>
          {chrome && navOn && stacked.length > 0 && (
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
          )}
          {floatingAnnouncement && <div className="mc-anno-pill-layer">{announcementNode}</div>}
        </>
      )}
      <div className="mc-page-flow">
        {stacked.length === 0 ? (
          activeBar ? null : (
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
                  motion={!staticPreview}
                  atRest={atRest}
                  layout={layout}
                  locations={preferredLocations}
                  // Only the location-aware sections receive the live id: a location page-turn must
                  // not break the memo of (and re-render) every other section on the page.
                  selectedLocationId={LOCATION_AWARE_SECTIONS.has(s.type) ? selectedLocationId : null}
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

/** Memoised: the nav frost updates `scrollProgress` on this tree's root while the hero scrolls, and without
 *  this every section (and its hooks) would re-render per frame — visibly costly on low-end phones. */
/** Section types whose render depends on the selected location (see the switch below). */
const LOCATION_AWARE_SECTIONS = new Set<string>(["footer", "services", "locations"]);

const SectionView = memo(function SectionView({
  entry,
  data,
  t,
  no,
  chrome,
  motion,
  atRest,
  layout,
  locations,
  selectedLocationId,
  onSelectLocation,
}: {
  entry: SectionEntry;
  data: PreviewData;
  t: T;
  no: string;
  chrome: boolean;
  /** False inside a static snapshot: hero scroll-jack/parallax stay at rest even with full-page chrome. */
  motion: boolean;
  /** Settled-but-scrollable page (PreviewAtRestContext) — drives the hero props; leaves read the context. */
  atRest: boolean;
  layout: SectionEntry[];
  locations: WebsiteBuilderLocation[];
  selectedLocationId: number | null;
  onSelectLocation: (locationId: number) => void;
}) {
  if (!isKnownSectionType(entry.type)) return null; // unknown stored type → skipped on the public side
  switch (entry.type) {
    case "hero":
      // Parallax only in the full-page preview; the scoped one-section preview has no hero-scroll, so a
      // page-scroll-driven shift would lift the cover off its buffer and bare the bottom edge.
      return <Hero entry={entry} data={data} t={t} parallax={chrome && motion && !atRest} atRest={atRest} />;
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
      return <Marquee entry={entry} data={data} chrome={chrome && motion} />;
    case "about":
      return <About entry={entry} data={data} t={t} layout={layout} />;
    case "services":
      return (
        <Services
          entry={entry}
          data={data}
          t={t}
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelectLocation={onSelectLocation}
        />
      );
    case "locations":
      return (
        <Locations
          entry={entry}
          data={data}
          t={t}
          selectedLocationId={selectedLocationId}
          onSelectLocation={onSelectLocation}
          showTeamLink={layout.some((section) => section.type === "team" && section.visible)}
          layout={layout}
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
});

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
