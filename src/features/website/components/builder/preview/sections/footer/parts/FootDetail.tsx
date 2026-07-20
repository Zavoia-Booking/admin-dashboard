import { useEffect, useState } from "react";
import type { WebsiteBuilderLocation } from "../../../../../../types";
import { DAY_KEYS, prettyAddress, hasOpeningHours, telHref, mapHref, type DayKey } from "../../../shared/contact";
import { prefersReducedMotion } from "../../../shared/util";
import type { T } from "../../../shared/types";

/** Editorial's selected-location detail. The parent keys it by location so the restrained row entrance
 * replays on every selection, exactly like the executable design. */
export function FootDetail({ loc, t }: { loc: WebsiteBuilderLocation; t: T }) {
  const [entering, setEntering] = useState(() => !prefersReducedMotion());
  useEffect(() => {
    if (!entering) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setEntering(false));
    });
    const fallback = window.setTimeout(() => setEntering(false), 120);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallback);
    };
  }, [entering]);

  const address = loc.address?.trim() || prettyAddress(loc);
  const map = mapHref(loc);
  const phone = loc.phone?.trim();
  const hours = (loc.workingHours ?? {}) as Partial<Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>>;
  const hourGroups = DAY_KEYS.map((dayKey) => {
    const day = hours[dayKey];
    const open = !!loc.open247 || !!(day?.isOpen && day.open && day.close);
    const value = loc.open247
      ? t("businessPage.builder.preview.contactOpen247")
      : open
        ? `${day?.open}–${day?.close}`
        : t("businessPage.builder.preview.contactClosed");
    return { first: dayKey, last: dayKey, open, value };
  }).reduce<Array<{ first: DayKey; last: DayKey; open: boolean; value: string }>>((groups, row) => {
    const previous = groups.at(-1);
    if (previous && previous.open === row.open && previous.value === row.value) {
      previous.last = row.last;
    } else {
      groups.push(row);
    }
    return groups;
  }, []);

  return (
    <div className={`mc-foot-col mc-foot-detail${entering ? " is-entering" : ""}`}>
      <div className="mc-foot-label">{loc.name}</div>
      {address && (map ? (
        <a className="mc-foot-row mc-foot-link" href={map} target="_blank" rel="noopener noreferrer">
          {address}
        </a>
      ) : <span className="mc-foot-row">{address}</span>)}
      {phone && <a className="mc-foot-row mc-foot-link" href={telHref(phone)}>{phone}</a>}
      {hasOpeningHours(loc) && (
        <div className="mc-foot-hours-wrap">
          {hourGroups.map((group) => {
            const first = t(`businessPage.builder.preview.days.${group.first}`);
            const last = t(`businessPage.builder.preview.days.${group.last}`);
            const label = group.first === group.last ? first : `${first}–${last}`;
            return (
              <div key={`${group.first}:${group.last}`} className="mc-foot-hours">
                <span>{label}</span>
                <span style={{ opacity: group.open ? 1 : 0.5 }}>{group.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
