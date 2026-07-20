import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight } from "lucide-react";
import { useInView } from "../../../shared/hooks";
import { prefersReducedMotion } from "../../../shared/util";
import { useGalleryFan, useGalleryFanSpread } from "../parts/useGalleryFan";
import type { GalleryVariantProps } from "../types";
import "./fan.css";

type FanProps = GalleryVariantProps & {
  frozen?: boolean;
};

const formatCount = (value: number) => String(value).padStart(2, "0");

function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

/** Undulating, slice-bent portrait wall with direct drag, idle drift, and lightbox handoff. */
export function Fan({ images, onOpen, t, lightboxOpen, lightboxIndex, frozen = false }: FanProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const downIndexRef = useRef(-1);
  const directionRef = useRef(1);
  const optionPrefix = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotionPreference();
  const inView = useInView(stageRef, { threshold: 0.05 });
  const [hovered, setHovered] = useState(false);
  const [phase, setPhase] = useState(0);
  const [geometry, setGeometry] = useState({ width: 1000, stageHeight: 0 });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const root = stage.closest<HTMLElement>(".mc-root") ?? stage;
    const measure = () => {
      const width = root.clientWidth || stage.clientWidth || 1000;
      const stageHeight = stage.getBoundingClientRect().height;
      setGeometry((current) =>
        current.width === width && current.stageHeight === stageHeight ? current : { width, stageHeight },
      );
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    if (root !== stage) observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const cardWidth =
    geometry.width > 1024
      ? Math.min(330, Math.max(190, geometry.width * 0.235))
      : geometry.stageHeight
        ? Math.min(
            geometry.stageHeight * 0.62 * (5 / 7),
            geometry.width * (geometry.width <= 700 ? 0.66 : 0.46),
          )
        : geometry.width * (geometry.width <= 700 ? 0.6 : 0.36);
  const step = cardWidth * 1.045;
  const fan = useGalleryFan(images.length, step, { reducedMotion });
  const spread = useGalleryFanSpread(stageRef, reducedMotion);

  useLayoutEffect(() => {
    if (lightboxOpen && lightboxIndex >= 0) {
      fan.jumpTo(lightboxIndex);
    }
  }, [fan.jumpTo, lightboxIndex, lightboxOpen]);

  useEffect(() => {
    if (reducedMotion || frozen || lightboxOpen || !inView) return;
    const timer = window.setInterval(() => {
      setPhase(0.5 * Math.sin(performance.now() * 0.00075));
    }, 50);
    return () => window.clearInterval(timer);
  }, [frozen, inView, lightboxOpen, reducedMotion]);

  useEffect(() => {
    if (
      reducedMotion ||
      hovered ||
      fan.dragging ||
      frozen ||
      lightboxOpen ||
      !inView ||
      images.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      let direction = directionRef.current;
      let next = fan.active + direction;
      if (next > images.length - 1) {
        direction = -1;
        next = images.length - 2;
      } else if (next < 0) {
        direction = 1;
        next = 1;
      }
      directionRef.current = direction;
      fan.goTo(next);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [fan.active, fan.dragging, fan.goTo, frozen, hovered, images.length, inView, lightboxOpen, reducedMotion]);

  const slices = 16;
  const visibleRange = 4.2;
  const amplitude = cardWidth * 0.56;
  const frequency = 1.6;
  const decay = 3;
  const recession = cardWidth * 0.2;
  const sliceWidth = cardWidth / slices;
  const zAt = (position: number) =>
    amplitude * Math.cos(position * frequency - phase) * Math.exp(-Math.abs(position) / decay) -
    recession * position * position;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const card = (event.target as Element).closest<HTMLElement>(".mc-galfan-card");
    downIndexRef.current = card ? Number(card.dataset.gimg) : -1;
    fan.stageProps.onPointerDown(event);
  };

  const handleStageClick = () => {
    const index = downIndexRef.current;
    downIndexRef.current = -1;
    if (index < 0 || fan.moved()) return;
    if (index === fan.active) onOpen(index);
    else fan.goTo(index);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    fan.stageProps.onKeyDown(event);
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen(fan.active);
  };

  return (
    <div className="mc-galfan">
      <div
        ref={stageRef}
        className="mc-galfan-stage mc-mask-in"
        role="listbox"
        tabIndex={0}
        aria-label={t("businessPage.builder.preview.galleryTitle")}
        aria-orientation="horizontal"
        aria-activedescendant={`${optionPrefix}-option-${fan.active}`}
        data-drag={fan.dragging ? "1" : "0"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        {...fan.stageProps}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onClick={handleStageClick}
      >
        {images.map((image, index) => {
          const offset = index - fan.pos;
          const distance = Math.abs(offset);
          if (distance > visibleRange) return null;

          const selected = index === fan.active;
          const centered = distance < 0.5;
          const cardX = offset * step * spread;
          return (
            <figure
              key={index}
              id={`${optionPrefix}-option-${index}`}
              className="mc-galfan-card"
              role="option"
              aria-label={image.alt || t("businessPage.builder.preview.aria.openGalleryImage", { number: index + 1 })}
              aria-selected={selected}
              data-gimg={index}
              data-on={centered ? "1" : "0"}
              style={{
                width: `${cardWidth}px`,
                transform: `translate(-50%, -50%) translateX(${cardX.toFixed(1)}px)`,
                zIndex: 200 - Math.round(distance * 10),
              }}
            >
              <div className="mc-galfan-bend" aria-hidden>
                <span className="mc-galfan-glow" />
                {Array.from({ length: slices }, (_, slice) => {
                  const waveUnit = cardWidth / step;
                  const edgeA = offset + (slice / slices - 0.5) * waveUnit;
                  const edgeB = offset + ((slice + 1) / slices - 0.5) * waveUnit;
                  const depthA = zAt(edgeA) * spread;
                  const depthB = zAt(edgeB) * spread;
                  const rotationY = (-Math.atan2(depthB - depthA, sliceWidth) * 180) / Math.PI;
                  const stretch = Math.hypot(sliceWidth, depthB - depthA) / sliceWidth;
                  const shadeAt = (value: number) =>
                    Math.pow(Math.min(Math.abs(value) / 3.8, 1), 1.2) * 0.8;
                  const shade =
                    `linear-gradient(90deg, rgba(4, 3, 3, ${shadeAt(edgeA).toFixed(3)}), ` +
                    `rgba(4, 3, 3, ${shadeAt(edgeB).toFixed(3)}))`;
                  const left = Math.round(slice * sliceWidth) - 1;

                  return (
                    <span
                      key={slice}
                      className={`mc-galfan-slice${slice === 0 ? " is-first" : slice === slices - 1 ? " is-last" : ""}`}
                      style={{
                        left: `${left}px`,
                        width: `${Math.round(sliceWidth) + 2}px`,
                        transform:
                          `translateZ(${((depthA + depthB) / 2).toFixed(1)}px) ` +
                          `rotateY(${rotationY.toFixed(2)}deg) scaleX(${stretch.toFixed(4)})`,
                      }}
                    >
                      <span
                        className="mc-galfan-slice-image"
                        style={{
                          width: `${cardWidth}px`,
                          marginLeft: `${-left}px`,
                          backgroundImage: `url("${image.src}")`,
                        }}
                      />
                      <span className="mc-galfan-shade" style={{ backgroundImage: shade }} />
                    </span>
                  );
                })}
              </div>
              <img
                className="mc-galfan-measure"
                src={image.src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </figure>
          );
        })}
      </div>

      <div className="mc-galfan-foot mc-mask-in">
        <div className="mc-galfan-count" aria-live="polite">
          <span className="mc-galfan-count-current">{formatCount(fan.active + 1)}</span>
          <span className="mc-galfan-count-total">/ {formatCount(images.length)}</span>
        </div>
        <div className="mc-gallery-arrows">
          <button
            type="button"
            className="mc-gallery-arrow"
            disabled={fan.active === 0}
            onClick={() => fan.goTo(fan.active - 1)}
            aria-label={t("businessPage.builder.preview.aria.previousImage")}
          >
            <ArrowRight className="size-[18px] rotate-180" strokeWidth={1.8} aria-hidden />
          </button>
          <button
            type="button"
            className="mc-gallery-arrow"
            disabled={fan.active === images.length - 1}
            onClick={() => fan.goTo(fan.active + 1)}
            aria-label={t("businessPage.builder.preview.aria.nextImage")}
          >
            <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
