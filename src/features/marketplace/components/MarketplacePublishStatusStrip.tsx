import { useTranslation } from "react-i18next";
import { Check, Circle, BadgeCheck, ArrowRight, Save, MapPin } from "lucide-react";
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
  businessDetailsOk: boolean;
  /** Every publicly visible location has at least one portfolio image */
  locationImagesOk: boolean;
  /** At least one location has a portfolio image (publishing requires it) */
  hasLocationPhoto: boolean;
  locations: LocationWithAssignments[];
  onPublish: () => void;
  /** Invoked instead of onPublish when photos are the blocker — jumps to the upload area */
  onPhotosNeeded: () => void;
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium leading-5",
        ok
          ? "text-green-700 dark:text-green-400"
          : "text-foreground-3 dark:text-foreground-2",
      )}
    >
      {ok ? (
        <Check className="size-3.5" strokeWidth={2.2} />
      ) : (
        <Circle className="size-3.5" strokeWidth={1.8} />
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
  businessDetailsOk,
  locationImagesOk,
  hasLocationPhoto,
  locations,
  onPublish,
  onPhotosNeeded,
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

  // Missing photos don't disable the button — clicking routes to the upload
  // area (scroll + pulse) instead of publishing, so the user lands on the fix.
  const photosBlocked = !hasLocationPhoto || !locationImagesOk;

  // Dirtiness only gates re-saves of an already-listed page — the first publish
  // IS the action (unlisted → live), so a clean-but-valid form must stay clickable.
  const publishDisabled =
    isPublishing || (isListed && !isDirty) || hasValidationErrors || !industryTagOk;

  return (
    <div className="overflow-hidden rounded-[1.125rem] border border-border bg-surface shadow-xs">
      <div className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0 space-y-2">
          {isListed ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground-1">
                <span className="grid size-5 place-items-center rounded-full bg-green-50 ring-1 ring-green-100 dark:bg-green-950/30 dark:ring-green-900/40">
                  <span className="size-2 rounded-full bg-green-500" aria-hidden />
                </span>
                <BadgeCheck className="size-4 text-green-600 dark:text-green-500" strokeWidth={2} />
                {t("statusStrip.live")}
              </span>
              <span className="hidden h-4 w-px bg-border-subtle sm:block" aria-hidden />
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-foreground-3 dark:text-foreground-2">
                <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} />
                <span>{t("statusStrip.locationsVisible", { visible: publicCount, total })}</span>
              </span>
              {publicCount === 0 && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                  {t("statusStrip.noLocationLive")}
                </span>
              )}
              {photosBlocked && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                  {t("statusStrip.locationNeedsImage")}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground-1">
                {t("statusStrip.toGoLive")}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <ChecklistItem ok={industryTagOk} label={t("statusStrip.checklist.industryTag")} />
                <ChecklistItem ok={businessDetailsOk} label={t("statusStrip.checklist.detailsValid")} />
                <ChecklistItem
                  ok={hasLocationPhoto}
                  label={t("statusStrip.checklist.locationPhoto")}
                />
                {/* Only meaningful once a location is set public — vacuously true otherwise */}
                {publicCount > 0 && (
                  <ChecklistItem ok={locationImagesOk} label={t("statusStrip.checklist.locationImages")} />
                )}
              </div>
            </div>
          )}

          {!isListed && (
            <div className="flex items-center gap-1.5 text-xs text-foreground-3 dark:text-foreground-2">
              <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span>{t("statusStrip.locationsVisible", { visible: publicCount, total })}</span>
            </div>
          )}

          {/* Public locations won't actually show until the business page is published. */}
          {!isListed && publicCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
              {t("statusStrip.locationsWaitingPublish")}
            </p>
          )}
        </div>

        {canWrite && (
          <Button
            onClick={() => (photosBlocked ? onPhotosNeeded() : onPublish())}
            disabled={publishDisabled}
            rounded="full"
            className={cn(
              "group !h-10 !min-h-0 w-full shrink-0 px-4 text-sm font-semibold shadow-xs",
              "transition-[transform,box-shadow,background-color] duration-150 ease-out active:scale-[0.98]",
              "sm:w-auto sm:px-5",
              publishDisabled ? "shadow-none" : "shadow-primary/15",
            )}
          >
            {isPublishing ? (
              <>
                <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>{buttonLabel}</span>
              </>
            ) : (
              <>
                <span>{buttonLabel}</span>
                <span
                  className="hidden size-6 place-items-center rounded-full bg-white/15 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-active:scale-95 md:grid"
                  aria-hidden
                >
                  {isListed ? (
                    <Save className="size-3.5" strokeWidth={1.9} />
                  ) : (
                    <ArrowRight className="size-3.5" strokeWidth={1.9} />
                  )}
                </span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default MarketplacePublishStatusStrip;
