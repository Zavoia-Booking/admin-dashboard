/** Contract the Marquee layout variant renders against — the orchestrator owns the content prep (deduped
 *  offerings), the motion-mode flags, and the min-items guard. */
export type MarqueeVariantProps = {
  items: string[];
  loopMode: boolean;
  scrollDriven: boolean;
  italic: boolean;
};
