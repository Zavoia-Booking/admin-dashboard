import type { T } from "../../shared/types";

/** Stable source identity plus presentation data (the design carries no visible captions). */
export type GalleryImage = { id: string; src: string; alt: string };

/** Props every gallery layout receives from the orchestrator; `onOpen(i)` raises the shared lightbox. */
export type GalleryVariantProps = {
  images: GalleryImage[];
  onOpen: (i: number) => void;
  /** Fan pauses its idle wave/auto-advance while the shared lightbox is open. */
  lightboxOpen: boolean;
  /** Current fullscreen image, used by stateful layouts to keep the return target mounted. */
  lightboxIndex: number;
  t: T;
};
