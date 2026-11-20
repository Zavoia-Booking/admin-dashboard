import { type FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog.tsx";
import type { BlockConflictOffer } from "../../../shared/types/calendar.ts";
import { createCalendarBlock, setBlockConflictOffer, updateCalendarBlock } from "../actions.ts";
import { getBlockConflictOffer, getCalendarTimezone, getSelectedLocationId } from "../selectors.ts";
import { AppointmentConflictPreview } from "./AppointmentConflictPreview.tsx";

/**
 * Shown when a block create/update is refused because upcoming appointments fall inside it.
 * "Block anyway" resends the same request with overrideConflicts; the appointments are not changed.
 */
export const BlockConflictDialog: FC = () => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const offer = useSelector(getBlockConflictOffer);
  const selectedLocationId = useSelector(getSelectedLocationId);
  const calendarTimezone = useSelector(getCalendarTimezone);

  // Keep the last offer so the content does not empty out while the dialog closes.
  const [shown, setShown] = useState<BlockConflictOffer | null>(offer);
  if (offer && offer !== shown) setShown(offer);

  const handleCancel = useCallback(() => {
    dispatch(setBlockConflictOffer(null));
  }, [dispatch]);

  const handleBlockAnyway = useCallback(() => {
    if (!offer) return;
    dispatch(setBlockConflictOffer(null));
    if (offer.mode === "create") {
      dispatch(createCalendarBlock.request({ ...offer.payload, overrideConflicts: true }));
    } else {
      dispatch(updateCalendarBlock.request({ id: offer.id, payload: { ...offer.payload, overrideConflicts: true } }));
    }
  }, [dispatch, offer]);

  if (!shown) return null;

  return (
    <ConfirmDialog
      open={offer !== null}
      onConfirm={handleBlockAnyway}
      onCancel={handleCancel}
      eyebrow={t(shown.mode === "create" ? "page.blocks.create.blockTime" : "page.blocks.create.editBlock")}
      title={t("page.blocks.conflict.title", { count: shown.total })}
      cancelTitle={t("page.blocks.cancelBtn")}
      confirmTitle={t("page.blocks.conflict.blockAnyway")}
      mobileDrawer
      description={
        <>
          <p>{t("page.blocks.conflict.description", { count: shown.total })}</p>
          <AppointmentConflictPreview
            appointment={shown.firstAppointment}
            total={shown.total}
            fallbackTimezone={calendarTimezone}
            currentLocationId={selectedLocationId}
          />
        </>
      }
    />
  );
};
