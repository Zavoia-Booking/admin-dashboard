import { Check, Image as ImageIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import { cn } from "../../../../shared/lib/utils";
import type {
  GalleryImageRef,
  WebsiteBuilderLocation,
} from "../../types";
import {
  collectGalleryImages,
  galleryImageRefId,
  type ResolvedGalleryImage,
} from "./gallerySelection";

interface LocationPortfolioPhotoPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: WebsiteBuilderLocation[];
  selectedRef?: GalleryImageRef | null;
  onSelect: (ref: GalleryImageRef) => void;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  featuredLabel: string;
  getPhotoCountLabel: (count: number) => string;
  managePhotosHref?: string;
  managePhotosLabel?: string;
  getPhotoLabel: (image: ResolvedGalleryImage) => string;
}

/**
 * Reusable single-photo chooser for Website sections that source imagery from
 * location portfolios. The dialog owns grouping, selection feedback, scrolling,
 * and empty-state presentation; section-specific copy and persistence stay with
 * the caller.
 */
export function LocationPortfolioPhotoPickerDialog({
  open,
  onOpenChange,
  locations,
  selectedRef,
  onSelect,
  title,
  description,
  emptyTitle,
  emptyDescription,
  featuredLabel,
  getPhotoCountLabel,
  managePhotosHref,
  managePhotosLabel,
  getPhotoLabel,
}: LocationPortfolioPhotoPickerDialogProps) {
  const groups = useMemo(
    () => locations
      .map((location) => ({ location, images: collectGalleryImages([location]) }))
      .filter((group) => group.images.length > 0),
    [locations],
  );
  const selectedImageId = selectedRef ? galleryImageRefId(selectedRef) : null;

  const selectPhoto = (image: ResolvedGalleryImage) => {
    onSelect(image.ref);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[72]"
        className="z-[73] flex max-h-[calc(100dvh-2rem)] w-full max-w-[min(44rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden border-border bg-surface p-0 sm:max-h-[min(42rem,calc(100dvh-4rem))] sm:max-w-[44rem]"
      >
        <DialogHeader className="border-b border-border-subtle px-5 py-5 pr-12 text-left">
          <DialogTitle className="text-[18px] leading-tight">{title}</DialogTitle>
          <DialogDescription className="max-w-[65ch] text-pretty text-[12px] leading-[1.55] text-foreground-3">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {groups.length > 0 ? (
            <div className="space-y-5">
              {groups.map(({ location, images }) => (
                <section key={location.id} className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-3 border-b border-border-subtle pb-2">
                    <h3 className="truncate text-[11px] font-semibold text-foreground-1">
                      {location.name}
                    </h3>
                    <span className="shrink-0 text-[10px] text-foreground-3">
                      {getPhotoCountLabel(images.length)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {images.map((image) => {
                      const selected = selectedImageId === image.id;
                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => selectPhoto(image)}
                          aria-label={getPhotoLabel(image)}
                          aria-pressed={selected}
                          className={cn(
                            "group relative block aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border bg-surface-hover outline-none transition-[border-color,opacity] duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                            selected ? "border-foreground-1" : "border-border",
                          )}
                        >
                          <img
                            src={image.src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                          />
                          {image.featured ? (
                            <span className="absolute left-2 top-2 rounded-full bg-surface/95 px-2 py-1 text-[9px] font-semibold text-foreground-1 shadow-sm">
                              {featuredLabel}
                            </span>
                          ) : null}
                          {selected ? (
                            <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-surface text-foreground-1 shadow-sm ring-1 ring-border">
                              <Check className="size-4" strokeWidth={2.4} aria-hidden />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <ImageIcon className="mx-auto size-5 text-foreground-3" strokeWidth={1.5} aria-hidden />
              <p className="mt-2 text-[12px] font-medium text-foreground-1">{emptyTitle}</p>
              <p className="mx-auto mt-1 max-w-[42ch] text-pretty text-[11px] leading-[1.55] text-foreground-3">
                {emptyDescription}
              </p>
              {managePhotosHref && managePhotosLabel ? (
                <Button asChild variant="outline" size="sm" className="mt-3 shadow-none">
                  <Link to={managePhotosHref}>{managePhotosLabel}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
