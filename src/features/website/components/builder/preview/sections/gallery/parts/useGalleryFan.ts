import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from "react";

type FanMode = "idle" | "glide" | "settle";

type FanDrag = {
  x0: number;
  base: number;
  lastX: number;
  lastT: number;
  velocity: number;
};

type FanState = {
  pos: number;
  velocity: number;
  frame: number;
  mode: FanMode;
  target: number;
  drag: FanDrag | null;
  moved: boolean;
  wheelTimer: number;
  movedTimer: number;
  step: number;
  max: number;
  reducedMotion: boolean;
};

type UseGalleryFanOptions = {
  reducedMotion?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Continuous one-dimensional drag physics shared by the Gallery Fan and Mosaic pager.
 * Position stays fractional while dragging/gliding, then eases onto the nearest item.
 */
export function useGalleryFan(count: number, stepPx: number, { reducedMotion = false }: UseGalleryFanOptions = {}) {
  const [, render] = useState(0);
  const stateRef = useRef<FanState | null>(null);

  if (!stateRef.current) {
    const max = Math.max(0, count - 1);
    stateRef.current = {
      pos: Math.floor(max / 2),
      velocity: 0,
      frame: 0,
      mode: "idle",
      target: 0,
      drag: null,
      moved: false,
      wheelTimer: 0,
      movedTimer: 0,
      step: Math.max(40, stepPx || 160),
      max,
      reducedMotion,
    };
  }

  const state = stateRef.current;
  const nextMax = Math.max(0, count - 1);
  const maxChanged = state.max !== nextMax;
  state.step = Math.max(40, stepPx || 160);
  state.max = nextMax;
  state.reducedMotion = reducedMotion;
  if (!state.drag && (state.mode === "idle" || maxChanged)) {
    state.pos = clamp(state.pos, 0, state.max);
    state.target = clamp(state.target, 0, state.max);
  }

  const requestRender = useCallback(() => render((value) => value + 1), []);

  const stop = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    if (current.frame) cancelAnimationFrame(current.frame);
    current.frame = 0;
    current.mode = "idle";
  }, []);

  const tickRef = useRef<() => void>(() => undefined);
  const tick = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    current.frame = 0;

    if (current.mode === "glide") {
      current.pos += current.velocity;
      current.velocity *= 0.928;

      if (current.pos < 0) {
        current.velocity *= 0.55;
        current.pos += (0 - current.pos) * 0.18;
      } else if (current.pos > current.max) {
        current.velocity *= 0.55;
        current.pos += (current.max - current.pos) * 0.18;
      }

      if (Math.abs(current.velocity) < 0.012) {
        current.mode = "settle";
        current.target = clamp(Math.round(current.pos), 0, current.max);
      }
    } else if (current.mode === "settle") {
      const distance = current.target - current.pos;
      if (Math.abs(distance) < 0.0015) {
        current.pos = current.target;
        requestRender();
        stop();
        return;
      }
      current.pos += distance * 0.135;
    } else {
      return;
    }

    requestRender();
    current.frame = requestAnimationFrame(tickRef.current);
  }, [requestRender, stop]);
  tickRef.current = tick;

  const kick = useCallback((mode: FanMode) => {
    const current = stateRef.current;
    if (!current) return;
    current.mode = mode;
    if (!current.frame) current.frame = requestAnimationFrame(tickRef.current);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const current = stateRef.current;
      if (!current) return;
      current.target = clamp(Math.round(index), 0, current.max);
      if (current.reducedMotion) {
        stop();
        current.pos = current.target;
        current.velocity = 0;
        requestRender();
        return;
      }
      kick("settle");
    },
    [kick, requestRender, stop],
  );

  const jumpTo = useCallback(
    (index: number) => {
      const current = stateRef.current;
      if (!current) return;
      stop();
      current.pos = clamp(Math.round(index), 0, current.max);
      current.target = current.pos;
      current.velocity = 0;
      current.drag = null;
      requestRender();
    },
    [requestRender, stop],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is unavailable in a few embedded preview contexts; dragging still works in-bounds.
      }
      stop();
      const current = stateRef.current;
      if (!current) return;
      current.drag = {
        x0: event.clientX,
        base: current.pos,
        lastX: event.clientX,
        lastT: performance.now(),
        velocity: 0,
      };
      current.moved = false;
      requestRender();
    },
    [requestRender, stop],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const current = stateRef.current;
      const drag = current?.drag;
      if (!current || !drag) return;

      const deltaX = event.clientX - drag.x0;
      if (Math.abs(deltaX) > 5) current.moved = true;
      const raw = drag.base - deltaX / current.step;
      current.pos = raw < 0 ? raw * 0.32 : raw > current.max ? current.max + (raw - current.max) * 0.32 : raw;

      const now = performance.now();
      const elapsed = Math.max(1, now - drag.lastT);
      const velocity = -((event.clientX - drag.lastX) / current.step) * (16.7 / elapsed);
      drag.velocity = drag.velocity * 0.5 + velocity * 0.5;
      drag.lastX = event.clientX;
      drag.lastT = now;
      requestRender();
    },
    [requestRender],
  );

  const onPointerUp = useCallback(() => {
    const current = stateRef.current;
    const drag = current?.drag;
    if (!current || !drag) return;

    current.drag = null;
    current.velocity = clamp(drag.velocity, -0.6, 0.6);
    if (current.reducedMotion) {
      stop();
      current.pos = clamp(Math.round(current.pos), 0, current.max);
      current.velocity = 0;
    } else if (Math.abs(current.velocity) > 0.02 && current.pos > -0.5 && current.pos < current.max + 0.5) {
      kick("glide");
    } else {
      current.target = clamp(Math.round(current.pos), 0, current.max);
      kick("settle");
    }

    if (current.movedTimer) window.clearTimeout(current.movedTimer);
    current.movedTimer = window.setTimeout(() => {
      const latest = stateRef.current;
      if (latest) latest.moved = false;
    }, 0);
    requestRender();
  }, [kick, requestRender, stop]);

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.2) return;
      stop();
      const current = stateRef.current;
      if (!current) return;
      current.pos = clamp(current.pos + event.deltaX / (current.step * 1.6), -0.35, current.max + 0.35);
      requestRender();
      if (current.wheelTimer) window.clearTimeout(current.wheelTimer);
      current.wheelTimer = window.setTimeout(() => goTo(current.pos), 110);
    },
    [goTo, requestRender, stop],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const current = stateRef.current;
      if (!current) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(Math.round(current.pos) + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(Math.round(current.pos) - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(current.max);
      }
    },
    [goTo],
  );

  useEffect(() => {
    if (!reducedMotion) return;
    const current = stateRef.current;
    if (current) goTo(Math.round(current.pos));
  }, [goTo, reducedMotion]);

  useEffect(
    () => () => {
      const current = stateRef.current;
      stop();
      if (current?.wheelTimer) window.clearTimeout(current.wheelTimer);
      if (current?.movedTimer) window.clearTimeout(current.movedTimer);
    },
    [stop],
  );

  return {
    pos: state.pos,
    active: clamp(Math.round(state.pos), 0, state.max),
    dragging: !!state.drag,
    moved: () => state.moved,
    goTo,
    jumpTo,
    stageProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onLostPointerCapture: onPointerUp,
      onWheel,
      onKeyDown,
    },
  };
}

/** Fan-out entrance used by the curved wall; reduced-motion users receive the final arrangement immediately. */
export function useGalleryFanSpread(ref: RefObject<HTMLElement | null>, reducedMotion = false) {
  const [spread, setSpread] = useState(() => (reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      setSpread(1);
      return;
    }

    const element = ref.current;
    if (!element) {
      setSpread(1);
      return;
    }

    let frame = 0;
    let startTime = 0;
    let started = false;
    let fallbackTimer = 0;
    let observer: IntersectionObserver | null = null;

    const run = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min(1, (time - startTime) / 950);
      const eased = 1 - (1 - progress) ** 3;
      setSpread(0.001 + eased * 0.999);
      if (progress < 1) frame = requestAnimationFrame(run);
    };

    const start = () => {
      if (started) return;
      started = true;
      observer?.disconnect();
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      frame = requestAnimationFrame(run);
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
    } else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
      }, { threshold: 0.2 });
      observer.observe(element);

      const rect = element.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight || 800;
      if (rect.top < viewportHeight && rect.bottom > 0) start();
      else fallbackTimer = window.setTimeout(start, 1200);
    }

    return () => {
      observer?.disconnect();
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion, ref]);

  return spread;
}
