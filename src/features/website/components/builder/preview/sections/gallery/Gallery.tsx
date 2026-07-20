import { useEffect, useId, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import type { GalleryConfig, SectionEntry } from "../../../../../types";
import { useInView } from "../../shared/hooks";
import { Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Bento } from "./variants/Bento";
import { Carousel } from "./variants/Carousel";
import { Fan } from "./variants/Fan";
import { Masonry } from "./variants/Masonry";
import { Mosaic } from "./variants/Mosaic";
import { GalleryLightbox } from "./parts/GalleryLightbox";
import type { GalleryImage, GalleryVariantProps } from "./types";
import { resolveGalleryImages } from "../../../gallerySelection";
import "./base.css";

const VARIANTS: Record<string, React.FC<GalleryVariantProps>> = {
  bento: Bento,
  carousel: Carousel,
  masonry: Masonry,
  index: Mosaic,
  fan: Fan,
};

/** Owner portfolio photos rendered through the five executable Gallery treatments from the design source. */
export function Gallery({
  entry,
  data,
  t,
}: {
  entry: SectionEntry;
  data: PreviewData;
  t: T;
  no: string;
}) {
  const config = (entry.config ?? {}) as GalleryConfig;
  const showHeading = config.headingHidden?.[data.locale] !== true;
  const heading = config.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.galleryHeading");
  const images: GalleryImage[] = resolveGalleryImages(config, data.locations).map((image) => ({
    id: image.id,
    src: image.src,
    alt: image.alt,
  }));
  const variant = Object.hasOwn(VARIANTS, entry.variant) ? entry.variant : "bento";
  const View = VARIANTS[variant];
  const headingId = useId();
  const headingWords = heading.split(/\s+/).filter(Boolean);
  const rootRef = useRef<HTMLElement>(null);
  const revealed = useInView(rootRef, { threshold: 0.08, once: true });
  const [lightboxImageId, setLightboxImageId] = useState<string | null>(null);
  const openLightboxIndex = lightboxImageId
    ? images.findIndex((image) => image.id === lightboxImageId)
    : -1;

  const setLightboxIndex = (index: number) => {
    setLightboxImageId(index >= 0 ? images[index]?.id ?? null : null);
  };

  useEffect(() => {
    if (lightboxImageId && openLightboxIndex < 0) setLightboxImageId(null);
  }, [lightboxImageId, openLightboxIndex]);

  return (
    <section
      ref={rootRef}
      className="mc-gallery-section"
      data-gallery={variant}
      data-revealed={revealed ? "1" : "0"}
      {...(showHeading
        ? { "aria-labelledby": headingId }
        : { "aria-label": t("businessPage.builder.preview.galleryHeading") })}
    >
      <div className="mc-gallery-wrap">
        {showHeading ? (
          <header className="mc-gallery-head">
            {/* The source's numbered eyebrow kicker is an intentional no-op (SecKicker returns null). */}
            <h2 id={headingId} className="mc-gallery-title" aria-label={heading}>
              {headingWords.map((word, index) => (
                <span key={`${word}-${index}`} className="mc-gallery-title-word" aria-hidden="true">
                  <span style={{ animationDelay: `${index * 42}ms` }}>{word}</span>
                  {index < headingWords.length - 1 ? "\u00a0" : null}
                </span>
              ))}
            </h2>
          </header>
        ) : null}

        {images.length === 0 ? (
          <Placeholder icon={<ImageOff className="size-4" strokeWidth={1.6} />}>
            {t("businessPage.builder.preview.galleryEmpty")}
          </Placeholder>
        ) : (
          <>
            <View
              images={images}
              onOpen={setLightboxIndex}
              lightboxOpen={openLightboxIndex >= 0}
              lightboxIndex={openLightboxIndex}
              t={t}
            />
            {openLightboxIndex >= 0 ? (
              <GalleryLightbox
                images={images}
                index={openLightboxIndex}
                setIndex={setLightboxIndex}
                rootRef={rootRef}
                brandColor={data.brandColor}
                fontKey={data.fontKey}
                t={t}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
