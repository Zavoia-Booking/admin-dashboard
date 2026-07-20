import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ArrowRight, Check, MapPin, Star } from "lucide-react";
import { tagIcon } from "../../../../../../../marketplace/utils/tagIcons";
import {
  DAY_KEYS,
  locationArea,
  locationClock,
  locationPhoto,
  locationPostalAddress,
  type DayKey,
} from "../../../shared/contact";
import { prefersReducedMotion } from "../../../shared/util";
import { LocationBookAction } from "../parts/LocationBookAction";
import { LocationImage } from "../parts/LocationImage";
import type { LocationsVariantProps } from "../types";
import { buildLocationTagGroups } from "../util";
import "./bento.css";

const BENTO_AREAS = ["land", "stay", "puff", "food"] as const;

const PUSH_ORDER: Record<string, number> = {
  hero: 0,
  copy: 1,
  land: 2,
  expl: 3,
  stay: 4,
  cuis: 5,
  puff: 6,
  food: 7,
};

const PUSH_VECTOR: Record<string, readonly [number, number]> = {
  hero: [-1, 0],
  copy: [1, 0],
  land: [0, -1],
  expl: [0, -1],
  stay: [0, 1],
  puff: [1, 0],
  cuis: [1, 0],
  food: [0, 1],
};

const PUSH_GAP = 0.85;

type Location = LocationsVariantProps["loc"];
type Translate = LocationsVariantProps["t"];
type SupportImage = { src: string; alt: string };
type HoursRow = { start: number; end: number; value: string };
type BentoAmenity = { key: string; label: string; slug: string };

type TransitionState = {
  dir: number;
  ghosts: HTMLElement[];
  timer: number | null;
};

const clearTransition = (transition: TransitionState) => {
  if (transition.timer !== null) window.clearTimeout(transition.timer);
  transition.ghosts.forEach((ghost) => ghost.remove());
};

const buildHoursRows = (location: Location, t: Translate): HoursRow[] => {
  const hours = (location.workingHours ?? {}) as Partial<
    Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>
  >;
  const closed = t("businessPage.builder.preview.contactClosed");
  const valueFor = (day: DayKey) => {
    if (location.open247) return t("businessPage.builder.preview.contactOpen247");
    const entry = hours[day];
    return entry?.isOpen && entry.open && entry.close ? `${entry.open} – ${entry.close}` : closed;
  };
  const rows: HoursRow[] = [];
  DAY_KEYS.forEach((day, index) => {
    const value = valueFor(day);
    const previous = rows[rows.length - 1];
    if (previous?.value === value) previous.end = index;
    else rows.push({ start: index, end: index, value });
  });
  return rows;
};

const hoursLabel = (row: HoursRow, t: Translate) =>
  row.start === row.end
    ? t(`businessPage.builder.preview.days.${DAY_KEYS[row.start]}`)
    : `${t(`businessPage.builder.preview.days.${DAY_KEYS[row.start]}`)}–${t(
        `businessPage.builder.preview.days.${DAY_KEYS[row.end]}`,
      )}`;

function BentoAmenityItem({
  amenity,
  measuring = false,
}: {
  amenity: BentoAmenity;
  measuring?: boolean;
}) {
  const Icon = tagIcon(amenity.slug) ?? Check;
  return (
    <li
      className="mc-locb-amen-item"
      data-bento-amenity-item={measuring ? "1" : undefined}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={1.7} />
      <span>{amenity.label}</span>
    </li>
  );
}

