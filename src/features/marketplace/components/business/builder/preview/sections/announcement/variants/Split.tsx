import { AnnoCta } from "../parts/AnnoCta";
import { AnnoCountdown } from "../parts/AnnoCountdown";
import type { AnnouncementInnerProps } from "../types";

/** Split — message left, countdown + CTA pushed right (stacks into a left-aligned column on a narrow
 *  preview). Mirrors the source announcement's `split` layout. */
export function Split({ msg, ctaLabel, showCta, showArrow, countdownEnd, t }: AnnouncementInnerProps) {
  return (
    <div className="mc-anno-in">
      <span className="mc-anno-left">
        <span className="mc-anno-dot" aria-hidden />
        <span className="mc-anno-txt">{msg}</span>
      </span>
      <span className="mc-anno-right">
        <AnnoCountdown end={countdownEnd} t={t} />
        {showCta && <AnnoCta label={ctaLabel} showArrow={showArrow} />}
      </span>
    </div>
  );
}
