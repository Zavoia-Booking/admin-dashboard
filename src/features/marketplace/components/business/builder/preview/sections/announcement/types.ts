import type { T } from "../../shared/types";

/** Contract each announcement layout inner renders against. The orchestrator owns the `.mc-anno` root
 *  (tone + layout modifier), the empty/sample resolution, and the trailing dismiss affordance; the variant
 *  renders only the `.mc-anno-in` body. */
export type AnnouncementInnerProps = {
  msg: string;
  ctaLabel: string;
  showCta: boolean;
  showArrow: boolean;
  /** Schedule end key (`YYYY-MM-DD`) for the countdown chip, or null (empty/sample/no end date). */
  countdownEnd: string | null;
  t: T;
};