/** Fits a complete amenity prefix to the live tile geometry and always reserves the overflow summary. */
function BentoAmenities({
  amenities,
  t,
}: {
  amenities: BentoAmenity[];
  t: Translate;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const measureMoreRef = useRef<HTMLLIElement>(null);
  const [visibleCount, setVisibleCount] = useState(amenities.length);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const measure = measureRef.current;
    const measureMore = measureMoreRef.current;
    if (!host || !measure || !measureMore) return;

    let frame = 0;
    let active = true;
    const fit = () => {
      const items = Array.from(
        measure.querySelectorAll<HTMLElement>("[data-bento-amenity-item]"),
      );
      let nextCount = 0;

      for (let count = items.length; count >= 0; count -= 1) {
        items.forEach((item, index) => {
          item.hidden = index >= count;
        });
        measureMore.textContent = t("businessPage.builder.preview.locAmenitiesMore", {
          count: items.length - count,
        });
        measureMore.hidden = count >= items.length;
        if (measure.scrollHeight <= measure.clientHeight + 1) {
          nextCount = count;
          break;
        }
      }

      setVisibleCount((current) => (current === nextCount ? current : nextCount));
    };
    const scheduleFit = () => {
      if (!active) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fit);
    };

    fit();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleFit);
    observer?.observe(host);
    const previewRoot = host.closest(".mc-root");
    const themeObserver = previewRoot && typeof MutationObserver !== "undefined"
      ? new MutationObserver(scheduleFit)
      : null;
    if (previewRoot) {
      themeObserver?.observe(previewRoot, { attributes: true, attributeFilter: ["class", "style"] });
    }
    const fonts = typeof document === "undefined" ? null : document.fonts;
    fonts?.addEventListener("loadingdone", scheduleFit);
    void fonts?.ready.then(scheduleFit);

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      themeObserver?.disconnect();
      fonts?.removeEventListener("loadingdone", scheduleFit);
    };
  }, [amenities, t]);

  const remaining = Math.max(0, amenities.length - visibleCount);
  const title = t("businessPage.builder.preview.locAmenities");

  return (
    <div ref={hostRef} className="mc-locb-amen-panel">
      <div className="mc-locb-amen-content">
        <span className="mc-locb-amen-title">
          {title}
        </span>
        <ul className="mc-locb-amen-list" aria-label={title}>
          {amenities.slice(0, visibleCount).map((amenity) => (
            <BentoAmenityItem key={amenity.key} amenity={amenity} />
          ))}
          {remaining > 0 ? (
            <li
              className="mc-locb-amen-more"
              aria-label={t("businessPage.builder.preview.locAmenitiesMoreLabel", { count: remaining })}
            >
              {t("businessPage.builder.preview.locAmenitiesMore", { count: remaining })}
            </li>
          ) : null}
        </ul>
      </div>

      <div ref={measureRef} className="mc-locb-amen-content mc-locb-amen-measure" aria-hidden="true">
        <span className="mc-locb-amen-title">
          {title}
        </span>
        <ul className="mc-locb-amen-list">
          {amenities.map((amenity) => (
            <BentoAmenityItem key={amenity.key} amenity={amenity} measuring />
          ))}
          <li ref={measureMoreRef} className="mc-locb-amen-more">
            {t("businessPage.builder.preview.locAmenitiesMore", { count: amenities.length })}
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Bento — one location per page in the design-source destination grid. Paging clones the
 * current tiles, swaps the real location data, then pushes the incoming and outgoing panels
 * through each tile on alternating axes. Booking affordances remain inert in the builder.
 */
export function Bento({
  shown,
  idx,
  onSelect,
  dict,
  t,
  galleryImages,
}: LocationsVariantProps) {
  const featured = shown[idx] ?? shown[0];
  const count = shown.length;
  const gridRef = useRef<HTMLDivElement>(null);
  const firstRenderRef = useRef(true);
  const transitionRef = useRef<TransitionState | null>(null);
  const activeIndexRef = useRef(idx);
  activeIndexRef.current = idx;

  const supportImages = useMemo(() => {
    const pool = galleryImages
      .filter((image) => image.src.trim())
      .map((image) => ({ src: image.src.trim(), alt: "" }));
    const fallback = locationPhoto(featured);
    if (pool.length === 0) {
      return fallback
        ? Array<SupportImage>(4).fill({ src: fallback, alt: "" })
        : Array<SupportImage | null>(4).fill(null);
    }
    return Array.from({ length: 4 }, (_, slot) => pool[(idx * 2 + slot) % pool.length]);
  }, [featured, galleryImages, idx]);
  const amenities = useMemo<BentoAmenity[]>(
    () =>
      buildLocationTagGroups(featured, dict).flatMap((group) =>
        group.items.map((amenity) => ({
          key: `${String(group.key)}:${amenity.id}`,
          label: amenity.label,
          slug: amenity.slug,
        })),
      ),
    [dict, featured],
  );

  const area = locationArea(featured);
  const address = locationPostalAddress(featured);
  const description = featured.description?.trim() || address || area;
  const rating = (featured.totalReviews ?? 0) > 0 ? Number(featured.averageRating ?? 0) : null;
  const hoursRows = buildHoursRows(featured, t);
  const todayIndex = locationClock(featured).dayIndex;

  useLayoutEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const grid = gridRef.current;
    if (!grid) return;
    const transition = transitionRef.current;

    if (prefersReducedMotion()) {
      if (transition) {
        clearTransition(transition);
        transitionRef.current = null;
      }
      return;
    }

    const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
    const finishCleanly = (animation: Animation) => {
      animation.addEventListener(
        "finish",
        () => {
          try {
            animation.cancel();
          } catch {
            // The animated node may already have been removed by an interrupted page.
          }
        },
        { once: true },
      );
    };

    if (transition) {
      let latestEnd = 0;
      grid.querySelectorAll<HTMLElement>(".mc-locb-tile").forEach((tile) => {
        const live = tile.querySelector<HTMLElement>(":scope > .mc-locb-slide:not(.is-ghost)");
        if (!live) return;
        const ghost = tile.querySelector<HTMLElement>(":scope > .mc-locb-slide.is-ghost");
        const vector = PUSH_VECTOR[tile.dataset.area ?? ""] ?? [1, 0];
        const bounds = tile.getBoundingClientRect();
        const dx = vector[0] * transition.dir * bounds.width * (1 + PUSH_GAP);
        const dy = vector[1] * transition.dir * bounds.height * (1 + PUSH_GAP);
        const delay = (PUSH_ORDER[tile.dataset.area ?? ""] ?? 0) * 55;
        latestEnd = Math.max(latestEnd, delay + 640);

        const incoming = live.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: 640, delay, easing, fill: "both" },
        );
        finishCleanly(incoming);
        ghost?.animate(
          [{ transform: "none" }, { transform: `translate(${-dx}px, ${-dy}px)` }],
          { duration: 640, delay, easing, fill: "both" },
        );
      });

      transition.timer = window.setTimeout(() => {
        transition.ghosts.forEach((ghost) => ghost.remove());
        if (transitionRef.current === transition) transitionRef.current = null;
      }, latestEnd + 80);
      return;
    }

    grid
      .querySelectorAll<HTMLElement>(".mc-locb-tile > .mc-locb-slide:not(.is-ghost)")
      .forEach((slide, slideIndex) => {
        const settle = slide.animate(
          [
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 460, delay: slideIndex * 40, easing, fill: "both" },
        );
        finishCleanly(settle);
      });
  }, [idx]);

  useEffect(
    () => () => {
      if (!transitionRef.current) return;
      clearTransition(transitionRef.current);
      transitionRef.current = null;
    },
    [],
  );

  const go = (direction: number) => {
    if (count < 2) return;
    const grid = gridRef.current;
    const target = ((activeIndexRef.current + direction) % count + count) % count;
    activeIndexRef.current = target;
    if (prefersReducedMotion() || !grid) {
      onSelect(target);
      return;
    }

    if (transitionRef.current) {
      clearTransition(transitionRef.current);
      transitionRef.current = null;
    }

    const ghosts: HTMLElement[] = [];
    grid.querySelectorAll<HTMLElement>(".mc-locb-tile").forEach((tile) => {
      const slide = tile.querySelector<HTMLElement>(":scope > .mc-locb-slide:not(.is-ghost)");
      if (!slide) return;
      slide.getAnimations().forEach((animation) => animation.cancel());
      const ghost = slide.cloneNode(true) as HTMLElement;
      ghost.classList.add("is-ghost");
      ghost.setAttribute("aria-hidden", "true");
      tile.appendChild(ghost);
      ghosts.push(ghost);
    });
    transitionRef.current = { dir: direction, ghosts, timer: null };
    onSelect(target);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const target = event.target as HTMLElement;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
    event.preventDefault();
    go(event.key === "ArrowRight" ? 1 : -1);
  };

  const renderImage = (image: SupportImage | null, className: string) =>
    image ? (
      <LocationImage
        src={image.src}
        alt={image.alt}
        draggable={false}
        className={className}
        fallbackLabel={image.alt}
      />
    ) : (
      <span className="mc-locb-placeholder" aria-hidden="true" />
    );

  const heroPhoto = locationPhoto(featured);
  const previousLabel = t("businessPage.builder.preview.locPrevious");
  const previousShortLabel = t("businessPage.builder.preview.locPrev");
  const nextLabel = t("businessPage.builder.preview.locNext");

  return (
    <div className="mc-locb-shell mc-mask-in" onKeyDown={handleKeyDown}>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {featured.name}
      </span>
      <div className="mc-locb" ref={gridRef}>
        <div className="mc-locb-tile mc-locb-hero" data-area="hero" style={{ gridArea: "hero" }}>
          <div className="mc-locb-slide">
            {heroPhoto
              ? renderImage({ src: heroPhoto, alt: featured.name }, "mc-locb-photo")
              : renderImage(null, "mc-locb-photo")}
            <span className="mc-locb-heroscrim" aria-hidden="true" />
            {rating !== null ? (
              <span className="mc-locb-rate">
                <Star aria-hidden="true" size={13} fill="currentColor" strokeWidth={1.5} />
                {rating.toFixed(1)}
              </span>
            ) : null}
            <div className="mc-locb-herocap">
              <div className="mc-locb-heronm">{featured.name}</div>
              {area ? <div className="mc-locb-herosub">{area}</div> : null}
            </div>
          </div>
        </div>

        <div className="mc-locb-copycol" style={{ gridArea: "copy" }}>
          <div className="mc-locb-tile mc-locb-copy" data-area="copy">
            <div className="mc-locb-slide">
              <span className="mc-locb-kick">
                {String(idx + 1).padStart(2, "0")}/{String(count).padStart(2, "0")}
              </span>
              {description ? <p className="mc-locb-lede">{description}</p> : null}
              {featured.allowOnlineBooking ? (
                <LocationBookAction
                  className="mc-locb-btn mc-locb-btn--go"
                  label={t("businessPage.builder.preview.bookAt", { name: featured.name })}
                  arrowSize={15}
                />
              ) : null}
            </div>
          </div>
          {count > 1 ? (
            <div className="mc-locb-pager">
              <button
                type="button"
                className="mc-locb-btn mc-locb-btn--ghost"
                aria-label={previousLabel}
                onClick={() => go(-1)}
              >
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} className="mc-locb-arrow-back" />
                {previousShortLabel}
              </button>
              <button
                type="button"
                className="mc-locb-btn mc-locb-btn--ghost"
                aria-label={nextLabel}
                onClick={() => go(1)}
              >
                {nextLabel}
                <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="mc-locb-tile mc-locb-fact" data-area="expl" style={{ gridArea: "expl" }}>
          <div className="mc-locb-slide">
            <span className="mc-locb-fact-k">
              <MapPin aria-hidden="true" size={12} strokeWidth={1.7} />
              {t("businessPage.builder.preview.locGettingHere")}
            </span>
            {area ? <div className="mc-locb-fact-lg">{area}</div> : null}
            <div className="mc-locb-fact-sm">
              {address || t("businessPage.builder.preview.noAddress")}
            </div>
          </div>
        </div>

        <div className="mc-locb-tile mc-locb-fact" data-area="cuis" style={{ gridArea: "cuis" }}>
          <div className="mc-locb-slide">
            <dl className="mc-locb-hours">
              {hoursRows.map((row) => (
                <div
                  key={`${row.start}-${row.end}`}
                  className="mc-locb-hrow"
                  data-today={todayIndex >= row.start && todayIndex <= row.end ? "1" : "0"}
                >
                  <dt>{hoursLabel(row, t)}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {supportImages.map((image, imageIndex) => {
          const tileArea = BENTO_AREAS[imageIndex];
          const showsAmenities = tileArea === "land" && amenities.length > 0;
          return (
            <div
              key={tileArea}
              className={`mc-locb-tile ${showsAmenities ? "mc-locb-amen" : "mc-locb-img"}`}
              data-area={tileArea}
              style={{ gridArea: tileArea }}
            >
              <div className="mc-locb-slide">
                {showsAmenities ? (
                  <BentoAmenities amenities={amenities} t={t} />
                ) : (
                  <>
                    {renderImage(image, "mc-locb-photo")}
                    <span className="mc-locb-imgscrim" aria-hidden="true" />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
