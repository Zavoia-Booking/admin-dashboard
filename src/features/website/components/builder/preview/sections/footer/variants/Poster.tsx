import { useRef } from "react";
import { BookButton } from "../../../shared/primitives";
import { FootSocials } from "../parts/FootSocials";
import { useFitText } from "../parts/useFitText";
import type { FooterBodyProps } from "../types";

/** Poster — inverted ink block (the orchestrator's `.mc-footer--poster` recolours the whole panel dark). A
 *  circular monogram, the business name as a giant fit-to-width wordmark, tagline, one paper CTA, and centred
 *  socials. Mirrors the source footer's `poster` branch. */
export function Poster({ data, t }: FooterBodyProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const initial = name.trim().charAt(0) || "•";
  const here = data.locations[0] ?? null;

  const nameRef = useRef<HTMLDivElement>(null);
  useFitText(nameRef, name);

  return (
    <div className="mc-foot-pad mc-fpo">
      <span className="mc-fpo-mark" aria-hidden>
        {initial}
      </span>
      <div ref={nameRef} className="mc-foot-name">
        {name}
      </div>
      {data.tagline?.trim() && <p className="mc-fpo-tag">{data.tagline}</p>}
      <BookButton
        label={here ? t("businessPage.builder.preview.bookAt", { name: here.name }) : t("businessPage.builder.preview.book")}
        tone="paper"
        size="lg"
        styleOverride={{ color: "var(--mc-accent)" }}
      />
      <FootSocials social={data.social} />
    </div>
  );
}
