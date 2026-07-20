import type { PreviewData, T } from "../../shared/types";

/** Data shared by the three executable FAQ treatments. Each variant owns its state, markup, and CSS. */
export type FaqVariantProps = {
  items: PreviewData["faq"];
  locale: PreviewData["locale"];
  email: string;
  t: T;
};
