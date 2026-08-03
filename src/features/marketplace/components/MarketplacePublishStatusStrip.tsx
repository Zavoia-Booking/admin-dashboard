import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Circle,
  CircleCheck,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Save,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../shared/components/ui/collapsible";
import { cn } from "../../../shared/lib/utils";
import { useInView } from "../../../shared/hooks/useInView";
import type { LocationWithAssignments } from "../types";

export type PublishChecklistItemKey =
  | "industryTag"
  | "detailsValid"
  | "locationPhoto";

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
  /** Mobile checklist "Resolve" action — navigates to where the item is fixed. */
  onResolveChecklistItem?: (item: PublishChecklistItemKey) => void;
  /** Replaces the full checklist with a compact completion action below xl. */
  compactOnMobile?: boolean;
  /** Mobile checklist disclosure — controlled by the parent so the state is
   *  shared across the strip instances rendered in each tab panel. */
  mobileChecklistOpen?: boolean;
  onMobileChecklistOpenChange?: (open: boolean) => void;
  /** Reports whether this instance's mobile publish button is on screen, so the
   *  view can float a stand-in once it scrolls away. Pass it only to the strip
   *  in the active tab panel: hidden panels are display:none, so their observer
   *  would report "off screen" forever and pin the stand-in open. */
  onMobileActionInViewChange?: (inView: boolean) => void;
}

