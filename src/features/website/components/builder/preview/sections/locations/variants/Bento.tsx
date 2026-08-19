import {
  useCallback,
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
import { useReducedMotion } from "../../../shared/hooks";
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

// requestIdleCallback with a Safari/older-WebView fallback.
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};
const requestIdle = (cb: () => void): number => {
  const w = window as IdleWindow;
  return w.requestIdleCallback
    ? w.requestIdleCallback(cb, { timeout: 900 })
    : window.setTimeout(cb, 260);
};

// Touch hardware gets a tighter beat: same staggered push, ~40% less time under GPU load.
const COARSE_POINTER =
  typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
const PUSH_MS = COARSE_POINTER ? 440 : 640;
const PUSH_STAGGER_MS = COARSE_POINTER ? 40 : 55;


type Location = LocationsVariantProps["loc"];
type Translate = LocationsVariantProps["t"];
type SupportImage = { src: string; alt: string };
type HoursRow = { start: number; end: number; value: string };
type BentoAmenity = { key: string; label: string; slug: string };

type TransitionState = {
  dir: number;
  /** "slide": desktop content-push inside the rounded tiles. "tile": coarse-pointer variant that
   *  moves whole cards instead — a rounded card moving as a rigid layer keeps its corner mask
   *  baked into its own texture, so the GPU needs no per-frame render surface per tile. */
  mode: "slide" | "tile";
  ghosts: HTMLElement[];
  /** Exit handles, index-aligned with `ghosts`, so a clone can be retired without a DOM query. */
  ghostAnimations?: Animation[];
  /** Our own WAAPI handles — cancelled directly on interrupt; querying getAnimations() per tile
   *  forces a full style+layout pass each call (profiled at ~430ms per tap on a Helio G85). */
  animations: Animation[];
  timer: number | null;
};

