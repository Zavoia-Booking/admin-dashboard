import type { WebsiteBuilderLocation } from "../../../../../../types";
import { cn } from "../../../../../../../../shared/lib/utils";
import { openNowStatus } from "../../../shared/contact";
import type { T } from "../../../shared/types";

/** Open/closed pill (source `.lb-ct-status`) — a status dot + a localized "open now · until / opens / closed"
 *  label derived from the location's structured hours. `data-open` drives the dot colour + glow in CSS. */
export function OpenStatus({ loc, t, className }: { loc: WebsiteBuilderLocation; t: T; className?: string }) {
  const st = openNowStatus(loc);
  const label = st.open
    ? st.until
      ? t("businessPage.builder.preview.statusOpenNowUntil", { time: st.until })
      : t("businessPage.builder.preview.contactOpen247")
    : st.opensAt
      ? t("businessPage.builder.preview.statusOpens", { time: st.opensAt })
      : t(
          st.phase === "after"
            ? "businessPage.builder.preview.statusClosedNow"
            : "businessPage.builder.preview.statusClosedToday",
        );
  return (
    <span className={cn("mc-ct-status", className)} data-open={st.open ? "1" : "0"}>
      <i aria-hidden />
      {label}
    </span>
  );
}
