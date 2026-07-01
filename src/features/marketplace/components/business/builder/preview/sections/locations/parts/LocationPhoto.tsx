import type { LocationWithAssignments } from "../../../../../../../types";
import { DISPLAY } from "../../../shared/constants";
import { prettyAddress } from "../../../shared/contact";
import type { T } from "../../../shared/types";
import { StagePhoto } from "./StagePhoto";

/** Featured photo for a location — the featured image, else the first portfolio image, else none. */
const locationPhoto = (l: LocationWithAssignments): string | null =>
  l.featuredImage || l.portfolioImages?.[0]?.url || null;

/** Right plate: the selected location's photo as a full-height editorial panel with the caption overlay
 *  (name, blurb, address). Stretches to match the left column; falls back to an accent field with no photo. */
export function LocationPhoto({ loc, t }: { loc: LocationWithAssignments; t: T }) {
  const photo = locationPhoto(loc);
  const onPhoto = !!photo;
  const blurb = loc.description?.trim();
  return (
    <div
      className="relative h-full min-h-[clamp(300px,42cqw,520px)] overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--mc-line)", background: onPhoto ? undefined : "var(--mc-accent-field)" }}
    >
      {onPhoto && <StagePhoto src={photo} alt={loc.name} />}
      {onPhoto && (
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,10,9,0.82) 0%, rgba(12,10,9,0.32) 42%, rgba(12,10,9,0) 72%)" }} />
      )}
      <div key={`cap-${loc.id}`} className="absolute inset-x-0 bottom-0 p-[clamp(18px,3cqw,36px)]" style={{ color: onPhoto ? "#fff" : "var(--mc-on-accent)" }}>
        <div className="mc-locx-rise text-balance" style={{ ...DISPLAY, fontSize: "clamp(28px,5.4cqw,52px)", lineHeight: 0.98, animationDelay: "60ms" }}>{loc.name}</div>
        {blurb && (
          <p className="mc-locx-rise mt-2.5 max-w-[42ch] text-[clamp(13px,1.7cqw,15px)] leading-relaxed" style={{ color: onPhoto ? "rgba(255,255,255,0.9)" : "var(--mc-on-accent)", animationDelay: "140ms" }}>
            {blurb}
          </p>
        )}
        <p className="mc-locx-rise mt-3 line-clamp-2 text-[12.5px]" style={{ color: onPhoto ? "rgba(255,255,255,0.78)" : "var(--mc-on-accent)", animationDelay: "220ms" }}>
          {prettyAddress(loc) || t("businessPage.builder.preview.noAddress")}
        </p>
      </div>
    </div>
  );
}