const clearTransition = (transition: TransitionState) => {
  if (transition.timer !== null) window.clearTimeout(transition.timer);
  transition.animations.forEach((animation) => {
    try {
      animation.cancel();
    } catch {
      // Node may already be gone.
    }
  });
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

function BentoAmenityItem({ amenity }: { amenity: BentoAmenity }) {
  const Icon = tagIcon(amenity.slug) ?? Check;
  return (
    <li className="mc-locb-amen-item">
      <Icon aria-hidden="true" size={14} strokeWidth={1.7} />
      <span>{amenity.label}</span>
    </li>
  );
}

/** Reserves a fixed number of chip rows; anything past the budget collapses into "+ N". */
function BentoAmenities({
  amenities,
  t,
}: {
  amenities: BentoAmenity[];
  t: Translate;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  // 0 until the panel is measured once. Every chip is exactly one row tall, so the budget is a
  // row count that holds for ANY location — page turns never measure, they just slice.
  const [rowBudget, setRowBudget] = useState(0);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const measure = () => {
      const chip = list.querySelector<HTMLElement>(".mc-locb-amen-item");
      if (!chip) return;
      const gap = Number.parseFloat(getComputedStyle(list).rowGap) || 0;
      const pitch = chip.offsetHeight + gap;
      if (pitch <= 0) return;
      const rows = Math.floor((list.clientHeight + gap) / pitch);
      setRowBudget((current) => (current === rows ? current : Math.max(1, rows)));
    };
    measure();
    // Only a real panel resize (device toggle, rotation) or a late webfont can change the answer.
    // The list is flex:1, so its box does not move when the chip count does — no observer echo.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer?.observe(list);
    const fonts = typeof document === "undefined" ? null : document.fonts;
    fonts?.addEventListener("loadingdone", measure);
    void fonts?.ready.then(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, []);

  // Worst case a chip takes a whole row, so `rowBudget` chips always fit; when they do not all
  // fit, the last row is given to the summary instead.
  const overflowing = rowBudget > 0 && amenities.length > rowBudget;
  const visibleCount = overflowing ? Math.max(1, rowBudget - 1) : amenities.length;
  const remaining = Math.max(0, amenities.length - visibleCount);
  const title = t("businessPage.builder.preview.locAmenities");

  return (
    <div className="mc-locb-amen-panel">
      <div className="mc-locb-amen-content">
        <span className="mc-locb-amen-title">
          {title}
        </span>
        <ul ref={listRef} className="mc-locb-amen-list" aria-label={title}>
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

  const imagePool = useMemo(
    () =>
      galleryImages
        .filter((image) => image.src.trim())
        .map((image) => ({ src: image.src.trim(), alt: "" })),
    [galleryImages],
  );
  const supportImagesFor = useCallback(
    (index: number, location: Location): Array<SupportImage | null> => {
      if (imagePool.length === 0) {
        const fallback = locationPhoto(location);
        return fallback
          ? Array<SupportImage>(4).fill({ src: fallback, alt: "" })
          : Array<SupportImage | null>(4).fill(null);
      }
      return Array.from({ length: 4 }, (_, slot) => imagePool[(index * 2 + slot) % imagePool.length]);
    },
    [imagePool],
  );
  const supportImages = useMemo(
    () => supportImagesFor(idx, featured),
    [featured, idx, supportImagesFor],
  );
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
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const grid = gridRef.current;
    if (!grid) return;
    const transition = transitionRef.current;

    if (reduced) {
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

    if (transition && transition.mode === "tile") {
      // Coarse-pointer push, incoming half only — the ghosts launched at tap time in go().
      // Whole cards move, so each corner mask rides with its layer (no per-frame render surfaces).
      // Reads batched before writes: one reflow total, not one per tile.
      const tiles = Array.from(grid.querySelectorAll<HTMLElement>(".mc-locb-tile:not(.is-ghost)"));
      const rects = tiles.map((tile) => tile.getBoundingClientRect());
      tiles.forEach((tile, index) => {
        const bounds = rects[index];
        const vector = PUSH_VECTOR[tile.dataset.area ?? ""] ?? [1, 0];
        const dx = vector[0] * transition.dir * bounds.width * (1 + PUSH_GAP);
        const dy = vector[1] * transition.dir * bounds.height * (1 + PUSH_GAP);
        const delay = (PUSH_ORDER[tile.dataset.area ?? ""] ?? 0) * PUSH_STAGGER_MS;
        tile.style.visibility = "";
        // Hold the layer past the animation's end. Without this Chrome demotes each tile the
        // instant its animation finishes and re-rasterises all 8 cards in one frame (~80ms hitch
        // exactly at the tail). Released in the idle cleanup, where the repaint is unseen.
        tile.style.willChange = "transform";
        const incoming = tile.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: PUSH_MS, delay, easing, fill: "both" },
        );
        // Deliberately NOT finishCleanly: cancelling on 'finish' drops each tile's compositor
        // layer the instant the motion ends, forcing all 8 cards to re-rasterise in one frame —
        // the hitch felt right at the tail. They are cancelled together in the idle cleanup below.
        transition.animations.push(incoming);
      });

      // Tear down only once BOTH halves have actually finished. The incoming half starts after
      // React's commit (~150-200ms later than the ghosts), so the push really ends ~950ms after
      // the tap — a timer sized to the nominal duration fired inside the tail and froze it.
      const settled = Promise.all(
        transition.animations.map((animation) => animation.finished.catch(() => undefined)),
      );
      void settled.then(() => {
        if (transitionRef.current !== transition) return;
        requestIdle(() => {
          if (transitionRef.current !== transition) return;
          // One unit of teardown per frame. Retiring the 8 clones together costs ~120ms of
          // renderer work in a single frame, and dropping all 8 layers together costs another
          // repaint — both landed right after the motion and read as a freeze. Cancelling from
          // the stored handles keeps getAnimations() (a forced style+layout pass) out of the loop.
          const queue: Array<() => void> = [
            ...transition.ghosts.map((ghost, index) => () => {
              try {
                transition.ghostAnimations?.[index]?.cancel();
              } catch {
                // Node may already be gone.
              }
              ghost.remove();
            }),
            ...tiles.map((tile) => () => {
              tile.style.visibility = "";
              tile.style.willChange = "";
            }),
          ];
          const step = () => {
            if (transitionRef.current !== transition) return;
            const task = queue.shift();
            if (task) {
              task();
              window.requestAnimationFrame(step);
              return;
            }
            transitionRef.current = null;
          };
          window.requestAnimationFrame(step);
        });
      });
      return;
    }

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
        const delay = (PUSH_ORDER[tile.dataset.area ?? ""] ?? 0) * PUSH_STAGGER_MS;
        latestEnd = Math.max(latestEnd, delay + PUSH_MS);

        const incoming = live.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: PUSH_MS, delay, easing, fill: "both" },
        );
        transition.animations.push(incoming);
        finishCleanly(incoming);
        const outgoing = ghost?.animate(
          [{ transform: "none" }, { transform: `translate(${-dx}px, ${-dy}px)` }],
          { duration: PUSH_MS, delay, easing, fill: "both" },
        );
        if (outgoing) transition.animations.push(outgoing);
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
  }, [idx, reduced]);

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
    if (reduced || !grid) {
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
      const ghost = slide.cloneNode(true) as HTMLElement;
      ghost.classList.add("is-ghost");
      ghost.setAttribute("aria-hidden", "true");
      tile.appendChild(ghost);
      ghosts.push(ghost);
    });
    transitionRef.current = { dir: direction, mode: "slide", ghosts, animations: [], timer: null };
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
