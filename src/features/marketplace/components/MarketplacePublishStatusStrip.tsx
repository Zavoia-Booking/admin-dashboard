import { useTranslation } from "react-i18next";
import { Check, Circle, AlertTriangle, BadgeCheck, ArrowRight, Save, MapPin } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { cn } from "../../../shared/lib/utils";
import type { LocationWithAssignments } from "../types";

interface MarketplacePublishStatusStripProps {
  isListed: boolean;
  isPublishing: boolean;
  canWrite: boolean;
  isDirty: boolean;
  hasValidationErrors: boolean;
  industryTagOk: boolean;
  detailsOk: boolean;
  locations: LocationWithAssignments[];
  hiddenBySystem?: boolean;
  onPublish: () => void;
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        ok ? "text-green-600 dark:text-green-500" : "text-foreground-3 dark:text-foreground-2",
      )}
    >
      {ok ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Circle className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
}

/**
 * Persistent business-level go-live status strip shown above the tabs.
 * Surfaces the publish gate as an explicit checklist (not a silently-disabled
 * button) and a per-location visibility count.
 */
export function MarketplacePublishStatusStrip({
  isListed,
  isPublishing,
  canWrite,
  isDirty,
  hasValidationErrors,
  industryTagOk,
  detailsOk,
  locations,
  hiddenBySystem,
  onPublish,
}: MarketplacePublishStatusStripProps) {
  const { t } = useTranslation("marketplace");

  const total = locations.length;
  const publicCount = locations.filter((l) => l.isPublic).length;

  const buttonLabel = isPublishing
    ? isListed
      ? t("configuration.buttons.saving")
      : t("configuration.buttons.publishing")
    : isListed
      ? t("configuration.buttons.saveChanges")
      : t("configuration.buttons.publish");

  const publishDisabled =
    isPublishing || !isDirty || hasValidationErrors || !industryTagOk;

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-surface shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status / checklist */}
        <div className="min-w-0 space-y-2">
          {hiddenBySystem ? (
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t("statusStrip.hiddenBySystem")}</span>
            </div>
          ) : isListed ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping" style={{ animationDuration: "3s" }} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <BadgeCheck className="h-4 w-4 text-green-600 dark:text-green-500" />
              {t("statusStrip.live")}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground-1">
                {t("statusStrip.toGoLive")}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <ChecklistItem ok={industryTagOk} label={t("statusStrip.checklist.industryTag")} />
                <ChecklistItem ok={detailsOk} label={t("statusStrip.checklist.detailsValid")} />
              </div>
            </div>
          )}

          {/* Locations visible count */}
          <div className="flex items-center gap-1.5 text-xs text-foreground-3 dark:text-foreground-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{t("statusStrip.locationsVisible", { visible: publicCount, total })}</span>
            {isListed && publicCount === 0 && (
              <span className="text-amber-600 dark:text-amber-500 font-medium">
                · {t("statusStrip.noLocationLive")}
              </span>
            )}
          </div>

          {/* Public locations won't actually show until the business page is published. */}
          {!isListed && publicCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
              {t("statusStrip.locationsWaitingPublish")}
            </p>
          )}
        </div>

        {/* Publish / Save */}
        {canWrite && (
          <Button
            onClick={onPublish}
            disabled={publishDisabled}
            className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-5 md:!px-6 text-xs md:text-sm w-full sm:w-auto shrink-0"
          >
            {isPublishing ? (
              <>
                <div className="rounded-full border-2 border-white/30 border-t-white animate-spin h-3.5 w-3.5" />
                <span>{buttonLabel}</span>
              </>
            ) : (
              <>
                <span>{buttonLabel}</span>
                {isListed ? (
                  <Save className="hidden md:inline h-4 w-4" />
                ) : (
                  <ArrowRight className="inline h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                )}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default MarketplacePublishStatusStrip;
