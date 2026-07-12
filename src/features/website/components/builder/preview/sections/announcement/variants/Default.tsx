import { AnnoCta } from "../parts/AnnoCta";
import { AnnoCountdown } from "../parts/AnnoCountdown";
import type { AnnouncementInnerProps } from "../types";

/** Default — the ribbon body: accent dot · message · countdown · CTA, centred and wrapping. Shared by the
 *  base `bar` layout and the CSS-only `hairline` reskin (the orchestrator's `mc-anno--lay-<variant>` class is
 *  what distinguishes them). */
export function Default({ msg, ctaLabel, showCta, showArrow, countdownEnd, t }: AnnouncementInnerProps) {
  return (
    <div className="mc-anno-in">
      <span className="mc-anno-dot" aria-hidden />
      <span className="mc-anno-txt">{msg}</span>
      <AnnoCountdown end={countdownEnd} t={t} />
      {showCta && <AnnoCta label={ctaLabel} showArrow={showArrow} />}
    </div>
  );
}
