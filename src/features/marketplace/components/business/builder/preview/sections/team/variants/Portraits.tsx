import { type CSSProperties } from "react";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { DISPLAY } from "../../../shared/constants";
import type { TeamVariantProps } from "../types";

/** Portraits (default) — tall photo cards, each with a location pin, optional rating, and a hover "find at" CTA. */
export function Portraits({ members, ratings, nameOf, initialsOf, roleOf, t }: TeamVariantProps) {
  return (
    <div className="mc-team">
      {members.map(({ m, locName, locId }, i) => {
        const r = ratings?.[m.id];
        const role = roleOf(m);
        return (
          <div
            key={`${locId}-${m.id}`}
            className="mc-portrait mc-mask-in"
            style={{ animationDelay: `${Math.min(i, 7) * 70}ms` }}
          >
            <div className="mc-pfig">
              {m.profileImage ? (
                <img src={m.profileImage} alt={nameOf(m)} />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ ...DISPLAY, fontSize: "clamp(34px,6cqw,56px)", background: "color-mix(in oklch, var(--mc-accent) 14%, var(--mc-soft))", color: "var(--mc-ink)" } as CSSProperties}
                >
                  {initialsOf(m)}
                </div>
              )}
              <div className="mc-pscrim" />
              <span className="mc-pbadge">
                <MapPin className="h-[11px] w-[11px]" strokeWidth={2} /> {locName}
              </span>
              {r && r.count > 0 && (
                <span className="mc-prate">
                  <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} /> {r.rating.toFixed(1)}
                </span>
              )}
              <div className="mc-pcap">
                <div className="mc-pname">{nameOf(m)}</div>
                {role && <div className="mc-prole">{role}</div>}
                <span className="mc-pfind">
                  {t("businessPage.builder.preview.teamFind", { location: locName })}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
