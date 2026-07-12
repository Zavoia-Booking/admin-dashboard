import type { FooterVariantProps } from "./types";
import { Default } from "./variants/Default";
import { Poster } from "./variants/Poster";
import { Minimal } from "./variants/Minimal";
import { Mega } from "./variants/Mega";
import { Index } from "./variants/Index";
import { FootBottom } from "./parts/FootBottom";
import "./footer.css";

// Variant registry — an unknown or unentitled id falls back to the free editorial default (parity with the
// section orchestrators). Poster/Minimal/Mega/Index are paid skins gated by the backend catalog.
const VARIANTS = { default: Default, poster: Poster, minimal: Minimal, mega: Mega, index: Index } as const;

// Editorial closing footer — pinned behind the page and uncovered on scroll (LivePreview drives the reveal).
// The orchestrator owns the `<footer>` shell (reveal ref + `mc-footer--<variant>` modifier) and the shared
// closing credit; each variant renders only its pad body.
export function Footer({ data, t, footerRef, variant }: FooterVariantProps) {
  const v = variant && Object.hasOwn(VARIANTS, variant) ? (variant as keyof typeof VARIANTS) : "default";
  const Body = VARIANTS[v];
  return (
    <footer className={`mc-footer mc-footer--${v}`} ref={footerRef as React.RefObject<HTMLElement>}>
      <Body data={data} t={t} />
      <FootBottom data={data} t={t} showWordmark={v === "default"} />
    </footer>
  );
}
