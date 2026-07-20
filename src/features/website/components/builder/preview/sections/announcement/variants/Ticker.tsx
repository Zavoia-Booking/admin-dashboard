import { useEffect, useRef, useState } from "react";
import { AnnoCta } from "../parts/AnnoCta";
import type { AnnouncementVariantProps } from "../types";
import { prefersReducedMotion } from "../../../shared/util";
import "./ticker.css";

const REPEATS = Array.from({ length: 10 }, (_, index) => index);

function TickerLane({ text }: { text: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || paused || prefersReducedMotion()) return;
    let offset = Number.parseFloat(track.dataset.offset ?? "0") || 0;
    let last = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const half = track.scrollWidth / 2;
      if (!half) {
        last = now;
        return;
      }
      offset -= ((now - last) / 1_000) * 32;
      last = now;
      if (offset <= -half) offset += half;
      track.dataset.offset = String(offset);
      track.style.transform = `translate3d(${offset.toFixed(1)}px,0,0)`;
    }, 1_000 / 60);
    return () => window.clearInterval(interval);
  }, [paused, text]);

  return (
    <div
      className="mc-anno-tick"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      <span className="sr-only">{text}</span>
      <div className="mc-anno-tick-track" ref={trackRef} aria-hidden>
        {REPEATS.map((index) => (
          <span key={index} className="mc-anno-tick-item">
            <i aria-hidden />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Ticker({
  msg,
  ctaLabel,
  ctaUrl,
  ctaNewTab,
  showCta,
  showArrow,
  detailsControl,
}: AnnouncementVariantProps) {
  return (
    <div className="mc-anno-in">
      <TickerLane text={msg} />
      {detailsControl || showCta ? (
        <span className="mc-anno-tick-end">
          {detailsControl}
          {showCta && (
            <AnnoCta label={ctaLabel} url={ctaUrl} newTab={ctaNewTab} showArrow={showArrow} />
          )}
        </span>
      ) : null}
    </div>
  );
}
