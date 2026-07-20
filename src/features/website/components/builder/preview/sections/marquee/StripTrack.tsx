import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import type { StripSeparatorStyle } from "../../../../../types";

const SOURCE_COPY_COUNT = 3;

/**
 * The design source uses three identical sequences so one set can leave the viewport while the next enters.
 * Very short content gets additional visual copies to preserve that coverage at wide preview sizes. Only the
 * first sequence is exposed to assistive technology.
 */
export function StripTrack({
  items,
  trackRef,
  className,
  separatorStyle,
  separatorSize,
  textSize,
}: {
  items: string[];
  trackRef: RefObject<HTMLDivElement | null>;
  className: string;
  separatorStyle: StripSeparatorStyle;
  separatorSize: number;
  textSize: number;
}) {
  const [copyCount, setCopyCount] = useState(SOURCE_COPY_COUNT);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const strip = track?.parentElement;
    const firstSequence = track?.querySelector<HTMLElement>(".mc-strip-sequence");
    if (!track || !strip || !firstSequence) return;

    const measure = () => {
      const renderedCopies = Number(track.dataset.stripCopies) || SOURCE_COPY_COUNT;
      const sequenceWidth = track.scrollWidth / renderedCopies;
      if (sequenceWidth <= 0) return;
      // At the end of a one-sequence translation, the remaining copies must still cover the strip.
      const requiredCopies = Math.max(
        SOURCE_COPY_COUNT,
        Math.ceil(strip.clientWidth / sequenceWidth) + 1,
      );
      setCopyCount((current) => current === requiredCopies ? current : requiredCopies);
    };

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resizeObserver?.observe(strip);
    resizeObserver?.observe(firstSequence);
    measure();
    return () => resizeObserver?.disconnect();
  }, [items, trackRef]);

  return (
    <div
      ref={trackRef}
      className={`mc-strip-track ${className}`}
      data-strip-copies={copyCount}
      style={{
        "--mc-strip-separator-scale": separatorSize / 100,
        "--mc-strip-text-size": `${textSize}%`,
      } as CSSProperties}
    >
      {Array.from({ length: copyCount }, (_, copy) => (
        <ul
          key={copy}
          className="mc-strip-sequence"
          aria-hidden={copy === 0 ? undefined : true}
        >
          {items.map((item, index) => (
            <li key={`${copy}-${index}`} className="mc-strip-item">
              <span className="mc-strip-label">{item}</span>
              <span
                className="mc-strip-separator"
                data-separator-style={separatorStyle}
                aria-hidden="true"
              />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
