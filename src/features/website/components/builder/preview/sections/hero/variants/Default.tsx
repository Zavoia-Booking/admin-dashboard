import { useRef } from "react";
import { heroMode } from "../../../shared/util";
import { deriveHeroContent } from "../parts/content";
import { useCoverParallax } from "../parts/useCoverParallax";
import { CoverPlate } from "../parts/CoverPlate";
import { Drenched } from "../parts/Drenched";
import type { HeroVariantProps, HeroModeProps } from "../types";
import "./default.css";

/** Free adaptive base hero — no cover ⇒ the drenched accent field; a cover ⇒ the text-panel cover plate.
 *  Owns the cover parallax (plate mode only) and dispatches to the matching mode part under parts/. */
export function Default(props: HeroVariantProps) {
  const { data, t, parallax } = props;
  const content = deriveHeroContent(props);
  const mode = heroMode(!!data.heroImageUrl);

  const headerRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  useCoverParallax(headerRef, parallaxRef, {
    enabled: parallax && mode === "coverPlate",
    skipWhenNarrow: true,
  });

  const modeProps: HeroModeProps = { ...content, data, t, parallax, headerRef, parallaxRef };
  return mode === "coverPlate" ? <CoverPlate {...modeProps} /> : <Drenched {...modeProps} />;
}
