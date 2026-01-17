import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "../../../shared/components/ui/dialog";
import { cn } from "../../../shared/lib/utils";
import { useTranslation } from "react-i18next";

interface FullScreenImageCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
}

export function FullScreenImageCarousel({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
}: FullScreenImageCarouselProps) {
  const { t } = useTranslation("marketplace");
  const [index, setIndex] = useState(initialIndex);
  const [lastNavDirection, setLastNavDirection] = useState<"next" | "prev" | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keep index in sync when opening / initialIndex changes
  useEffect(() => {
    if (!open) return;
    setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)));
    setLastNavDirection(null);
  }, [open, initialIndex, images.length]);

  // Clamp index if images change while open
  useEffect(() => {
    if (!open) return;
    if (images.length === 0) {
      onOpenChange(false);
      return;
    }
    setIndex((i) => Math.min(i, images.length - 1));
  }, [open, images.length, onOpenChange]);

  const currentUrl = images[index];

  const hasMultiple = images.length > 1;
  const canPrev = hasMultiple;
  const canNext = hasMultiple;

  const goPrev = useCallback(() => {
    setLastNavDirection("prev");
    setIndex((i) =>
      images.length === 0 ? 0 : (i - 1 + images.length) % images.length
    );
  }, [images.length]);

  const goNext = useCallback(() => {
    setLastNavDirection("next");
    setIndex((i) => (images.length === 0 ? 0 : (i + 1) % images.length));
  }, [images.length]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handlePrevClick = useCallback(() => {
    goPrev();
  }, [goPrev]);

  const handleNextClick = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!hasMultiple) return;
      const t = e.touches[0];
      if (!t) return;
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    },
    [hasMultiple]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!hasMultiple) return;
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      // Only trigger when it's clearly a horizontal swipe
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const SWIPE_THRESHOLD_PX = 45;

      if (absX < SWIPE_THRESHOLD_PX || absX < absY) return;

      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev, hasMultiple]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [goNext, goPrev]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const counter = useMemo(() => {
    if (images.length === 0) return "";
    return `${index + 1} / ${images.length}`;
  }, [images.length, index]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50",
            "px-4 py-4 sm:px-28 sm:py-8",
            "outline-none"
          )}
          aria-describedby={undefined}
        >
          {/* Accessibility: required title for Radix Dialog */}
          <DialogPrimitive.Title className="sr-only">
            {t("carousel.title")}
          </DialogPrimitive.Title>

          {/* Main stage - clicking outside the image closes the carousel */}
          <div
            className="relative h-full w-full flex items-center justify-center touch-pan-y cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleClose}
          >
            {/* Top bar (counter left, close right) */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="text-white/80 text-sm font-semibold tracking-widest uppercase">
                {counter}
              </div>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                rounded="full"
                className="!min-h-0 !h-11 !min-w-0 !w-11 backdrop-blur-md bg-black/60 hover:bg-black/70 border border-white/15 text-white"
                onClick={handleClose}
                title={t("carousel.close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>


            {currentUrl ? (
              <img
                key={`${index}-${lastNavDirection ?? "init"}`}
                src={currentUrl}
                alt={t("portfolio.altText.portfolioImage")}
                className={cn(
                  "max-h-full max-w-full object-contain select-none cursor-default",
                  // Subtle slide transition between images
                  lastNavDirection
                    ? cn(
                        "animate-in fade-in-0 duration-250 ease-out",
                        lastNavDirection === "next"
                          ? "slide-in-from-right-80"
                          : "slide-in-from-left-80"
                      )
                    : "animate-in fade-in-0 duration-150 ease-out"
                )}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}

            {/* Left / right controls */}
            <Button
              type="button"
              size="icon"
              variant="secondary"
              rounded="full"
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2",
                "!min-h-0 !h-11 !w-11",
                "backdrop-blur-md bg-black/60 hover:bg-black/70 border border-white/15 text-white",
                !canPrev && "opacity-30 pointer-events-none"
              )}
              onClick={(e) => { e.stopPropagation(); handlePrevClick(); }}
              title={t("carousel.previous")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="secondary"
              rounded="full"
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                "!min-h-0 !h-11 !w-11",
                "backdrop-blur-md bg-black/60 hover:bg-black/70 border border-white/15 text-white",
                !canNext && "opacity-30 pointer-events-none"
              )}
              onClick={(e) => { e.stopPropagation(); handleNextClick(); }}
              title={t("carousel.next")}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

