import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { GalleryImage } from "../parts/GalleryImage";
import type { GalleryImage as GalleryImageData, GalleryVariantProps } from "../types";
import "./masonry.css";

const MASONRY_AR = ["3/4", "5/4", "4/5", "3/4", "2/3", "1/1", "4/5", "3/4", "5/4", "4/5", "2/3", "5/6"];

function masonryColCount(width: number, count: number): number {
  const cap = width <= 640 ? 2 : width <= 980 ? 4 : 6;
  const preferred = count <= 4 ? 2 : count <= 6 ? 3 : count <= 8 ? 4 : 6;
  return Math.min(cap, preferred, Math.max(1, count));
}

/** Masonry — shortest-column packing into a measured, responsive column count; each tile a zoomable thumb. */
export function Masonry({ images, onOpen, t }: GalleryVariantProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(() => masonryColCount(1320, images.length));
  const compactSize = images.length <= 4
    ? "small"
    : images.length <= 6
      ? "medium"
      : images.length <= 8
        ? "large"
        : undefined;
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setCols(masonryColCount(el.clientWidth, images.length));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [images.length]);

  // Shortest-column packing: push each tile into the column with the least accumulated aspect-height.
  const columns: { g: GalleryImageData; i: number; ar: string; weight: number }[][] = Array.from(
    { length: cols },
    () => [],
  );
  const heights = new Array(cols).fill(0);
  images.forEach((g, i) => {
    const ar = MASONRY_AR[i % MASONRY_AR.length];
    const [w, h] = ar.split("/").map(Number);
    const weight = h / w;
    let c = 0;
    for (let k = 1; k < cols; k++) if (heights[k] < heights[c]) c = k;
    columns[c].push({ g, i, ar, weight });
    heights[c] += weight;
  });

  return (
    <div
      ref={rootRef}
      className="mc-masonry"
      data-compact-size={compactSize}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {columns.map((col, ci) => (
        <div className="mc-masonry-col" key={ci}>
          {col.map(({ g, i, ar, weight }) => (
            <figure
              className="mc-masonry-tile"
              key={i}
              style={{ "--mc-masonry-weight": weight } as CSSProperties}
            >
              <button
                type="button"
                className="mc-gallery-zoomable mc-masonry-image mc-mask-in"
                data-gimg={i}
                onClick={() => onOpen(i)}
                style={{ aspectRatio: ar, animationDelay: `${(ci % 3) * 70}ms` }}
                aria-label={g.alt || t("businessPage.builder.preview.aria.openGalleryImage", { number: i + 1 })}
              >
                <GalleryImage src={g.src} alt={g.alt} fallbackLabel={t("businessPage.builder.preview.galleryTitle")} />
              </button>
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}
