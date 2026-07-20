import { TeamCard } from "../parts/TeamCard";
import type { TeamVariantProps } from "../types";
import "./portraits.css";

/** Portraits (free base) — the source's lookbook grid: a 3-up wall of tall photo cards, each a minimal
 *  scrim + rating pill + name. The masked entrance staggers card-by-card on mount. */
export function Portraits({ members, ratings, nameOf, initialsOf, tintOf }: TeamVariantProps) {
  return (
    <div className="mc-team">
      {members.map(({ m, locId }, i) => {
        const r = ratings?.[m.id];
        return (
          <div key={`${locId}-${m.id}`} className="mc-portrait mc-mask-in" style={{ animationDelay: `${Math.min(i, 7) * 70}ms` }}>
            <TeamCard name={nameOf(m)} initials={initialsOf(m)} image={m.profileImage ?? null} rating={r && r.count > 0 ? r.rating : null} tint={tintOf(m)} />
          </div>
        );
      })}
    </div>
  );
}
