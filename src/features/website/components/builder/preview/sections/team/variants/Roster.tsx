import { type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { DISPLAY } from "../../../shared/constants";
import { Stars } from "../../../shared/primitives";
import type { TeamVariantProps } from "../types";

/** Roster — a numbered editorial list: rank, avatar, name/role/location, optional rating, and a decorative arrow. */
export function Roster({ members, ratings, nameOf, initialsOf, roleOf, t }: TeamVariantProps) {
  return (
    <div className="mc-roster">
      {members.map(({ m, locName, locId }, i) => {
        const r = ratings?.[m.id];
        const role = roleOf(m);
        return (
          <div
            key={`${locId}-${m.id}`}
            className="mc-rrow mc-locx-rowin"
            style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
          >
            <div className="mc-rrow-btn">
              <span className="mc-rrow-no">{String(i + 1).padStart(2, "0")}</span>
              <span className="mc-rrow-ava">
                {m.profileImage ? (
                  <img src={m.profileImage} alt={nameOf(m)} loading="lazy" decoding="async" />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-base"
                    style={{ ...DISPLAY, background: "color-mix(in oklch, var(--mc-accent) 12%, var(--mc-soft))", color: "var(--mc-ink)" } as CSSProperties}
                  >
                    {initialsOf(m)}
                  </span>
                )}
              </span>
              <span className="mc-rrow-main">
                <span className="mc-rrow-name">{nameOf(m)}</span>
                {role && <span className="mc-rrow-role">{role}</span>}
                <span className="mc-rrow-where">{locName}</span>
                {r && r.count > 0 && (
                  <span className="mc-rrow-meta">
                    <span className="mc-rrow-rate">
                      <Stars value={r.rating} size={13} /> {r.rating.toFixed(1)}
                    </span>
                    <span className="mc-rrow-rev">{t("businessPage.builder.preview.reviewsCount", { count: r.count })}</span>
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
