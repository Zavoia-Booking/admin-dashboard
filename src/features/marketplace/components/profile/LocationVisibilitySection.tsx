import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "../../../../shared/components/ui/switch";
import type { LocationWithAssignments } from "../../types";
import { updateLocationMarketplaceFlagsAction } from "../../actions";
import { requestPortfolioAttention } from "../../utils/portfolioAttention";
import {
  consumeLocationSettingsAttention,
  LOCATION_SETTINGS_ATTENTION_EVENT,
  type LocationSettingsAttentionTarget,
} from "../../utils/locationSettingsAttention";
import { selectUpdatingLocationFlags } from "../../selectors";
import { EditLocationMarketplaceDetailsSlider } from "../EditLocationMarketplaceDetailsSlider";
import { cn } from "../../../../shared/lib/utils";

interface LocationVisibilitySectionProps {
  location: LocationWithAssignments;
}

/**
 * Marketplace-owned settings for a single location. Operational location data
 * and assignments remain linked from the workspace header in LocationPanel.
 */
export function LocationVisibilitySection({
  location,
}: LocationVisibilitySectionProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation("marketplace");
  const updatingIds = useSelector(selectUpdatingLocationFlags);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  // Redux tracks the updating location, not which flag; remember the toggle
  // that fired so only its row shows the spinner.
  const [pendingFlag, setPendingFlag] = useState<"public" | "booking" | null>(
    null,
  );
  const isUpdating = updatingIds.includes(location.id);
  const publicRowRef = useRef<HTMLLabelElement>(null);
  const bookingRowRef = useRef<HTMLLabelElement>(null);
  const [attentionTarget, setAttentionTarget] =
    useState<LocationSettingsAttentionTarget | null>(null);
  const pendingAttentionRef = useRef<{
    locationId: number;
    target: LocationSettingsAttentionTarget;
  } | null>(null);

  useEffect(() => {
    setAttentionTarget(null);
    let retryTimer: number | null = null;
    let highlightTimer: number | null = null;
    let clearHighlightTimer: number | null = null;
    let firstFrame = 0;
    let secondFrame = 0;

    const clearScheduledAttention = () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (highlightTimer !== null) window.clearTimeout(highlightTimer);
      if (clearHighlightTimer !== null) window.clearTimeout(clearHighlightTimer);
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      retryTimer = null;
      highlightTimer = null;
      clearHighlightTimer = null;
      firstFrame = 0;
      secondFrame = 0;
    };

    const focusSetting = (target: LocationSettingsAttentionTarget) => {
      clearScheduledAttention();
      setAttentionTarget(null);
      const deadline = Date.now() + 5000;
      const attemptFocus = () => {
        const row =
          target === "visibility" ? publicRowRef.current : bookingRowRef.current;
        // Tabs stay mounted while hidden. Wait for the requested setting row;
        // scrolling does not depend on whether its switch is saving.
        if (!row || row.getClientRects().length === 0) {
          if (Date.now() < deadline) {
            retryTimer = window.setTimeout(attemptFocus, 50);
          }
          return;
        }

        // LocationsTab focuses the detail heading in its first frame. Wait for
        // it and the newly revealed workspace to settle before moving focus.
        firstFrame = window.requestAnimationFrame(() => {
          secondFrame = window.requestAnimationFrame(() => {
            let ancestor: HTMLElement | null = row;
            while (ancestor) {
              if (
                ancestor.getAnimations().some(
                  (animation) =>
                    animation.playState === "running" &&
                    animation.effect?.getComputedTiming().endTime !== Infinity,
                ) &&
                Date.now() < deadline
              ) {
                retryTimer = window.setTimeout(attemptFocus, 50);
                return;
              }
              ancestor = ancestor.parentElement;
            }
            if (row.getClientRects().length === 0) {
              attemptFocus();
              return;
            }
            const reduceMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            // Use the Marketplace's existing Fix scroll path so the browser
            // reaches the row's scrolling ancestor on every workspace layout.
            row.scrollIntoView({
              block: "center",
              inline: "nearest",
              behavior: reduceMotion ? "auto" : "smooth",
            });
            const switchButton = row.control;
            if (
              switchButton instanceof HTMLButtonElement &&
              !switchButton.disabled
            ) {
              switchButton.focus({ preventScroll: true });
            }
            pendingAttentionRef.current = null;
            // Match the existing summary attention timing: the ring starts
            // after the scroll lands and repeated actions restart it.
            highlightTimer = window.setTimeout(
              () => setAttentionTarget(target),
              400,
            );
            clearHighlightTimer = window.setTimeout(
              () => setAttentionTarget(null),
              2200,
            );
          });
        });
      };
      attemptFocus();
    };

    const receiveAttention = () => {
      const target = consumeLocationSettingsAttention(location.id);
      if (!target) return;
      pendingAttentionRef.current = { locationId: location.id, target };
      focusSetting(target);
    };
    window.addEventListener(LOCATION_SETTINGS_ATTENTION_EVENT, receiveAttention);
    const pendingTarget = consumeLocationSettingsAttention(location.id);
    if (pendingTarget) {
      pendingAttentionRef.current = {
        locationId: location.id,
        target: pendingTarget,
      };
    }
    // Preserve a consumed request across mount-effect cleanup/replay until
    // focus lands; cleanup still cancels all work for an unmounted workspace.
    if (pendingAttentionRef.current?.locationId === location.id) {
      focusSetting(pendingAttentionRef.current.target);
    }
    return () => {
      window.removeEventListener(
        LOCATION_SETTINGS_ATTENTION_EVENT,
        receiveAttention,
      );
      clearScheduledAttention();
    };
  }, [location.id]);

  if (!isUpdating && pendingFlag !== null) setPendingFlag(null);

  const handleTogglePublic = (isPublic: boolean) => {
    // A public location needs at least one image. Keep the existing attention
    // flow, but the gallery is already mounted in this workspace.
    if (isPublic && (location.portfolioImages?.length ?? 0) === 0) {
      requestPortfolioAttention(location.id);
      return;
    }

    setPendingFlag("public");
    dispatch(
      updateLocationMarketplaceFlagsAction.request({
        locationId: location.id,
        isPublic,
      }),
    );
  };

  const handleToggleBooking = (allowOnlineBooking: boolean) => {
    setPendingFlag("booking");
    dispatch(
      updateLocationMarketplaceFlagsAction.request({
        locationId: location.id,
        allowOnlineBooking,
      }),
    );
  };

  const publicLabelId = `marketplace-public-${location.id}`;
  const publicDescriptionId = `${publicLabelId}-description`;
  const bookingLabelId = `marketplace-booking-${location.id}`;
  const bookingDescriptionId = `${bookingLabelId}-description`;
  const attentionClass = (target: LocationSettingsAttentionTarget) =>
    cn(
      "rounded-2xl transition-shadow duration-300 ease-out motion-reduce:transition-none",
      attentionTarget === target &&
        "ring-2 ring-primary/45 ring-offset-4 ring-offset-background",
    );

  return (
    <>
      <section
        className="rounded-2xl border border-border bg-surface shadow-sm"
        aria-labelledby={`marketplace-visibility-title-${location.id}`}
      >
        <div className="divide-y divide-border px-4 md:px-5">
          <div className="py-4 md:py-5">
            <h3
              id={`marketplace-visibility-title-${location.id}`}
              className="text-lg font-semibold tracking-tight text-foreground-1"
            >
              {t("locations.workspace.visibilityTitle")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-foreground-3 dark:text-foreground-2">
              {t("locations.workspace.visibilityDescription")}
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground-3 dark:text-foreground-2">
              {t("locations.workspace.autoSave")}
            </p>
          </div>

          <label
            ref={publicRowRef}
            htmlFor={`marketplace-public-switch-${location.id}`}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-4 py-4 md:py-5",
              attentionClass("visibility"),
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span
                  id={publicLabelId}
                  className="text-sm font-semibold text-foreground-1"
                >
                  {t("locationVisibility.isPublic")}
                </span>
                {isUpdating && pendingFlag === "public" && (
                  <Loader2
                    className="size-3.5 animate-spin text-foreground-3"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                id={publicDescriptionId}
                className="mt-1 block text-sm leading-6 text-foreground-3 dark:text-foreground-2"
              >
                {t("locationVisibility.isPublicDescription")}
              </span>
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center">
              <Switch
                id={`marketplace-public-switch-${location.id}`}
                checked={location.isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={isUpdating}
                aria-labelledby={publicLabelId}
                aria-describedby={publicDescriptionId}
              />
            </span>
          </label>

          <label
            ref={bookingRowRef}
            htmlFor={`marketplace-booking-switch-${location.id}`}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-4 py-4 md:py-5",
              attentionClass("booking"),
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span
                  id={bookingLabelId}
                  className="text-sm font-semibold text-foreground-1"
                >
                  {t("locationVisibility.allowOnlineBooking")}
                </span>
                {isUpdating && pendingFlag === "booking" && (
                  <Loader2
                    className="size-3.5 animate-spin text-foreground-3"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                id={bookingDescriptionId}
                className="mt-1 block text-sm leading-6 text-foreground-3 dark:text-foreground-2"
              >
                {t("locationVisibility.allowOnlineBookingDescription")}
              </span>
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center">
              <Switch
                id={`marketplace-booking-switch-${location.id}`}
                checked={location.allowOnlineBooking}
                onCheckedChange={handleToggleBooking}
                disabled={isUpdating}
                aria-labelledby={bookingLabelId}
                aria-describedby={bookingDescriptionId}
              />
            </span>
          </label>

          <button
            type="button"
            onClick={() => setIsEditingDetails(true)}
            className="group flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:py-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground-1 transition-colors duration-200 group-hover:text-primary">
                {t("locations.workspace.marketplaceDetails")}
              </span>
              <span className="mt-1 block text-sm leading-6 text-foreground-3 dark:text-foreground-2">
                {t("locations.workspace.marketplaceDetailsDescription")}
              </span>
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-foreground-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      <EditLocationMarketplaceDetailsSlider
        isOpen={isEditingDetails}
        onClose={() => setIsEditingDetails(false)}
        location={{ id: location.id, name: location.name }}
      />
    </>
  );
}

export default LocationVisibilitySection;
