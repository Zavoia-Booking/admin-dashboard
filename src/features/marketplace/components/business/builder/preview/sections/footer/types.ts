import type { PreviewData, T } from "../../shared/types";

/** Contract the Footer layout variant renders against — LivePreview passes the ref it drives on scroll to
 *  reveal the pinned footer. */
export type FooterVariantProps = {
  data: PreviewData;
  t: T;
  footerRef: React.RefObject<HTMLElement | null>;
};
