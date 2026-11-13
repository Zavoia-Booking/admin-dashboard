import { cn } from "../../../../../../../../shared/lib/utils";
import { GalleryImage } from "../parts/GalleryImage";
import type { GalleryVariantProps } from "../types";
import "./bento.css";

const BENTO_CELLS: Record<number, readonly string[]> = {
  1: ["full"],
  2: ["wide", "wide"],
  3: ["feature", "wide", "wide"],
  4: ["feature", "wide", "small", "small"],
  5: ["feature", "small", "small", "small", "small"],
  6: ["feature", "wide", "small", "small", "wide", "wide"],
  7: ["feature", "wide", "small", "small", "wide", "small", "small"],
  8: ["feature", "wide", "small", "small", "small", "small", "small", "small"],
};

/** Preserve full eight-photo compositions; shorter groups get complete, balanced rows. */
export function Bento({ images, onOpen, t }: GalleryVariantProps) {
  const groups: { start: number; images: GalleryVariantProps["images"] }[] = [];
  for (let start = 0; start < images.length;) {
    const remaining = images.length - start;
    // Leave at least four photos for the final group instead of orphaning one to three.
    const count = remaining > 8 && remaining < 12 ? remaining - 4 : Math.min(8, remaining);
    groups.push({ start, images: images.slice(start, start + count) });
    start += count;
  }

  return (
    <div className="mc-bento">
      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="mc-bento-group"
          data-count={group.images.length}
          data-mirrored={groupIndex % 2 === 1 ? "true" : undefined}
        >
          {group.images.map((g, cellIndex) => {
            const index = group.start + cellIndex;
            return (
              <div
                key={index}
                className={cn("mc-bento-tile mc-mask-in", `mc-bento-${BENTO_CELLS[group.images.length][cellIndex]}`)}
                style={{ animationDelay: `${(index % 3) * 80}ms` }}
              >
                <button
                  type="button"
                  className="mc-gallery-zoomable mc-bento-image"
                  data-gimg={index}
                  onClick={() => onOpen(index)}
                  aria-label={g.alt || t("businessPage.builder.preview.aria.openGalleryImage", { number: index + 1 })}
                >
                  <GalleryImage src={g.src} alt={g.alt} fallbackLabel={t("businessPage.builder.preview.galleryTitle")} />
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
