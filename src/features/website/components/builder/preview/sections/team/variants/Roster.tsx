import { type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { DISPLAY } from "../../../shared/constants";
import { Stars } from "../../../shared/primitives";
import type { TeamVariantProps } from "../types";
import "./roster.css";

/** Roster (paid) — a numbered editorial directory: rank, circular avatar, name/role/location, a star rating
 *  with its review count, and a decorative accent arrow. Mirrors the source `TeamRoster`. */
export function Roster({ members, ratings, nameOf, initialsOf, tintOf }: TeamVariantProps) {
  return (
    <div className="mc-roster">
      {members.map(({ m, locName, locId }, i) => {
        const r = ratings?.[m.id];
        return (
          <div key={`${locId}-${m.id}`} className="mc-rrow mc-locx-rowin" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
            <div className="mc-rrow-btn">
              <span className="mc-rrow-ava" style={{ background: tintOf(m) }}>
                {m.profileImage ? (
                  <img src={m.profileImage} alt={nameOf(m)} loading="lazy" decoding="async" />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center"
                    style={{ ...DISPLAY, fontSize: "clamp(18px, 1.9cqw, 22px)", background: tintOf(m), color: "var(--mc-ink)" } as CSSProperties}
                  >
                    {initialsOf(m)}
                  </span>
                )}
              </span>
              <span className="mc-rrow-main">
                <span className="mc-rrow-name">{nameOf(m)}</span>
                <span className="mc-rrow-where">{locName}</span>
                {r && r.count > 0 && (
                  <span className="mc-rrow-meta">
                    <span className="mc-rrow-rate">
                      <Stars value={r.rating} size={13} empty="color-mix(in oklch, var(--mc-fg) 14%, transparent)" />{" "}
                      <span className="mc-rrow-rev">({r.count})</span>
                    </span>
                  </span>
                )}
              </span>
              <span className="mc-rrow-cta" aria-hidden>
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
