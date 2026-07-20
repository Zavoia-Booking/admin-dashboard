import { useEffect, useState } from "react";

/**
 * Website Builder owns a deliberately wider compact boundary than the shared phone breakpoint.
 * Keeping it local prevents a 768px assumption elsewhere in the dashboard from changing while
 * the Atelier editor, its sheets, and its preview remain one coherent presentation below 920px.
 */
const ATELIER_COMPACT_QUERY = "(max-width: 919px)";

export function useAtelierCompactLayout() {
  const [compact, setCompact] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(ATELIER_COMPACT_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(ATELIER_COMPACT_QUERY);
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return compact;
}
