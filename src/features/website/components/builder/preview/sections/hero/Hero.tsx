import "./base.css";
import type { HeroVariantProps } from "./types";
import { Default } from "./variants/Default";
import { Cinematic } from "./variants/Cinematic";
import { Poster } from "./variants/Poster";
import { Portal } from "./variants/Portal";
import { Drift } from "./variants/Drift";
import { Tumble } from "./variants/Tumble";

// Hero — a free adaptive base (drenched accent field / text-panel cover) plus five premium designs. Each
// variant owns its logic + its own CSS file (nav pattern); the section's single catalog layout dispatches
// through the registry. A not-entitled/unknown variant falls back to the free base here.

const VARIANTS: Record<string, React.FC<HeroVariantProps>> = {
  default: Default,
  cinematic: Cinematic,
  poster: Poster,
  portal: Portal,
  drift: Drift,
  tumble: Tumble,
};

export function Hero(props: HeroVariantProps) {
  const View = Object.hasOwn(VARIANTS, props.entry.variant) ? VARIANTS[props.entry.variant] : Default;
  return <View {...props} />;
}
