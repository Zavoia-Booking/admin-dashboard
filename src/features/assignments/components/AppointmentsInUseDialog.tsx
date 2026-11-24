import { type FC, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { AppointmentConflictPreview } from "../../calendar/components/AppointmentConflictPreview";
import { buildCalendarLink } from "../../calendar/calendarLinks";
import { getCurrentBusinessSelector } from "../../business/selectors";
import type { AppointmentsInUseOffer } from "../types";

const TITLE_KEY = {
  service_off: "serviceOff",
  bundle_off: "bundleOff",
  staff_service_removed: "staffServiceRemoved",
  staff_removed: "staffRemoved",
} as const;

interface AppointmentsInUseDialogProps {
  offer: AppointmentsInUseOffer | null;
  /** Members of the offer's location, to open the calendar on their column. */
  teamMembers: Array<{ userId: number; email: string }>;
  onClose: () => void;
}

/** Shown when a removal is refused because upcoming appointments still use it. */
export const AppointmentsInUseDialog: FC<AppointmentsInUseDialogProps> = ({
  offer,
  teamMembers,
  onClose,
}) => {
  const { t } = useTranslation("assignments");
  const navigate = useNavigate();
  const businessTimezone = useSelector(getCurrentBusinessSelector)?.timezone;

  // Keep the last offer so the content does not empty out while the dialog closes.
  const [shown, setShown] = useState<AppointmentsInUseOffer | null>(offer);
  if (offer && offer !== shown) setShown(offer);

  if (!shown) return null;

  const handleGoToCalendar = () => {
    const staffReason = shown.reason === "staff_service_removed" || shown.reason === "staff_removed";
    const staffEmail = staffReason
      ? teamMembers.find((m) => m.userId === shown.userId)?.email
      : undefined;
    onClose();
    navigate(
      buildCalendarLink({
        date: shown.firstAppointment?.scheduledAt,
        locationId: shown.locationId,
        serviceId: shown.reason === "bundle_off" ? undefined : shown.serviceId,
        bundleId: shown.reason === "bundle_off" ? shown.bundleId : undefined,
        staffEmail,
      }),
    );
  };

  const prefix = `page.appointmentsInUse`;
  return (
    <ConfirmDialog
      open={offer !== null}
      onConfirm={handleGoToCalendar}
      onCancel={onClose}
      mobileDrawer
      title={t(`${prefix}.${TITLE_KEY[shown.reason]}`, { count: shown.total })}
      cancelTitle={t(`${prefix}.close`)}
      confirmTitle={t(`${prefix}.goToCalendar`)}
      description={
        <>
          <p>{t(`${prefix}.description`, { count: shown.total })}</p>
          <AppointmentConflictPreview
            appointment={shown.firstAppointment}
            total={shown.total}
            fallbackTimezone={businessTimezone || shown.firstAppointment?.timezone || "UTC"}
            currentLocationId={null}
          />
        </>
      }
    />
  );
};
