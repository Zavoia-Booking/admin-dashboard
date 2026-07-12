import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import type { SectionEntry, GalleryConfig } from "../../../../../types";
import { Section, SectionHead, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Editorial } from "./variants/Editorial";
import { Bento } from "./variants/Bento";
import { Masonry } from "./variants/Masonry";
import { Carousel } from "./variants/Carousel";
import { GalleryLightbox } from "./parts/GalleryLightbox";
import type { GalleryImage, GalleryVariantProps } from "./types";
import "./gallery.css";

// Gallery — owner portfolio photos flattened across the locations, rendered in one of four layouts over a
// shared fullscreen lightbox (shared-element morph). Each layout is its own component under variants/; the
// shared lightbox + zoom badge live under parts/. `originalName` (if any) is alt text only — no captions.
const GALLERY_MAX = 16;

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the editorial default.
const VARIANTS: Record<string, React.FC<GalleryVariantProps>> = {
  editorial: Editorial,
  bento: Bento,
  masonry: Masonry,
  carousel: Carousel,
};

export function Gallery({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const cfg = (entry.config ?? {}) as GalleryConfig;
  const heading = cfg.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.galleryHeading");
  const images: GalleryImage[] = data.locations
    .flatMap((l) => (l.portfolioImages ?? []).map((p) => ({ src: p.url, alt: p.originalName ?? "" })))
    .slice(0, GALLERY_MAX);
  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Editorial;
  const rootRef = useRef<HTMLDivElement>(null);
  const [lbIndex, setLbIndex] = useState(-1);
  const onOpen = (i: number) => setLbIndex(i);

  // Photos are live owner data; if they shrink out from under an open lightbox, snap it shut so the
  // child never renders an out-of-range index.
  useEffect(() => {
    if (lbIndex >= 0 && lbIndex >= images.length) setLbIndex(-1);
  }, [images.length, lbIndex]);

  return (
    <Section>
      <SectionHead no={no} kicker={t("businessPage.builder.preview.kicker.gallery")} heading={heading} />
      {images.length === 0 ? (
        <Placeholder icon={<ImageOff className="h-4 w-4" strokeWidth={1.6} />}>
          {t("businessPage.builder.preview.galleryEmpty")}
        </Placeholder>
      ) : (
        <div ref={rootRef}>
          <View images={images} onOpen={onOpen} t={t} />
          {lbIndex >= 0 && (
            <GalleryLightbox
              images={images}
              index={lbIndex}
              setIndex={setLbIndex}
              rootRef={rootRef}
              brandColor={data.brandColor}
              fontKey={data.fontKey}
            />
          )}
        </div>
      )}
    </Section>
  );
}
