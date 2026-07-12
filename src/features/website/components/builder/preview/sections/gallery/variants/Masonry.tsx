import { useEffect, useRef, useState } from "react";
import { ZoomBadge } from "../parts/ZoomBadge";
import type { GalleryImage, GalleryVariantProps } from "../types";

const MASONRY_AR = ["3/4", "5/4", "4/5", "3/4", "2/3", "1/1", "4/5", "3/4", "5/4", "4/5", "2/3", "5/6"];

function masonryColCount(width: number, count: number): number {
  const cap = width <= 480 ? 2 : width <= 820 ? 3 : 4;
  return Math.min(cap, count <= 3 ? 2 : count <= 7 ? 3 : 4);
}

/** Masonry — shortest-column packing into a measured, responsive column count; each tile a zoomable thumb. */
export function Masonry({ images, onOpen }: GalleryVariantProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setCols(masonryColCount(el.clientWidth, images.length));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [images.length]);

  // Shortest-column packing: push each tile into the column with the least accumulated aspect-height.
  const columns: { g: GalleryImage; i: number; ar: string }[][] = Array.from({ length: cols }, () => []);
  const heights = new Array(cols).fill(0);
  images.forEach((g, i) => {
    const ar = MASONRY_AR[i % MASONRY_AR.length];
    const [w, h] = ar.split("/").map(Number);
    let c = 0;
    for (let k = 1; k < cols; k++) if (heights[k] < heights[c]) c = k;
    columns[c].push({ g, i, ar });
    heights[c] += h / w;
  });

  return (
    <div ref={rootRef} className="mc-masonry" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {columns.map((col, ci) => (
        <div className="mc-masonry-col" key={ci}>
          {col.map(({ g, i, ar }) => (
            <figure className="mc-masonry-tile" key={i}>
              <button
                type="button"
                className="mc-zoomable mc-mask-in block w-full"
                data-gimg={i}
                onClick={() => onOpen(i)}
                style={{ aspectRatio: ar, animationDelay: `${(ci % 3) * 70}ms` }}
              >
                <img src={g.src} alt={g.alt} />
                <ZoomBadge />
              </button>
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}
