import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type Ref,
} from "react";

const EASE_OUT_STRONG = "cubic-bezier(0.23, 1, 0.32, 1)";
/** iOS drawer curve (Vaul's) — used for the button-triggered exit. */
const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
/** Release past this fraction of the width commits the back navigation. */
const COMMIT_RATIO = 0.35;
/** A brisk rightward flick (px/ms) commits even on a short drag. */
const COMMIT_VELOCITY = 0.55;
/** Movement before the gesture locks to an axis. */
const LOCK_SLOP = 8;

export interface LocationDetailSwipeBackHandle {
  /** Slide the detail out, then run onBack — for button-triggered exits. */
  animateBack: () => void;
}

interface LocationDetailSwipeBackProps {
  /** Only the location detail view arms the gesture. */
  enabled: boolean;
  onBack: () => void;
  handleRef?: Ref<LocationDetailSwipeBackHandle>;
  children: ReactNode;
}

/**
 * Swipe-back for the mobile location detail view, motion-matched to the app's
 * Vaul sheets. The whole surface owns the gesture with direction locking:
 * `touch-action: pan-y` keeps vertical scrolling native, while a rightward
 * horizontal drag (decided within the first few px) makes the detail column
 * follow the finger. Releasing past the threshold — or a flick — slides it
 * out and returns to the list; the back button reuses the same exit through
 * `animateBack()` so both paths feel identical.
 */
export function LocationDetailSwipeBack({
  enabled,
  onBack,
  handleRef,
  children,
}: LocationDetailSwipeBackProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const exitingRef = useRef(false);
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastT: number;
    prevX: number;
    prevT: number;
    axis: "pending" | "horizontal" | "abandoned";
  } | null>(null);

  const applyShift = (dx: number) => {
    const el = contentRef.current;
    if (!el) return;
    if (dx <= 0) {
      el.style.transform = "";
      el.style.opacity = "";
      return;
    }
    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = String(
      1 - Math.min(0.35, (dx / Math.max(1, el.offsetWidth)) * 0.45),
    );
  };

  // Set when an exit committed: the wrapper is held offscreen through the
  // navigation, and the arrival effect below reveals the list.
  const pendingArrivalRef = useRef(false);

  /** Shared exit: slide out from `fromDx`, navigate while held offscreen. */
  const runExit = (fromDx: number, viaGesture: boolean) => {
    const el = contentRef.current;
    if (!el || exitingRef.current) return;
    exitingRef.current = true;

    const width = Math.max(1, el.offsetWidth);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      exitingRef.current = false;
      onBack();
      return;
    }

    const handoff = () => {
      exitingRef.current = false;
      pendingArrivalRef.current = true;
      onBack();
      // Safety net: if navigation somehow doesn't re-render this wrapper,
      // don't leave the page held invisible offscreen.
      window.setTimeout(() => {
        if (!pendingArrivalRef.current) return;
        pendingArrivalRef.current = false;
        const node = contentRef.current;
        if (node) {
          node.style.transform = "";
          node.style.opacity = "";
        }
      }, 400);
    };

    // Hold the exit pose through the navigation commit — clearing it before
    // the list renders would paint a frame of the detail snapped back in.
    el.style.transform = `translateX(${width}px)`;
    el.style.opacity = "0.3";

    if (fromDx >= width) {
      handoff();
      return;
    }
    const slideOut = el.animate(
      [
        { transform: `translateX(${fromDx}px)`, opacity: "1" },
        { transform: `translateX(${width}px)`, opacity: "0.3" },
      ],
      {
        // Mid-gesture the finger already has momentum: keep it snappy.
        // From rest (button) use the drawer curve so it reads as a sheet.
        duration: viaGesture ? 180 : 260,
        easing: viaGesture ? "ease-out" : EASE_DRAWER,
      },
    );
    slideOut.onfinish = handoff;
  };

  // Arrival: runs in the same commit that renders the list (enabled flipped
  // off after an exit), so the held-offscreen pose is released before paint —
  // no flicker frame — and the list eases in from the other side.
  useLayoutEffect(() => {
    if (enabled || !pendingArrivalRef.current) return;
    pendingArrivalRef.current = false;
    const el = contentRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.opacity = "";
    el.animate(
      [
        { transform: "translateX(-14px)", opacity: 0.25 },
        { transform: "translateX(0)", opacity: 1 },
      ],
      { duration: 240, easing: EASE_OUT_STRONG },
    );
  }, [enabled]);

  useImperativeHandle(handleRef, () => ({
    animateBack: () => runExit(0, false),
  }));

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === "mouse" ||
      gestureRef.current ||
      exitingRef.current
    )
      return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastT: event.timeStamp,
      prevX: event.clientX,
      prevT: event.timeStamp,
      axis: "pending",
    };
    // Vaul's pattern: capture on the PRESSED element at press time so the
    // stream survives leaving it. Capturing the wrapper instead (an ancestor)
    // retargets the cycle and poisons the NEXT tap's target in Chrome.
    if (event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    if (gesture.axis === "pending") {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (Math.abs(dx) < LOCK_SLOP && Math.abs(dy) < LOCK_SLOP) return;
      // Rightward and clearly horizontal → ours; anything else stays native.
      if (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        gesture.axis = "horizontal";
      } else {
        gesture.axis = "abandoned";
        return;
      }
    }
    if (gesture.axis !== "horizontal") return;

    gesture.prevX = gesture.lastX;
    gesture.prevT = gesture.lastT;
    gesture.lastX = event.clientX;
    gesture.lastT = event.timeStamp;
    applyShift(event.clientX - gesture.startX);
  };

  const settle = (
    event: React.PointerEvent<HTMLDivElement>,
    cancelled: boolean,
  ) => {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gestureRef.current = null;
    if (gesture.axis !== "horizontal") return;

    const el = contentRef.current;
    if (!el) return;

    const dx = Math.max(0, gesture.lastX - gesture.startX);
    const width = Math.max(1, el.offsetWidth);
    const velocity =
      (gesture.lastX - gesture.prevX) /
      Math.max(1, gesture.lastT - gesture.prevT);
    const commit =
      !cancelled &&
      (dx > width * COMMIT_RATIO || (velocity > COMMIT_VELOCITY && dx > 24));

    if (commit) {
      runExit(dx, true);
      return;
    }

    // Rest state inline first so there is no end-of-animation flash.
    el.style.transform = "";
    el.style.opacity = "";
    if (dx > 0) {
      el.animate(
        [{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }],
        { duration: 260, easing: EASE_OUT_STRONG },
      );
    }
  };

  return (
    <div
      ref={contentRef}
      className={enabled ? "touch-pan-y xl:touch-auto" : undefined}
      onPointerDown={enabled ? handlePointerDown : undefined}
      onPointerMove={enabled ? handlePointerMove : undefined}
      onPointerUp={enabled ? (event) => settle(event, false) : undefined}
      onPointerCancel={enabled ? (event) => settle(event, true) : undefined}
    >
      {children}
    </div>
  );
}

export default LocationDetailSwipeBack;
