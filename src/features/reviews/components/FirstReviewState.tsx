import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../../shared/components/common/EmptyState";

/**
 * True zero-state for the Reviews tab — uses the shared [EmptyState]
 * component verbatim (abstract overlapping skeleton-card illustration +
 * neutral copy), so the empty experience matches calendar / customers /
 * services / every other zero-state in the app. No bespoke chrome.
 *
 * The icon is Star — sits inside the front skeleton card's avatar slot
 * and quietly signals "this is review territory" without inventing a
 * new visual language. Rendered only when this business has zero
 * reviews anywhere; the page also hides the toolbar + sidebar in that
 * case so the user isn't asked to interact with controls that have
 * nothing to operate on.
 */
export function FirstReviewState() {
  const { t } = useTranslation("reviews");
  return (
    <EmptyState
      title={t("empty.title")}
      description={t("empty.description")}
      icon={Star}
    />
  );
}
