import { useState } from "react";
import type { T } from "../../../shared/types";

/** Countdown chip from the announcement's schedule end (a `YYYY-MM-DD` key, read as end-of-day local — the
 *  public page enforces the real timezone window). Computed once per render (the preview re-renders on edits);
 *  renders nothing when there's no end date or it's already past. Mirrors the source `AnnoCountdown`. */
export function AnnoCountdown({ end, t }: { end: string | null; t: T }) {
  const [renderedAt] = useState(() => Date.now());
  if (!end) return null;
  const target = new Date(`${end}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  const ms = target.getTime() - renderedAt;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const time = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return <span className="mc-anno-count">{t("businessPage.builder.announcement.endsIn", { time })}</span>;
}
