import { useEffect, useMemo, useState } from "react";
import { buildZonedDateFromDateKey } from "../../../../../../../calendar/timezone";
import type { T } from "../../../shared/types";

export function AnnoCountdown({
  end,
  timezone,
  t,
}: {
  end: string | null;
  timezone: string | null;
  t: T;
}) {
  const target = useMemo(() => {
    if (!end) return null;
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    try {
      const lastMinute = buildZonedDateFromDateKey(end, "23:59", timezone || localTimezone);
      const value = lastMinute.getTime() + 59_999;
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }, [end, timezone]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [target]);

  if (!target) return null;
  const ms = target - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const time = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return (
    <span className="mc-anno-details-count">
      {t("businessPage.builder.announcement.endsIn", { time })}
    </span>
  );
}
