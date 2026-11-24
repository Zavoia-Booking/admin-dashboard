import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight } from "lucide-react";
import { StaticPreviewContext, useInView, useReducedMotion } from "../../../shared/hooks";
import { GalleryImage } from "../parts/GalleryImage";
import { useGalleryFan } from "../parts/useGalleryFan";
import type { GalleryVariantProps } from "../types";
import "./mosaic.css";

const COLUMN_WEIGHTS = [1, 1.3, 1.08, 0.92];
const TILE_WEIGHTS = [1, 1.45, 0.8, 1.2, 0.9, 1.3];
const formatCount = (value: number) => String(value).padStart(2, "0");
/** Sized for full view, the widest a photo gets, so its file never changes while tiles resize. */
const PHOTO_SIZES = "(max-width: 1400px) 100vw, 1400px";
const paneTransform = (page: number, pos: number, unit: number) =>
  `translate3d(${((page - pos) * unit).toFixed(2)}px, 0, 0)`;
/** A page waiting beside the wall, not sliding in or out: mounted and loaded, but left unpainted. */
const isParked = (page: number, pos: number) => Math.abs(page - pos) >= 1;
/** Everything rendered from the pager position: the mounted page range and the active page. */
const pagePositionKey = (pos: number, pages: number) => {
  const max = pages - 1;
  return `${Math.max(0, Math.floor(pos))}:${Math.min(max, Math.ceil(pos))}:${Math.max(0, Math.min(max, Math.round(pos)))}`;
};

function useReducedMotionPreference() {
  // Shared hook: OS preference + static thumbnails.
  return useReducedMotion();
}

