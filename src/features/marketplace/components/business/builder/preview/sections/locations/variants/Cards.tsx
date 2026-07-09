import { ArrowRight, Star } from "lucide-react";
import { locationArea, locationPhoto, prettyAddress } from "../../../shared/contact";
import { OpenStatus } from "../parts/OpenStatus";
import type { LocationsVariantProps } from "../types";

/** Cards — a responsive shelf of place cards; clicking one drives the live selection (mirrors the source
 *  LocCards). Each card: cover photo, name + rating, area + address, and a foot with the open-now status and
 *  a decorative Book link. Flagship badge dropped (no field). Cards enter with a staggered mask-in. */
export function Cards({ shown, idx, onSelect, t }: LocationsVariantProps) {
  return (
    <div className="mc-locc">
      {shown.map((l, i) => {
        const photo = locationPhoto(l);
        const rating = (l.totalReviews ?? 0) > 0 ? Number(l.averageRating ?? 0) : null;
        const area = locationArea(l);
        const addr = prettyAddress(l);
        return (
          <button
            key={l.id}
            type="button"
            className="mc-locc-card mc-mask-in"
            data-on={i === idx ? "1" : "0"}
            onClick={() => onSelect(i)}
            aria-pressed={i === idx}
            style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}
          >
            <div className="mc-locc-fig">
              {photo ? (
                <img src={photo} alt={l.name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: "var(--mc-accent-field)" }} />
              )}
            </div>
            <div className="mc-locc-body">
              <div className="mc-locc-head">
                <span className="mc-locc-nm">{l.name}</span>
                {rating !== null && (
                  <span className="mc-locc-rate">
                    <Star className="h-3.5 w-3.5" style={{ color: "var(--mc-accent)" }} fill="var(--mc-accent)" strokeWidth={1.5} />
                    {rating.toFixed(1)}
                  </span>
                )}
              </div>
              {area && <span className="mc-locc-area">{area}</span>}
              {addr && <span className="mc-locc-addr">{addr}</span>}
              <div className="mc-locc-foot">
                <OpenStatus loc={l} t={t} />
                {l.allowOnlineBooking && (
                  <span className="mc-locc-book">
                    {t("businessPage.builder.preview.locBook")}
                    <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
