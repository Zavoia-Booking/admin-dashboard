import { type CSSProperties } from "react";
import { Star } from "lucide-react";
import { DISPLAY } from "../../../shared/constants";
import "../base.css";

/** Shared portrait card — full-bleed photo (or an initials fallback), a bottom scrim, an optional rating
 *  pill (top-right), and the name (bottom-left). Pure presentation; the wrapper owns any interactivity.
 *  Rendered by the Portraits grid and, identically, by each Carousel slide (the carousel's CSS controls
 *  which slide reveals its scrim/rating/name). */
export function TeamCard({ name, initials, image, rating, tint }: { name: string; initials: string; image: string | null; rating: number | null; tint: string }) {
  return (
    <div className="mc-portrait-inner">
      <div className="mc-pfig" style={{ background: tint }}>
        {image ? (
          <img src={image} alt={name} loading="lazy" decoding="async" draggable={false} />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ ...DISPLAY, fontSize: "clamp(34px,6cqw,56px)", background: tint, color: "var(--mc-ink)" } as CSSProperties}
          >
            {initials}
          </div>
        )}
        <div className="mc-pscrim" />
        {rating != null && (
          <span className="mc-prate">
            <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} /> {rating.toFixed(1)}
          </span>
        )}
        <div className="mc-pcap">
          <div className="mc-pname">{name}</div>
        </div>
      </div>
    </div>
  );
}
