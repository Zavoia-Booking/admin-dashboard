import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "../../../shared/components/ui/spinner";
import { useWebsitePreviewFonts } from "../hooks/useWebsitePreviewFonts";

// Atelier is the production Website Builder. Keeping the retired implementation behind an
// unset build flag made production silently load a UI that does not support theme commerce.
const WebsiteImplementation = lazy(() => import("./website-atelier"));

function WebsiteRouteFallback() {
  const { t } = useTranslation("website");

  return (
    <div
      className="grid min-h-dvh place-items-center bg-background"
      role="status"
      aria-label={t("page.status.loading")}
    >
      <Spinner size="lg" />
    </div>
  );
}

export default function WebsitePage() {
  useWebsitePreviewFonts();

  return (
    <Suspense fallback={<WebsiteRouteFallback />}>
      <WebsiteImplementation />
    </Suspense>
  );
}