function ChecklistItem({
  ok,
  label,
  onResolve,
}: {
  ok: boolean;
  label: string;
  /** Pending items render as a button jumping to where the item is fixed. */
  onResolve?: () => void;
}) {
  const baseClass = cn(
    "inline-flex items-center gap-1.5 text-[12px] font-medium leading-5",
    ok
      ? "text-green-700 dark:text-green-400"
      : "text-foreground-3 dark:text-foreground-2",
  );
  const icon = ok ? (
    <CircleCheck className="size-3.5 shrink-0" strokeWidth={2} />
  ) : (
    <Circle className="size-3.5 shrink-0" strokeWidth={1.8} />
  );

  if (!ok && onResolve) {
    return (
      <button
        type="button"
        onClick={onResolve}
        className={cn(
          baseClass,
          "cursor-pointer rounded-md transition-colors duration-150 ease-out hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40",
        )}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <span className={baseClass}>
      {icon}
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
  onResolveChecklistItem,
  compactOnMobile = false,
  mobileChecklistOpen,
  onMobileChecklistOpenChange,
  onMobileActionInViewChange,
}: MarketplacePublishStatusStripProps) {
  const { t } = useTranslation("marketplace");
  const checklistOpen = mobileChecklistOpen ?? true;

  // Attached to the mobile publish button. The ref goes unused while listed (that
  // branch renders no button), so no observer is created and inView stays true —
  // which correctly keeps the floating stand-in down.
  const {
    ref: mobileActionRef,
    inView: mobileActionInView,
    settled: mobileActionSettled,
  } = useInView<HTMLDivElement>();
  // Only a live reading is reported. Becoming the active tab hands this strip
  // the callback, and firing it with the reading left over from the last visit
  // pops the floating stand-in in for the frame before the observer catches up.
  useEffect(() => {
    if (!mobileActionSettled) return;
    onMobileActionInViewChange?.(mobileActionInView);
  }, [mobileActionInView, mobileActionSettled, onMobileActionInViewChange]);

  const publicCount = locations.filter((l) => l.isPublic).length;

  // Publish gate as data, shared by the desktop band and the mobile card.
  const checklist: Array<{
    key: PublishChecklistItemKey;
    ok: boolean;
    label: string;
  }> = [
    {
      key: "industryTag",
      ok: industryTagOk,
      label: t("statusStrip.checklist.industryTag"),
    },
    {
      key: "detailsValid",
      ok: businessDetailsOk,
      label: t("statusStrip.checklist.detailsValid"),
    },
    {
      key: "locationPhoto",
      // Mirrors the photosBlocked publish gate: ≥1 photo overall AND every
      // publicly visible location covered (vacuously true with none public).
      ok: hasLocationPhoto && locationImagesOk,
      label: t("statusStrip.checklist.locationPhoto"),
    },
  ];
  const doneCount = checklist.filter((item) => item.ok).length;

  // The sentence string minus its trailing colon — as an uppercase group
  // label the colon reads as a typo.
  const toGoLiveLabel = t("statusStrip.toGoLive").replace(/:\s*$/, "");
  const statusLabel = isListed
    ? t("statusStrip.live")
    : t("statusStrip.notListed");

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

  const renderActionButton = (compact = false) =>
    canWrite ? (
      <Button
        onClick={() => (photosBlocked ? onPhotosNeeded() : onPublish())}
        disabled={publishDisabled}
        rounded="full"
        className={cn(
          "group shrink-0 px-4 text-sm font-semibold shadow-xs",
          "transition-[transform,box-shadow,background-color] duration-150 ease-out active:scale-[0.98]",
          compact
            ? "!h-11 !min-h-11 w-full sm:w-auto"
            : "!h-11 !min-h-11 w-full sm:w-auto sm:px-5 md:!h-10 md:!min-h-0",
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
              className={cn(
                "size-6 place-items-center rounded-full bg-white/15 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-active:scale-95",
                compact ? "grid" : "hidden md:grid",
              )}
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
    ) : null;

  const showCompactAction = !isListed || isDirty;

  return (
    <>
      {compactOnMobile && (
        <div className="rounded-[1.125rem] border border-border bg-surface px-4 py-3.5 shadow-xs xl:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <StatusChipLabel isListed={isListed} label={statusLabel} />
              {photosBlocked && (
                <p className="text-xs leading-5 text-warning">
                  {t("statusStrip.locationNeedsImage")}
                </p>
              )}
            </div>
            {showCompactAction && renderActionButton(true)}
          </div>
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-[1.125rem] border border-border bg-surface shadow-xs",
          compactOnMobile && "max-xl:hidden",
        )}
      >
        {/* md+: horizontal band — status chip left, action right, publish
            gate as a quiet tinted footer. */}
        <div className="hidden md:block">
          <div className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <StatusChipLabel isListed={isListed} label={statusLabel} />
              {isListed && publicCount === 0 && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                  {t("statusStrip.noLocationLive")}
                </span>
              )}
              {isListed && photosBlocked && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                  {t("statusStrip.locationNeedsImage")}
                </span>
              )}
            </div>

            {renderActionButton()}
          </div>

          {!isListed && (
            <div className="border-t border-border-subtle bg-muted/20 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
                  {toGoLiveLabel}
                </span>
                {checklist.map((item) => (
                  <ChecklistItem
                    key={item.key}
                    ok={item.ok}
                    label={item.label}
                    onResolve={
                      onResolveChecklistItem
                        ? () => onResolveChecklistItem(item.key)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: stacked publish card — status row doubles as a disclosure
            for the checklist (collapsed by default); progress bar and the
            publish action stay always visible. */}
        <div className="px-4 py-4 md:hidden">
          {isListed ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <StatusChipLabel isListed={isListed} label={statusLabel} />
                {publicCount === 0 && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                    {t("statusStrip.noLocationLive")}
                  </p>
                )}
                {photosBlocked && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                    {t("statusStrip.locationNeedsImage")}
                  </p>
                )}
              </div>
              {/* No inline save here: below md the view's floating save pill
                  carries the action, so the strip stays informational. */}
            </div>
          ) : (
            <Collapsible
              open={checklistOpen}
              onOpenChange={(open) => onMobileChecklistOpenChange?.(open)}
            >
              <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40">
                <StatusChipLabel isListed={isListed} label={statusLabel} />
                <ChevronDown
                  className="size-4 shrink-0 text-foreground-3 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                  aria-hidden
                />
              </CollapsibleTrigger>

              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-green-500 transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    style={{
                      width: `${(doneCount / checklist.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums text-foreground-3 dark:text-foreground-2">
                  {t("statusStrip.progressDone", {
                    done: doneCount,
                    total: checklist.length,
                  })}
                </span>
              </div>

              <CollapsibleContent>
                {/* Spacing lives inside the animated container so the height
                    morph covers it — a margin here would pop in un-animated. */}
                <div className="pt-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
                    {toGoLiveLabel}
                  </span>
                  <div className="mt-1">
                    {checklist.map((item) => (
                      <div
                        key={item.key}
                        className="flex min-h-11 items-center justify-between gap-3"
                      >
                        <span
                          className={cn(
                            "flex min-w-0 items-center gap-2.5 text-[13px] font-medium leading-5",
                            item.ok
                              ? "text-green-700 dark:text-green-400"
                              : "text-foreground-1",
                          )}
                        >
                          {item.ok ? (
                            <CircleCheck className="size-4 shrink-0" strokeWidth={2} />
                          ) : (
                            <Circle
                              className="size-4 shrink-0 text-amber-500"
                              strokeWidth={1.8}
                            />
                          )}
                          <span className="min-w-0">{item.label}</span>
                        </span>
                        {!item.ok && onResolveChecklistItem && (
                          <button
                            type="button"
                            onClick={() => onResolveChecklistItem(item.key)}
                            className="group inline-flex h-11 shrink-0 cursor-pointer items-center gap-0.5 px-1 text-[13px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:rounded-md"
                          >
                            {t("statusStrip.resolve")}
                            <ChevronRight
                              className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                              aria-hidden
                            />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>

              {canWrite && (
                // The disabled publish button has pointer-events-none, so taps
                // land here — answer "why can't I publish?" by opening the list.
                <div
                  ref={mobileActionRef}
                  className="mt-4"
                  onClick={
                    publishDisabled && !checklistOpen
                      ? () => onMobileChecklistOpenChange?.(true)
                      : undefined
                  }
                >
                  {renderActionButton(true)}
                </div>
              )}
            </Collapsible>
          )}
        </div>
      </div>
    </>
  );
}

/** Status dot chip + label — shared by the band and the mobile card. */
function StatusChipLabel({
  isListed,
  label,
}: {
  isListed: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground-1">
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full ring-1",
          isListed
            ? "bg-green-50 ring-green-100 dark:bg-green-950/30 dark:ring-green-900/40"
            : "bg-amber-50 ring-amber-100 dark:bg-amber-950/30 dark:ring-amber-900/40",
        )}
      >
        <span className="relative flex size-2" aria-hidden>
          {/* Live gets a slow heartbeat ping; the halo peaks at 2x so it stays
              inside the size-5 ring. */}
          {isListed && (
            <span
              className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-40"
              style={{ animationDuration: "2s" }}
            />
          )}
          <span
            className={cn(
              "relative inline-flex size-full rounded-full",
              isListed ? "bg-green-500" : "bg-amber-500",
            )}
          />
        </span>
      </span>
      {label}
    </span>
  );
}

export default MarketplacePublishStatusStrip;
