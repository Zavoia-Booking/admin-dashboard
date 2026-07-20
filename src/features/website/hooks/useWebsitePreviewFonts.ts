import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import { fontStylesheetFor } from "../components/builder/theme";
import { selectWebsiteDraft } from "../selectors";

const PRECONNECT_ID = "website-preview-fonts-preconnect";
const PRECONNECT_STATIC_ID = "website-preview-fonts-static-preconnect";
const STYLESHEET_ID = "website-preview-fonts-stylesheet";

interface ActiveFontRequest {
  stylesheetUrl: string | undefined;
  sequence: number;
}

const activeFontRequests = new Map<symbol, ActiveFontRequest>();
let fontRequestSequence = 0;

function ensureLink(id: string, attributes: Record<string, string>): void {
  const existing = document.getElementById(id);
  if (existing instanceof HTMLLinkElement) {
    Object.entries(attributes).forEach(([name, value]) => existing.setAttribute(name, value));
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  Object.entries(attributes).forEach(([name, value]) => link.setAttribute(name, value));
  document.head.appendChild(link);
}

function removeManagedLink(id: string): void {
  document.getElementById(id)?.remove();
}

/** Multiple Website surfaces can be mounted together (the route owner plus the live workspace).
 * The newest request represents the most specific, live selection. Falling back to the next
 * request on unmount keeps locked/legacy previews correct without leaving an inactive face loaded. */
function syncManagedFontLinks(): void {
  const current = [...activeFontRequests.values()].reduce<ActiveFontRequest | null>(
    (latest, request) => !latest || request.sequence > latest.sequence ? request : latest,
    null,
  );
  const stylesheetUrl = current?.stylesheetUrl;
  if (!stylesheetUrl) {
    removeManagedLink(STYLESHEET_ID);
    removeManagedLink(PRECONNECT_ID);
    removeManagedLink(PRECONNECT_STATIC_ID);
    return;
  }

  ensureLink(PRECONNECT_ID, { rel: "preconnect", href: "https://fonts.googleapis.com" });
  ensureLink(PRECONNECT_STATIC_ID, {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossorigin: "anonymous",
  });
  ensureLink(STYLESHEET_ID, { rel: "stylesheet", href: stylesheetUrl });
}

/**
 * Loads only the selected preview display face while the Website route is mounted.
 * Dashboard Geist remains local, and this hook never changes the preview's fixed paper theme.
 */
export function useWebsitePreviewFonts(fontKeyOverride?: string | null) {
  const savedFontKey = useSelector(selectWebsiteDraft)?.pageTheme?.fontKey;
  const fontKey = fontKeyOverride ?? savedFontKey ?? "modern";
  const stylesheetUrl = fontStylesheetFor(fontKey);
  const requestIdRef = useRef(Symbol("website-preview-font-request"));

  useEffect(() => {
    const requestId = requestIdRef.current;
    activeFontRequests.set(requestId, {
      stylesheetUrl,
      sequence: ++fontRequestSequence,
    });
    syncManagedFontLinks();

    return () => {
      activeFontRequests.delete(requestId);
      syncManagedFontLinks();
    };
  }, [stylesheetUrl]);
}