/** Fluid photo wall: focus expands in place, a second press takes over, and large sets page as one conveyor. */
export function Mosaic({ images, t }: GalleryVariantProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const downTileRef = useRef(-1);
  const previousPageRef = useRef(0);
  const reducedMotion = useReducedMotionPreference();
  const staticPreview = useContext(StaticPreviewContext);
  const onScreen = useInView(stageRef, { threshold: 0, once: true });
  // Once the wall is on screen, the neighbouring pages stay mounted and load early, so a page change never waits for photos.
  const loadAhead = onScreen && !staticPreview;
  const [rootWidth, setRootWidth] = useState(1000);
  const [paneWidth, setPaneWidth] = useState(0);
  const [focused, setFocused] = useState(0);
  const [full, setFull] = useState(false);

  const mobile = rootWidth <= 760;
  const pageSize = rootWidth <= 640 ? 3 : rootWidth <= 1024 ? 4 : 6;
  const pages = Math.max(1, Math.ceil(images.length / pageSize));
  const gap = mobile ? 8 : 10;
  const unit = (paneWidth || 1) + gap;
  const paneNodesRef = useRef(new Map<number, HTMLDivElement>());
  const frameRef = useRef({ unit, pages, key: "" });
  // Swipe frames move the mounted panes directly; React renders only when the mounted or active page changes.
  const applyFrame = useCallback((pos: number) => {
    const frame = frameRef.current;
    paneNodesRef.current.forEach((pane, page) => {
      pane.style.transform = paneTransform(page, pos, frame.unit);
      pane.style.visibility = isParked(page, pos) ? "hidden" : "";
    });
    return pagePositionKey(pos, frame.pages) !== frame.key;
  }, []);
  const pager = useGalleryFan(pages, unit, { reducedMotion, onFrame: applyFrame });
  // The page the wall last rested on: its neighbours change while the wall is still, never mid-swipe.
  const [restPage, setRestPage] = useState(pager.active);
  if (!pager.dragging && pager.pos === pager.active && restPage !== pager.active) setRestPage(pager.active);

  useLayoutEffect(() => {
    frameRef.current = { unit, pages, key: pagePositionKey(pager.pos, pages) };
    // React skips unchanged style props, so re-apply the committed position to every mounted pane.
    applyFrame(pager.pos);
  });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const box = boxRef.current;
    if (!stage || !box) return;
    const root = stage.closest<HTMLElement>(".mc-root") ?? stage;
    const measure = () => {
      setRootWidth(root.clientWidth || stage.clientWidth || 1000);
      setPaneWidth(box.clientWidth);
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    pager.goTo(0);
    previousPageRef.current = 0;
    setFocused(0);
    setFull(false);
  }, [pageSize, pager.goTo]);

  useEffect(() => {
    if (previousPageRef.current === pager.active) return;
    previousPageRef.current = pager.active;
    setFocused(pager.active * pageSize);
    setFull(false);
  }, [pageSize, pager.active]);

  useEffect(() => {
    if (!full) return;
    const collapse = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFull(false);
    };
    document.addEventListener("keydown", collapse);
    return () => document.removeEventListener("keydown", collapse);
  }, [full]);

  const isInPage = (index: number, page: number) =>
    index >= page * pageSize && index < Math.min(images.length, page * pageSize + pageSize);
  const pageLead = Math.min(pager.active * pageSize, images.length - 1);
  const focusedInPage = isInPage(focused, pager.active) ? focused : pageLead;

  const selectTile = (index: number) => {
    if (index === focusedInPage) setFull((value) => !value);
    else {
      setFocused(index);
      setFull(false);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || pager.dragging) return;
    const tile = (event.target as Element).closest<HTMLButtonElement>("button[data-gimg]");
    downTileRef.current = tile ? Number(tile.dataset.gimg) : -1;
    if (pages > 1 && !full) pager.stageProps.onPointerDown(event);
  };

  const handleStageClick = () => {
    const index = downTileRef.current;
    downTileRef.current = -1;
    if (index < 0 || pager.moved() || !isInPage(index, pager.active)) return;
    selectTile(index);
  };

  const handleTileClick = (event: ReactMouseEvent<HTMLButtonElement>, index: number) => {
    // Pointer presses are routed through the capture-owning stage; keyboard activation stays native.
    if (event.detail !== 0) return;
    event.stopPropagation();
    selectTile(index);
  };

  const buildGrid = (page: number, pageFocus: number, pageFull: boolean, interactive: boolean) => {
    const start = page * pageSize;
    const indices = Array.from(
      { length: Math.min(images.length, start + pageSize) - start },
      (_, offset) => start + offset,
    );
    const count = indices.length;
    const columnCount = mobile ? (count <= 1 ? 1 : 2) : count <= 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 3 : 4;
    const columns: number[][] = Array.from({ length: columnCount }, () => []);
    indices.forEach((index, position) => columns[position % columnCount].push(index));
    const focusedColumn = columns.findIndex((column) => column.includes(pageFocus));

    return (
      <div className="mc-galmosaic-grid">
        {columns.map((column, columnIndex) => {
          const columnGrow = pageFull
            ? columnIndex === focusedColumn
              ? 1
              : 0
            : columnIndex === focusedColumn
              ? 2.9
              : COLUMN_WEIGHTS[columnIndex % COLUMN_WEIGHTS.length] * 0.82;

          return (
            <div key={columnIndex} className="mc-galmosaic-column" style={{ flexGrow: columnGrow }}>
              {column.map((index, row) => {
                const image = images[index];
                const isFocused = index === pageFocus;
                const tileGrow =
                  columnIndex === focusedColumn
                    ? isFocused
                      ? pageFull
                        ? 1
                        : 3.1
                      : pageFull
                        ? 0
                        : 0.55
                    : TILE_WEIGHTS[(index + row) % TILE_WEIGHTS.length];
                const labelKey = isFocused
                  ? pageFull
                    ? "collapseGalleryImage"
                    : "expandGalleryImage"
                  : "focusGalleryImage";
                const tileInteractive = interactive && (!pageFull || isFocused);

                return (
                  <button
                    key={index}
                    type="button"
                    className="mc-galmosaic-tile"
                    data-gimg={index}
                    data-focused={isFocused ? "1" : "0"}
                    data-full={pageFull && isFocused ? "1" : "0"}
                    data-suppressed={pageFull && !isFocused ? "1" : "0"}
                    tabIndex={tileInteractive ? 0 : -1}
                    aria-disabled={!tileInteractive}
                    aria-label={t(`businessPage.builder.preview.aria.${labelKey}`, { number: index + 1 })}
                    aria-expanded={isFocused ? pageFull : undefined}
                    style={{ flexGrow: tileGrow }}
                    onClick={(event) => {
                      if (tileInteractive) handleTileClick(event, index);
                    }}
                  >
                    <GalleryImage
                      src={image.src}
                      alt={image.alt}
                      fallbackLabel={t("businessPage.builder.preview.galleryTitle")}
                      sizes={PHOTO_SIZES}
                      loading={loadAhead ? "eager" : "lazy"}
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const firstVisible = Math.floor(pager.pos);
  const lastVisible = Math.ceil(pager.pos);
  const lowPage = Math.max(0, loadAhead ? Math.min(firstVisible, restPage - 1) : firstVisible);
  const highPage = Math.min(pages - 1, loadAhead ? Math.max(lastVisible, restPage + 1) : lastVisible);
  const mountedPages = Array.from({ length: highPage - lowPage + 1 }, (_, offset) => lowPage + offset);

  // Photos on parked pages are decoded ahead, so they paint in the first frame of a page change.
  useEffect(() => {
    if (!loadAhead) return;
    for (let page = lowPage; page <= highPage; page++) {
      if (page === restPage) continue;
      paneNodesRef.current.get(page)?.querySelectorAll("img").forEach((image) => {
        image.decode().catch(() => undefined);
      });
    }
  }, [loadAhead, lowPage, highPage, restPage]);
  const pagingProps = pages > 1 && !full ? pager.stageProps : {};

  return (
    <div className="mc-galmosaic">
      <div
        ref={stageRef}
        className="mc-galmosaic-stage mc-mask-in"
        role="group"
        aria-label={t("businessPage.builder.preview.galleryTitle")}
        data-drag={pager.dragging ? "1" : "0"}
        data-full={full ? "1" : "0"}
        data-paged={pages > 1 ? "1" : "0"}
        {...pagingProps}
        onPointerDown={handlePointerDown}
        onClick={handleStageClick}
      >
        <div ref={boxRef} className="mc-galmosaic-box">
          {mountedPages.map((page) => {
            const activePage = page === pager.active;
            return (
              <div
                key={page}
                ref={(node) => {
                  if (node) paneNodesRef.current.set(page, node);
                  else paneNodesRef.current.delete(page);
                }}
                className="mc-galmosaic-pane"
                aria-hidden={!activePage}
                style={{
                  width: `${paneWidth}px`,
                  transform: paneTransform(page, pager.pos, unit),
                  visibility: isParked(page, pager.pos) ? "hidden" : undefined,
                }}
              >
                {buildGrid(
                  page,
                  activePage ? focusedInPage : page * pageSize,
                  activePage ? full : false,
                  activePage && !pager.dragging,
                )}
              </div>
            );
          })}
        </div>
      </div>

      {pages > 1 && (
        <div className="mc-galmosaic-foot mc-mask-in">
          <div className="mc-galmosaic-count" aria-live="polite">
            <span className="mc-galmosaic-count-current">{formatCount(pager.active + 1)}</span>
            <span className="mc-galmosaic-count-total">/ {formatCount(pages)}</span>
          </div>
          <div className="mc-gallery-arrows">
            <button
              type="button"
              className="mc-gallery-arrow"
              disabled={pager.active === 0}
              onClick={() => pager.goTo(pager.active - 1)}
              aria-label={t("businessPage.builder.preview.aria.previousGalleryPage")}
            >
              <ArrowRight className="size-[18px] rotate-180" strokeWidth={1.8} aria-hidden />
            </button>
            <button
              type="button"
              className="mc-gallery-arrow"
              disabled={pager.active === pages - 1}
              onClick={() => pager.goTo(pager.active + 1)}
              aria-label={t("businessPage.builder.preview.aria.nextGalleryPage")}
            >
              <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
