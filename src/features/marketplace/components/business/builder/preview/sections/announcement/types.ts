/** Contract the Announcement layout variant renders against — the orchestrator owns the localized content
 *  prep, the empty/sample resolution, and the "hidden when empty" guard. */
export type AnnouncementVariantProps = {
  msg: string;
  ctaLabel: string;
  showCta: boolean;
  showArrow: boolean;
  isEmpty: boolean;
};
