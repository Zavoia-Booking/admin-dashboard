import { cn } from "../../../../../../../../shared/lib/utils";
import { GalleryImage } from "../parts/GalleryImage";
import type { GalleryVariantProps } from "../types";
import "./bento.css";

const BENTO_CELLS = [
  "mc-bento-feature",
  "mc-bento-wide",
  "mc-bento-small",
  "mc-bento-small",
  "mc-bento-small",
  "mc-bento-small",
  "mc-bento-small",
  "mc-bento-small",
];

/** Bento — an eight-image editorial rhythm with alternating feature placement. */
export function Bento({ images, onOpen, t }: GalleryVariantProps) {
  return (
    <div className="mc-bento">
      {images.map((g, i) => (
        <div
          key={i}
          className={cn("mc-bento-tile mc-mask-in", BENTO_CELLS[i % BENTO_CELLS.length])}
          style={{ animationDelay: `${(i % 3) * 80}ms` }}
        >
          <button
            type="button"
            className="mc-gallery-zoomable mc-bento-image"
            data-gimg={i}
            onClick={() => onOpen(i)}
            aria-label={g.alt || t("businessPage.builder.preview.aria.openGalleryImage", { number: i + 1 })}
          >
            <GalleryImage src={g.src} alt={g.alt} fallbackLabel={t("businessPage.builder.preview.galleryTitle")} />
          </button>
        </div>
      ))}
    </div>
  );
}
