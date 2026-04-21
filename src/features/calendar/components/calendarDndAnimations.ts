import type { DropAnimation } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Drop animation for calendar `DragOverlay` clones. Replaces dnd-kit's default
// spring-back-to-origin: our post-drop flow keeps the original card visible at
// its old position until the saga commits the reschedule, and the original is
// then animated into its new slot via each card's `POSITION_TRANSITION`. A
// spring-back would visually conflict with that handoff.
//
// Behavior: 120ms in-place opacity fade (no transform change). sideEffects
// opts out of the default behavior of setting the active draggable's opacity
// to 0, since our dimmed-0.3 original needs to stay visible for continuity.
//
// Lives in its own module so the rest of `CalendarDnD.tsx` can keep exporting
// only React components (Vite Fast Refresh requirement).
export const DROP_ANIMATION: DropAnimation = {
  duration: 120,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  keyframes: ({ transform }) => [
    { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
    { opacity: 0, transform: CSS.Transform.toString(transform.initial) },
  ],
  sideEffects: () => undefined,
};
