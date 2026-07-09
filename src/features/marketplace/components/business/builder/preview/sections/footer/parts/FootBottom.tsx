import { useRef } from "react";
import { Sparkles } from "lucide-react";
import type { PreviewData, T } from "../../../shared/types";
import { useFitText } from "./useFitText";

/** Shared footer close — the giant fit-to-width closing wordmark (editorial default only) over the base credit
 *  row. The orchestrator renders it once for every variant; poster/minimal carry their own brand lockup, so
 *  they drop the wordmark but keep the credit strip. */
export function FootBottom({ data, t, showWordmark }: { data: PreviewData; t: T; showWordmark: boolean }) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const year = new Date().getFullYear();
  const nameRef = useRef<HTMLDivElement>(null);
  useFitText(nameRef, showWordmark ? name : "");

  return (
    <div className="mc-foot-pad mc-foot-bottom">
      {showWordmark && (
        <div ref={nameRef} className="mc-foot-name">
          {name}
        </div>
      )}
      <div className="mc-foot-base">
        <span>{t("businessPage.builder.preview.footer.rights", { year, name })}</span>
        <span className="mc-foot-zav">
          <Sparkles className="h-3 w-3" strokeWidth={1.6} style={{ color: "var(--mc-accent)" }} />
          {t("businessPage.builder.preview.footer.poweredBy")}
        </span>
      </div>
    </div>
  );
}
