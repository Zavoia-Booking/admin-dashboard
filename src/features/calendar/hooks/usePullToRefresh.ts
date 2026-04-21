import { useEffect, useRef, useState, type RefObject } from "react";

interface UsePullToRefreshOptions {
  enabled?: boolean;
  threshold?: number;
  holdDuring?: number;
  maxPull?: number;
  resistance?: number;
}

interface UsePullToRefreshResult {
  pull: number;
  refreshing: boolean;
}

/**
 * Pull-to-refresh attached to a scrollable element. Attaches passive `touchstart`
 * and `touchend`, plus a non-passive `touchmove` that calls `preventDefault`
 * only when the user is actually pulling down at `scrollTop <= 0`. Disabled
 * (no listeners attached) when `enabled === false`.
 *
 * Port of the prototype at
 * /tmp/claude-design/test/project/components/CalendarScreen.jsx:633.
 */
export function usePullToRefresh(
  scrollRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void> | void,
  {
    enabled = true,
    threshold = 52,
    holdDuring = 56,
    maxPull = 90,
    resistance = 0.5,
  }: UsePullToRefreshOptions = {},
): UsePullToRefreshResult {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const capturing = useRef(false);
  const axisLocked = useRef<"vertical" | "horizontal" | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        startY.current = e.touches[0]?.clientY ?? null;
        startX.current = e.touches[0]?.clientX ?? null;
        capturing.current = true;
        axisLocked.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!capturing.current || startY.current == null || startX.current == null) return;
      const y = e.touches[0]?.clientY ?? 0;
      const x = e.touches[0]?.clientX ?? 0;
      const dy = y - startY.current;
      const dx = x - startX.current;

      // Lock axis on first meaningful movement. If the user is panning
      // horizontally (e.g. mobile day grid column scroll), bail out so the
      // inner horizontal scroller receives the gesture.
      if (axisLocked.current == null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        if (axisLocked.current === "horizontal") {
          capturing.current = false;
          return;
        }
      }

      const delta = Math.max(0, dy);
      if (delta > 0 && el.scrollTop <= 0) {
        if (e.cancelable) e.preventDefault();
        const next = Math.min(delta * resistance, maxPull);
        pullRef.current = next;
        setPull(next);
      }
    };

    const onTouchEnd = async () => {
      const wasCapturing = capturing.current;
      capturing.current = false;
      axisLocked.current = null;
      startY.current = null;
      startX.current = null;
      if (!wasCapturing) return;
      const finalPull = pullRef.current;
      if (finalPull > threshold) {
        setRefreshing(true);
        setPull(holdDuring);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
          pullRef.current = 0;
        }
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, scrollRef, onRefresh, threshold, holdDuring, maxPull, resistance]);

  return { pull, refreshing };
}
