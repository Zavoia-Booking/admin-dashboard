import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { AppointmentConflictPreview } from "../../calendar/components/AppointmentConflictPreview";
import type { LocationHoursConflictOffer } from "../types";

interface LocationHoursConflictDialogProps {
  offer: LocationHoursConflictOffer | null;
  locationId: number | null;
  fallbackTimezone: string;
  onCancel: () => void;
  onSaveAnyway: () => void;
}

/** Shown when new opening hours would leave upcoming appointments outside them. */
export const LocationHoursConflictDialog: FC<LocationHoursConflictDialogProps> = ({
  offer,
  locationId,
  fallbackTimezone,
  onCancel,
  onSaveAnyway,
}) => {
  const { t } = useTranslation("locations");

  // Keep the last offer so the content does not empty out while the dialog closes.
  const [shown, setShown] = useState<LocationHoursConflictOffer | null>(offer);
  if (offer && offer !== shown) setShown(offer);

  if (!shown) return null;

  return (
    <ConfirmDialog
      open={offer !== null}
      onConfirm={onSaveAnyway}
      onCancel={onCancel}
      mobileDrawer
      eyebrow={t("editLocation.form.workingHoursLabel")}
      title={t("editLocation.hoursConflict.title", { count: shown.total })}
      cancelTitle={t("editLocation.buttons.cancel")}
      confirmTitle={t("editLocation.hoursConflict.saveAnyway")}
      description={
        <>
          <p>{t("editLocation.hoursConflict.description", { count: shown.total })}</p>
          <AppointmentConflictPreview
            appointment={shown.firstAppointment}
            total={shown.total}
            fallbackTimezone={fallbackTimezone}
            currentLocationId={locationId}
          />
        </>
      }
    />
  );
};
