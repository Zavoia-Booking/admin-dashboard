import type { PreviewData, T } from "../../shared/types";

/** Props the Footer orchestrator receives — LivePreview passes the ref it drives on scroll to reveal the
 *  pinned footer, plus the saved footer variant (unknown/unentitled ids fall back to the editorial default). */
export type FooterVariantProps = {
  data: PreviewData;
  t: T;
  footerRef: React.RefObject<HTMLElement | null>;
  variant?: string;
};

/** Contract each footer body variant renders against. The orchestrator owns the `<footer>` shell (reveal ref
 *  + `mc-footer--<variant>` modifier) and the shared closing credit, so a variant renders only its pad body. */
export type FooterBodyProps = {
  data: PreviewData;
  t: T;
};
