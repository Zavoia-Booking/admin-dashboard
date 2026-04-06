import { useEffect, useState } from "react";

/**
 * Forces a re-render every `intervalMs` (default 60s) so that
 * "now" indicators (time pill, red line) stay current.
 * Only ticks when `enabled` is true (e.g. today is visible).
 */
export function useNowTick(enabled: boolean, intervalMs = 60_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
