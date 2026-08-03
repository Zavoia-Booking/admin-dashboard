import { lazy, Suspense } from "react";
import { useWebsitePreviewFonts } from "../hooks/useWebsitePreviewFonts";
import { WebsiteBuilderSkeleton } from "../components/WebsiteBuilderSkeleton";

// Atelier is the production Website Builder. Keeping the retired implementation behind an
// unset build flag made production silently load a UI that does not support theme commerce.
const WebsiteImplementation = lazy(() => import("./website-atelier"));

export default function WebsitePage() {
  useWebsitePreviewFonts();

  return (
    <Suspense fallback={<WebsiteBuilderSkeleton />}>
      <WebsiteImplementation />
    </Suspense>
  );
}
