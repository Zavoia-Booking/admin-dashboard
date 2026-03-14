import * as React from "react";

/**
 * When set (e.g. by BaseSlider), popovers/dropdowns that use this context
 * will render their portal content inside this container instead of document.body,
 * so they stay clipped within the slider panel.
 */
export const PortalContainerContext = React.createContext<React.RefObject<HTMLElement | null> | null>(null);

export function usePortalContainer(): React.RefObject<HTMLElement | null> | null {
  return React.useContext(PortalContainerContext);
}
