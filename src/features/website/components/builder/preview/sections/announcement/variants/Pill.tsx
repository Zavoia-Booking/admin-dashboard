import { AnnoCta } from "../parts/AnnoCta";
import type { AnnouncementVariantProps } from "../types";
import "./pill.css";

export function Pill({
  msg,
  ctaLabel,
  ctaUrl,
  ctaNewTab,
  showCta,
  showArrow,
  detailsControl,
  dismissControl,
}: AnnouncementVariantProps) {
  return (
    <div className="mc-anno-in">
      <span className="mc-anno-dot" aria-hidden />
      <span className="mc-anno-txt">{msg}</span>
      {detailsControl || showCta ? (
        <span className="mc-anno-actions">
          {detailsControl}
          {showCta && (
            <AnnoCta label={ctaLabel} url={ctaUrl} newTab={ctaNewTab} showArrow={showArrow} />
          )}
        </span>
      ) : null}
      {dismissControl}
    </div>
  );
}
