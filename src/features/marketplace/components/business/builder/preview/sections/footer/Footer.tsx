import type { FooterVariantProps } from "./types";
import { Default } from "./variants/Default";
import "./footer.css";

// Editorial closing footer — brand lockup, selectable locations, contact, and a giant fit-to-width wordmark.
// Single layout; the orchestrator owns the section css and dispatches to the one variant (a future footer
// skin adds a file under variants/). LivePreview pins it behind the page and drives its scroll reveal.
export function Footer(props: FooterVariantProps) {
  return <Default {...props} />;
}
