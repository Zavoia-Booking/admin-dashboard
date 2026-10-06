import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ArrowRight, Save } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
  SetupSummaryPanel,
  type SetupSummaryHint,
  type SetupSummaryItem,
} from "../../../shared/components/common/SetupSummaryPanel";
import { cn } from "../../../shared/lib/utils";
import { useInView } from "../../../shared/hooks/useInView";
import type { LocationType } from "../../../shared/types/location";
import type { LocationWithAssignments } from "../types";

export type PublishChecklistItemKey = "industryTag" | "detailsValid";

interface MarketplacePublishStatusStripProps {
  isListed: boolean;
  isPublishing: boolean;
  canWrite: boolean;
  isDirty: boolean;
  hasValidationErrors: boolean;
  industryTagOk: boolean;
  businessDetailsOk: boolean;
  locationImagesOk: boolean;
  hasLocationPhoto: boolean;
  locations: LocationWithAssignments[];
  location?: Pick<
    LocationType,
    "id" | "name" | "isPublic" | "allowOnlineBooking"
  > | null;
  onManageVisibility?: (locationId: number) => void;
  onManageBooking?: (locationId: number) => void;
  onManagePhotos?: (locationId: number) => void;
  ownerProfileSetupNeeded?: boolean;
  onManageOwnerProfile?: () => void;
  onPublish: () => void;
  onPhotosNeeded: () => void;
  onResolveChecklistItem?: (item: PublishChecklistItemKey) => void;
  compactOnMobile?: boolean;
  mobileChecklistOpen?: boolean;
  onMobileChecklistOpenChange?: (open: boolean) => void;
  onMobileActionInViewChange?: (inView: boolean) => void;
}

