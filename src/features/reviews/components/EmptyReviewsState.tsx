import { MessageSquareText, FilterX, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../shared/components/ui/button";

export type EmptyReviewsStateKind = "none" | "filtered" | "error";

interface EmptyReviewsStateProps {
  kind: EmptyReviewsStateKind;
  onClearFilters?: () => void;
  onRetry?: () => void;
  /**
   * Scopes the filtered-empty copy. `"business"` (default) names the
   * star/location/team-member filters of the owner reviews page;
   * `"personal"` names only the rating filter, the team-member page's
   * single filter.
   */
  variant?: "business" | "personal";
}

const ICON: Record<EmptyReviewsStateKind, typeof MessageSquareText> = {
  none: MessageSquareText,
  filtered: FilterX,
  error: AlertTriangle,
};

export function EmptyReviewsState({
  kind,
  onClearFilters,
  onRetry,
  variant = "business",
}: EmptyReviewsStateProps) {
  const { t } = useTranslation("reviews");
  const Icon = ICON[kind];

  const titleKey =
    kind === "none"
      ? "empty.title"
      : kind === "filtered"
        ? "empty.noFilteredTitle"
        : "empty.errorTitle";
  const bodyKey =
    kind === "none"
      ? "empty.description"
      : kind === "filtered"
        ? variant === "personal"
          ? "empty.noFilteredBodyPersonal"
          : "empty.noFilteredBody"
        : "empty.errorBody";

  const iconTone =
    kind === "error"
      ? "text-error"
      : kind === "filtered"
        ? "text-primary/80"
        : "text-foreground-3";

  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-surface-hover border border-border flex items-center justify-center">
        <Icon className={`h-5 w-5 ${iconTone}`} />
      </div>
      <div className="space-y-1 max-w-[32ch]">
        <p className="text-sm font-semibold text-foreground-1">{t(titleKey)}</p>
        <p className="text-[12.5px] text-foreground-3 leading-relaxed">
          {t(bodyKey)}
        </p>
      </div>
      {kind === "filtered" && onClearFilters && (
        <Button
          variant="outline"
          size="sm"
          rounded="full"
          onClick={onClearFilters}
          className="mt-1"
        >
          {t("empty.noFilteredAction")}
        </Button>
      )}
      {kind === "error" && onRetry && (
        <Button
          variant="outline"
          size="sm"
          rounded="full"
          onClick={onRetry}
          className="mt-1"
        >
          {t("empty.errorAction")}
        </Button>
      )}
    </div>
  );
}
