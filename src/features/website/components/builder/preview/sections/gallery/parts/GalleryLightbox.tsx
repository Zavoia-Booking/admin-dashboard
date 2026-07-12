import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";
import { cn } from "../../../../../../../../shared/lib/utils";
import { previewVars } from "../../../../theme";
import type { T } from "../../../shared/types";
import { prefersReducedMotion } from "../../../shared/util";
import type { GalleryImage } from "../types";

/** WAAPI shared-element morph between a thumbnail rect and the centered lightbox rect. */
function lightboxMorph(
  src: string,
  from: DOMRect,
  to: { left: number; top: number; width: number; height: number },
  dur: number,
  onDone: () => void,
) {
  const el = document.createElement("div");
  el.className = "mc-lbox-morph";
  el.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;background-image:url("${src}")`;
  document.body.appendChild(el);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.remove();
    onDone();
  };
  const anim = el.animate(
    [
      { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` },
      { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` },
    ],
    { duration: dur, easing: "cubic-bezier(.19,1,.22,1)", fill: "forwards" },
  );
  anim.onfinish = finish;
  // Safety net in case onfinish never fires (e.g. tab backgrounded).
  setTimeout(finish, dur + 120);
}

/** Contain-fit natural dims into 88vw × 80vh, centered (mirrors the source's targetRect). */
function lightboxRect(natW: number, natH: number) {
  const w0 = natW || 4;
  const h0 = natH || 3;
  const maxW = window.innerWidth * 0.88;
  const maxH = window.innerHeight * 0.8;
  const scale = Math.min(maxW / w0, maxH / h0);
  const width = w0 * scale;
  const height = h0 * scale;
  return { left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2, width, height };
}

export function GalleryLightbox({
  images,
  index,
  setIndex,
  rootRef,
  brandColor,
  fontKey,
  t,
}: {
  images: GalleryImage[];
  index: number;
  setIndex: (i: number) => void;
  rootRef: React.RefObject<HTMLElement | null>;
  brandColor: string;
  fontKey: string;
  t: T;
}) {
  const [dir, setDir] = useState(0);
  const [figVisible, setFigVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const figRef = useRef<HTMLImageElement>(null);
  // Synchronous re-entry guard for close(): a double backdrop-click / double-Escape during the 440ms close
  // window would otherwise spawn a second morph clone (mirrors the source's closingRef).
  const closingRef = useRef(false);

  const thumbFor = useCallback(
    (i: number): HTMLImageElement | null => rootRef.current?.querySelector(`[data-gimg="${i}"] img`) ?? null,
    [rootRef],
  );

  // Open: morph the source thumbnail up to the centered frame, then reveal the real image.
  useLayoutEffect(() => {
    const thumb = thumbFor(index);
    const cur = images[index];
    if (prefersReducedMotion() || !thumb || !cur) {
      setFigVisible(true);
      return;
    }
    setFigVisible(false);
    const from = thumb.getBoundingClientRect();
    const to = lightboxRect(thumb.naturalWidth, thumb.naturalHeight);
    lightboxMorph(cur.src, from, to, 540, () => setFigVisible(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const thumb = thumbFor(index);
    const fig = figRef.current;
    const cur = images[index];
    if (prefersReducedMotion() || !thumb || !fig || !cur) {
      setIndex(-1);
      return;
    }
    setClosing(true);
    setFigVisible(false);
    lightboxMorph(cur.src, fig.getBoundingClientRect(), thumb.getBoundingClientRect(), 440, () => setIndex(-1));
  }, [index, images, setIndex, thumbFor]);

  const nav = useCallback(
    (d: number) => {
      const next = index + d;
      if (next < 0 || next >= images.length) return;
      setDir(d);
      setFigVisible(true);
      setIndex(next);
    },
    [index, images.length, setIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") nav(1);
      else if (e.key === "ArrowLeft") nav(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [close, nav]);

  const num = (x: number) => String(x).padStart(2, "0");

  // Owner data is live: if the portfolio shrinks while the lightbox is open (e.g. a cross-tab in-flight
  // image delete lands), index can fall out of range. Bail rather than deref undefined; the parent's
  // clamp effect then resets the index and unmounts.
  const cur = images[index];
  if (!cur) return null;

  return createPortal(
    <div
      className={cn("mc-lbox", closing && "is-closing")}
      style={{ ...previewVars(brandColor, fontKey) }}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div className="mc-lbox-bar" onClick={(e) => e.stopPropagation()}>
        <span className="mc-lbox-count">
          <span className="mc-lbox-n" key={index}>
            {num(index + 1)}
          </span>{" "}
          <span>/ {num(images.length)}</span>
        </span>
        <button
          type="button"
          className="mc-lbox-close"
          onClick={close}
          aria-label={t("businessPage.builder.preview.aria.closeGallery")}
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
      </div>
      <button
        type="button"
        className="mc-lbox-nav mc-lbox-prev"
        disabled={index === 0}
        onClick={(e) => {
          e.stopPropagation();
          nav(-1);
        }}
        aria-label={t("businessPage.builder.preview.aria.previousImage")}
      >
        <ArrowRight className="h-[22px] w-[22px]" style={{ transform: "rotate(180deg)" }} strokeWidth={1.8} />
      </button>
      <figure className="mc-lbox-fig" onClick={(e) => e.stopPropagation()} style={{ opacity: figVisible ? 1 : 0 }}>
        <span className="mc-lbox-swap" key={index} data-dir={dir}>
          <img ref={figRef} src={cur.src} alt={cur.alt} />
        </span>
      </figure>
      <button
        type="button"
        className="mc-lbox-nav mc-lbox-next"
        disabled={index === images.length - 1}
        onClick={(e) => {
          e.stopPropagation();
          nav(1);
        }}
        aria-label={t("businessPage.builder.preview.aria.nextImage")}
      >
        <ArrowRight className="h-[22px] w-[22px]" strokeWidth={1.8} />
      </button>
    </div>,
    document.body,
  );
}
