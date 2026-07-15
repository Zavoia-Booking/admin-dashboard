import { ZoomBadge } from "../parts/ZoomBadge";
import type { GalleryVariantProps } from "../types";

const ESSAY_SPANS = [7, 5, 4, 8, 6, 6];
const ESSAY_AR = ["7/5", "4/5", "4/5", "16/9", "3/2", "3/2"];
const ESSAY_TOPS = ["0", "0", "clamp(14px,3cqw,48px)", "clamp(14px,3cqw,48px)", "0", "0"];

/** Editorial essay (default) — an asymmetric grid of staggered figures with varied spans, aspect ratios,
 *  and top offsets; each is a zoomable thumbnail that opens the shared lightbox. */
export function Editorial({ images, onOpen }: GalleryVariantProps) {
  return (
    <div className="mc-essay">
      {images.map((g, i) => (
        <figure key={i} style={{ gridColumn: `span ${ESSAY_SPANS[i % 6]}`, marginTop: ESSAY_TOPS[i % 6] }}>
          <button
            type="button"
            className="mc-zoomable mc-mask-in block w-full"
            data-gimg={i}
            onClick={() => onOpen(i)}
            style={{ aspectRatio: ESSAY_AR[i % 6], animationDelay: `${(i % 2) * 100}ms` }}
          >
            <img src={g.src} alt={g.alt} loading="lazy" decoding="async" />
            <ZoomBadge />
          </button>
        </figure>
      ))}
    </div>
  );
}
