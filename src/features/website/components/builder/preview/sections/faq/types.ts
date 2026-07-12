import type { PreviewData, T } from "../../shared/types";

/** Contract the FAQ layout variant renders against — the orchestrator owns the empty state, the localized
 *  item filtering, and the accordion/list variant flag. `email` + `t` feed the grid + split contact CTAs;
 *  `head` is consumed only by the split layout, which renders the section head inside its pin column (the
 *  orchestrator omits its own head then). The other variants ignore `email`/`t`/`head`. */
export type FaqVariantProps = {
  items: PreviewData["faq"];
  list: boolean;
  locale: PreviewData["locale"];
  email: string;
  t: T;
  head?: { no: string; kicker: string; heading: string };
};
