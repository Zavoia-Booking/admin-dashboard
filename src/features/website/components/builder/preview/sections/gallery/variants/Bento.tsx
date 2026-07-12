import { cn } from "../../../../../../../../shared/lib/utils";
import { ZoomBadge } from "../parts/ZoomBadge";
import type { GalleryVariantProps } from "../types";

const BENTO_CELLS = ["mc-c2 mc-r2", "mc-c2", "mc-c1", "mc-c1", "mc-c2", "mc-c2"];

/** Bento — a mixed-size tile grid (2×2 / 2×1 / 1×1 cells cycling through BENTO_CELLS). */
export function Bento({ images, onOpen }: GalleryVariantProps) {
  return (
    <div className="mc-bento">
      {images.map((g, i) => (
        <div key={i} className={cn("mc-bento-tile mc-mask-in", BENTO_CELLS[i % 6])} style={{ animationDelay: `${(i % 3) * 80}ms` }}>
          <button type="button" className="mc-zoomable block h-full w-full" data-gimg={i} onClick={() => onOpen(i)}>
            <img src={g.src} alt={g.alt} />
            <ZoomBadge />
          </button>
        </div>
      ))}
    </div>
  );
}
