import type { LocationWithAssignments } from "../../../../../../types";
import { cn } from "../../../../../../../../shared/lib/utils";
import { openNowStatus } from "../../../shared/contact";
import type { T } from "../../../shared/types";

/** Open/closed pill (source `.lb-ct-status`) — a status dot + a localized "open now · until / opens / closed"
 *  label derived from the location's structured hours. Shared by the cards, atlas (and future ledger/panorama)
 *  layouts. `data-open` drives the dot colour + glow in CSS. */
export function OpenStatus({ loc, t, className }: { loc: LocationWithAssignments; t: T; className?: string }) {
  const st = openNowStatus(loc);
  const label = st.open
    ? st.until
      ? t("businessPage.builder.preview.statusOpenUntil", { time: st.until })
      : t("businessPage.builder.preview.contactOpen247")
    : st.opensAt
      ? t("businessPage.builder.preview.statusOpensAt", { time: st.opensAt })
      : t("businessPage.builder.preview.contactClosed");
  return (
    <span className={cn("mc-ct-status", className)} data-open={st.open ? "1" : "0"}>
      <i aria-hidden />
      {label}
    </span>
  );
}
