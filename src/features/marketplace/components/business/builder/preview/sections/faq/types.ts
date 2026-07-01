import type { PreviewData } from "../../shared/types";

/** Contract the FAQ layout variant renders against — the orchestrator owns the section head, the empty
 *  state, the localized item filtering, and the accordion/list variant flag. */
export type FaqVariantProps = {
  items: PreviewData["faq"];
  list: boolean;
  locale: PreviewData["locale"];
};
