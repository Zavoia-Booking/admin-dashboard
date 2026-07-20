import { useRef } from "react";
import { deriveHeroContent } from "../parts/content";
import { Drenched } from "../parts/Drenched";
import type { HeroVariantProps, HeroModeProps } from "../types";
import "./default.css";

/** Free text-panel Hero. Cover media is reserved for the image-dependent Cinematic and Portal styles. */
export function Default(props: HeroVariantProps) {
  const { data, t, parallax } = props;
  const content = deriveHeroContent(props);
  const headerRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const modeProps: HeroModeProps = { ...content, data, t, parallax, headerRef, parallaxRef };
  return <Drenched {...modeProps} />;
}