/** Reuses the Assignments summary renderer; its rows never change publish gates. */
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
  location,
  onManageVisibility,
  onManageBooking,
  onManagePhotos,
  ownerProfileSetupNeeded = false,
  onManageOwnerProfile,
  onPublish,
  onPhotosNeeded,
  onResolveChecklistItem,
  compactOnMobile = false,
  mobileChecklistOpen,
  onMobileChecklistOpenChange,
  onMobileActionInViewChange,
}: MarketplacePublishStatusStripProps) {
  const { t } = useTranslation(["marketplace", "assignments"]);
  const {
    ref: mobileActionRef,
    inView: mobileActionInView,
    settled: mobileActionSettled,
  } = useInView<HTMLDivElement>();
  useEffect(() => {
    if (!mobileActionSettled) return;
    onMobileActionInViewChange?.(mobileActionInView);
  }, [mobileActionInView, mobileActionSettled, onMobileActionInViewChange]);

  const photosBlocked = !hasLocationPhoto || !locationImagesOk;
  const photoHintCoveredByChecklist = photosBlocked && locations.length === 1;
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
  ];
  const items: SetupSummaryItem[] = checklist.map((item) => ({
    ...item,
    onResolve: onResolveChecklistItem
      ? () => onResolveChecklistItem(item.key)
      : undefined,
  }));

  if (locations.length > 0) {
    items.push({
      key: "locationPhotos",
      ok: !photosBlocked,
      label: t(
        !photosBlocked
          ? "statusStrip.checklist.locationPhotosDone"
          : !hasLocationPhoto
            ? "statusStrip.checklist.locationPhotoNeeded"
            : "statusStrip.checklist.publicLocationPhotosNeeded",
      ),
      actionLabel: t("locations.needsPhoto"),
      stackActionOnMobile: true,
      onResolve: onPhotosNeeded,
    });
  }

  // These describe optional setup and settings, not publication requirements.
  const hints: SetupSummaryHint[] = [];
  if (ownerProfileSetupNeeded) {
    hints.push({
      key: "ownerProfileSetupNeeded",
      label: t("statusStrip.ownerProfileSetupNeeded"),
      actionLabel: t("ownerProfile.setupCta"),
      stackActionOnMobile: true,
      onResolve: onManageOwnerProfile,
    });
  }
  if (isListed && locations.length === 0 && location !== null) {
    hints.push({
      key: "noLocations",
      label: t("statusStrip.noLocationLive"),
    });
  }

  // null is the Locations overview; undefined leaves other tabs unscoped.
  const summaryLocations = location
    ? locations.filter((entry) => entry.id === location.id)
    : location === null
      ? locations
      : [];
  for (const entry of summaryLocations) {
    if (entry.isPublic === false) {
      hints.push({
        key: `locationHidden-${entry.id}`,
        label: (
          <Trans
            ns="marketplace"
            i18nKey="statusStrip.locationHidden"
            values={{ name: entry.name }}
            components={{ strong: <strong className="font-bold" /> }}
          />
        ),
        actionLabel: t("statusStrip.manageVisibility"),
        stackActionOnMobile: true,
        onResolve: onManageVisibility
          ? () => onManageVisibility(entry.id)
          : undefined,
      });
    }
    if (entry.allowOnlineBooking === false) {
      hints.push({
        key: `onlineBookingOff-${entry.id}`,
        label: (
          <Trans
            ns="marketplace"
            i18nKey="statusStrip.onlineBookingOff"
            values={{ name: entry.name }}
            components={{ strong: <strong className="font-bold" /> }}
          />
        ),
        actionLabel: t("statusStrip.manageBooking"),
        stackActionOnMobile: true,
        onResolve: onManageBooking
          ? () => onManageBooking(entry.id)
          : undefined,
      });
    }
    if (
      (entry.portfolioImages?.length ?? 0) === 0 &&
      !photoHintCoveredByChecklist
    ) {
      hints.push({
        key: `locationMissingPhotos-${entry.id}`,
        label: (
          <Trans
            ns="marketplace"
            i18nKey="statusStrip.locationPhotoGuidance"
            values={{ name: entry.name }}
            components={{ strong: <strong className="font-bold" /> }}
          />
        ),
        actionLabel: t("locations.needsPhoto"),
        stackActionOnMobile: true,
        onResolve: onManagePhotos ? () => onManagePhotos(entry.id) : undefined,
      });
    }
  }

  const publishDisabled =
    isPublishing || (isListed && !isDirty) || hasValidationErrors || !industryTagOk;
  const buttonLabel = isPublishing
    ? isListed
      ? t("configuration.buttons.saving")
      : t("configuration.buttons.publishing")
    : isListed
      ? t("configuration.buttons.saveChanges")
      : t("configuration.buttons.publish");

  const renderActionButton = (mobile = false) => (
    <Button
      onClick={() => (photosBlocked ? onPhotosNeeded() : onPublish())}
      disabled={publishDisabled}
      rounded="full"
      className={cn(
        "group shrink-0 px-4 text-sm font-semibold shadow-xs",
        "transition-[transform,box-shadow,background-color] duration-150 ease-out active:scale-[0.98]",
        mobile
          ? "!h-11 !min-h-11 w-full sm:w-auto"
          : "!h-10 !min-h-0 px-5",
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
            className="grid size-6 place-items-center rounded-full bg-white/15 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-active:scale-95"
            aria-hidden="true"
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
  );

  return (
    <SetupSummaryPanel
      items={items}
      hints={hints}
      hintsLabel={t(
        ownerProfileSetupNeeded
          ? "statusStrip.recommendationsLabel"
          : "statusStrip.locationSettingsLabel",
      )}
      hintsTone="normal"
      readyLabel={t(isListed ? "statusStrip.live" : "statusStrip.notListed")}
      attentionLabel={t("page.summary.attentionLabel", { ns: "assignments" })}
      groupLabel={t("statusStrip.requirementsLabel")}
      resolveLabel={t("page.summary.resolve", { ns: "assignments" })}
      progressLabel={(done, total) =>
        t("statusStrip.requiredProgressDone", { done, total })
      }
      open={mobileChecklistOpen}
      onOpenChange={onMobileChecklistOpenChange}
      headerAction={
        canWrite ? (
          <div className="hidden md:block">{renderActionButton()}</div>
        ) : undefined
      }
      footerAction={
        canWrite && (!isListed || (compactOnMobile && isDirty)) ? (
          <div
            ref={mobileActionRef}
            className="mt-4 md:hidden"
            onClick={
              publishDisabled && mobileChecklistOpen === false
                ? () => onMobileChecklistOpenChange?.(true)
                : undefined
            }
          >
            {renderActionButton(true)}
          </div>
        ) : undefined
      }
    />
  );
}

export default MarketplacePublishStatusStrip;
