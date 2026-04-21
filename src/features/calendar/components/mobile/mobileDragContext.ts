import { createContext, useContext } from "react";

/**
 * Shared flag for "is a mobile calendar DnD drag currently active?".
 * `MobileCalendarLayout` hosts the state and gates pull-to-refresh on it;
 * `MobileDayTimeline` sets it from dnd-kit's drag start/end callbacks.
 *
 * Kept intentionally tiny (boolean + setter) — this is a local coordination
 * signal between two cousins in the mobile tree, not shared app state.
 */
export interface MobileCalendarDragContextValue {
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
}

export const MobileCalendarDragContext = createContext<MobileCalendarDragContextValue>({
  dragActive: false,
  setDragActive: () => {},
});

export function useMobileCalendarDragContext(): MobileCalendarDragContextValue {
  return useContext(MobileCalendarDragContext);
}
