import type { LocationWithAssignments } from "../../../../../../types";
import { DAY_KEYS, prettyAddress, hasOpeningHours, telHref, mapHref, type DayKey } from "../../../shared/contact";
import type { T } from "../../../shared/types";
import { ContactLabel } from "./ContactLabel";

/** Selected-location detail in the footer — name, address (map link), phone (tel), opening hours; re-keyed
 *  per location so its entrance replays. Mirrors the source `FootDetail`. */
export function FootDetail({ loc, t }: { loc: LocationWithAssignments; t: T }) {
  const addr = loc.address?.trim() || prettyAddress(loc);
  const map = mapHref(loc);
  const phone = loc.phone?.trim();
  const wh = (loc.workingHours ?? {}) as Partial<Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>>;
  return (
    <div className="mc-foot-col mc-foot-detail mc-locx-fade">
      <ContactLabel>{loc.name}</ContactLabel>
      {addr &&
        (map ? (
          <a className="mc-foot-row mc-foot-link" href={map} target="_blank" rel="noreferrer">
            {addr}
          </a>
        ) : (
          <span className="mc-foot-row">{addr}</span>
        ))}
      {phone && (
        <a className="mc-foot-row mc-foot-link" href={telHref(phone)}>
          {phone}
        </a>
      )}
      {hasOpeningHours(loc) && (
        <div className="mc-foot-hours-wrap">
          {DAY_KEYS.map((d) => {
            const day = wh[d];
            const open = !!loc.open247 || !!(day && day.isOpen && day.open && day.close);
            const value = loc.open247
              ? t("businessPage.builder.preview.contactOpen247")
              : day && day.isOpen && day.open && day.close
                ? `${day.open}–${day.close}`
                : t("businessPage.builder.preview.contactClosed");
            return (
              <div key={d} className="mc-foot-hours">
                <span>{t(`businessPage.builder.preview.days.${d}`)}</span>
                <span style={{ opacity: open ? 1 : 0.5 }}>{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
