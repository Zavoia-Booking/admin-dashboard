import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { MONO } from "../../../shared/constants";
import { locationArea, locationPhoto, prettyAddress } from "../../../shared/contact";
import { BookButton } from "../../../shared/primitives";
import { StagePhoto } from "../parts/StagePhoto";
import { StageHours } from "../parts/StageHours";
import { LocationTags } from "../parts/LocationTags";
import { OpenStatus } from "../parts/OpenStatus";
import { buildLocationTagGroups } from "../util";
import type { LocationsVariantProps } from "../types";

/** Atlas — a tab strip over a wide photo stage + a detail sheet (visit / hours / amenities / book). The tabs
 *  drive the same selected-location state; the stage photo crossfades on switch (StagePhoto). Mirrors the
 *  source LocAtlas; the transit "station" line is dropped (no field). */
export function Atlas({ shown, idx, loc, onSelect, dict, t }: LocationsVariantProps) {
  const photo = locationPhoto(loc);
  const blurb = loc.description?.trim();
  const addr = prettyAddress(loc);
  const tagGroups = useMemo(() => buildLocationTagGroups(loc, dict), [loc, dict]);
  return (
    <>
      <div className="mc-cta-tabs" role="tablist">
        {shown.map((l, i) => {
          const area = locationArea(l);
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={i === idx}
              className="mc-cta-tab"
              data-on={i === idx ? "1" : "0"}
              onClick={() => onSelect(i)}
            >
              <span className="mc-cta-tab-nm">{l.name}</span>
              {area && <span className="mc-cta-tab-area">{area}</span>}
            </button>
          );
        })}
      </div>
      <div className="mc-loca">
        <div className="mc-loca-fig">
          {photo ? (
            <StagePhoto src={photo} alt={loc.name} />
          ) : (
            <div className="absolute inset-0" style={{ background: "var(--mc-accent-field)" }} />
          )}
          <div className="mc-loca-scrim" />
          <div key={`cap-${loc.id}`} className="mc-loca-cap">
            <div className="mc-loca-cap-nm mc-locx-rise">{loc.name}</div>
            {blurb && (
              <p className="mc-loca-cap-blurb mc-locx-rise" style={{ animationDelay: "80ms" }}>
                {blurb}
              </p>
            )}
          </div>
        </div>
        <div key={`sheet-${loc.id}`} className="mc-loca-sheet mc-locx-fade">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} />
              {t("businessPage.builder.preview.locVisit")}
            </div>
            {addr && <p className="text-[13.5px] leading-snug" style={{ color: "var(--mc-fg)" }}>{addr}</p>}
            <div className="mt-2.5">
              <OpenStatus loc={loc} t={t} />
            </div>
          </div>
          <StageHours loc={loc} t={t} />
          {tagGroups.length > 0 && <LocationTags groups={tagGroups} />}
          {loc.allowOnlineBooking && (
            <BookButton
              label={t("businessPage.builder.preview.bookAt", { name: loc.name })}
              tone="accent"
              size="lg"
              styleOverride={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
            />
          )}
        </div>
      </div>
    </>
  );
}
