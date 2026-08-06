import { lazy, Suspense } from "react";
import { useWebsitePreviewFonts } from "../hooks/useWebsitePreviewFonts";
import { WebsiteBuilderSkeleton } from "../components/WebsiteBuilderSkeleton";
import { WebsiteStudioFrame } from "../components/atelier/WebsiteStudioFrame";

// Atelier is the production Website Builder. Keeping the retired implementation behind an
// unset build flag made production silently load a UI that does not support theme commerce.
const WebsiteImplementation = lazy(() => import("./website-atelier"));

export default function WebsitePage() {
  useWebsitePreviewFonts();

  // The frame (sidebar + inset) sits outside Suspense so loading-stage swaps
  // never remount the rail — its entry collapse animates exactly once.
  return (
    <WebsiteStudioFrame>
      <Suspense fallback={<WebsiteBuilderSkeleton />}>
        <WebsiteImplementation />
      </Suspense>
    </WebsiteStudioFrame>
  );
}
