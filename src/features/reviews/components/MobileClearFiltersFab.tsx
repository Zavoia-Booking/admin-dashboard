import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../shared/lib/utils";

interface Props {
  activeFilterCount: number;
  onClearAll: () => void;
}

/**
 * Floating "Clear filters" pill for the mobile reviews tab — mirrors the
 * [MobileClearFiltersFab] used in the calendar so the affordance is the
 * same across the app: bottom-right, reserved space above the device safe
 * area + the global mobile bottom nav (pb-19 = 76px reserved in
 * AppLayout), rounded-full pill with the live filter count. Promoted to
 * its own compositor layer (translateZ(0) + will-change) so the surrounding
 * reviews list never has to re-paint because of this overlay.
 *
 * Rendered only on viewports below lg; the desktop sidebar has the
 * equivalent Clear pill inside [ReviewsInsightsPanel] and stays sticky
 * with the user as they scroll.
 */
export function MobileClearFiltersFab({
  activeFilterCount,
  onClearAll,
}: Props) {
  const { t } = useTranslation("reviews");

  if (activeFilterCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onClearAll}
      aria-label={t("filters.clearAll")}
      className={cn(
        "fixed right-4 z-40 lg:hidden",
        "inline-flex items-center gap-2 h-11 pl-4 pr-3 rounded-full",
        "bg-white dark:bg-surface text-foreground-1 text-sm font-semibold",
        "border border-border shadow-lg",
        "active:scale-[0.96] transition-transform duration-100",
        "cursor-pointer",
      )}
      style={{
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px) + 16px)",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <RotateCcw className="h-4 w-4 text-primary" aria-hidden />
      <span>{t("filters.clearAll")}</span>
      <span
        className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground tabular-nums"
        aria-hidden="true"
      >
        {activeFilterCount}
      </span>
    </button>
  );
}
