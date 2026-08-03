import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "../../../../shared/components/ui/switch";
import type { LocationWithAssignments } from "../../types";
import { updateLocationMarketplaceFlagsAction } from "../../actions";
import { requestPortfolioAttention } from "../../utils/portfolioAttention";
import { selectUpdatingLocationFlags } from "../../selectors";
import { EditLocationMarketplaceDetailsSlider } from "../EditLocationMarketplaceDetailsSlider";

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
            htmlFor={`marketplace-public-switch-${location.id}`}
            className="flex cursor-pointer items-center justify-between gap-4 py-4 md:py-5"
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
            htmlFor={`marketplace-booking-switch-${location.id}`}
            className="flex cursor-pointer items-center justify-between gap-4 py-4 md:py-5"
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
