import type { T } from "../../shared/types";

/** A single gallery photo: source URL + alt text (the design carries no visible captions). */
export type GalleryImage = { src: string; alt: string };

/** Props every gallery layout variant receives from the orchestrator. Variants destructure only what they
 *  use (the grid layouts ignore `t`); `onOpen(i)` raises the shared lightbox at image `i`. */
export type GalleryVariantProps = {
  images: GalleryImage[];
  onOpen: (i: number) => void;
  t: T;
};
