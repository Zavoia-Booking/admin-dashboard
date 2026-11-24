import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  beginAddFormCloseAfterMutations,
  setCalendarPendingDrop,
  setUpdateConflictOffer,
  updateAppointment,
} from "../actions";
import { getUpdateConflictOffer } from "../selectors";
import type { AppointmentBlockOverrideOffer } from "../types";
import { OverrideDialog } from "./timeGrid/OverrideDialog";

export function AppointmentBlockOverrideDialog() {
  const offer = useSelector(getUpdateConflictOffer);
  return offer ? <AppointmentOverridePrompt key={`${offer.appointmentId}:${offer.kind ?? "block"}`} offer={offer} /> : null;
}

function AppointmentOverridePrompt({ offer }: { offer: AppointmentBlockOverrideOffer }) {
  const dispatch = useDispatch();
  const isBlock = offer.kind !== "working-hours";
  const [reason, setReason] = useState(
    typeof offer.data.overrideReason === "string" ? offer.data.overrideReason : "",
  );

  const close = () => {
    dispatch(setUpdateConflictOffer(null));
    dispatch(setCalendarPendingDrop(null));
  };

  const confirm = () => {
    if (offer.source === "editor") {
      dispatch(beginAddFormCloseAfterMutations(1));
    }
    dispatch(updateAppointment.request({
      appointmentId: offer.appointmentId,
      source: offer.source,
      data: {
        ...offer.data,
        ...(isBlock ? { overrideConflicts: true } : { allowOutOfHours: true }),
        overrideReason: reason.trim() || offer.data.overrideReason,
      },
    }));
    close();
  };

  return (
    <OverrideDialog
      open
      onOpenChange={(open) => { if (!open) close(); }}
      isConflictOverride={isBlock}
      onConfirm={confirm}
      onCancel={close}
      reasonText={reason}
      onReasonChange={setReason}
      inputId="appointment-block-override-reason"
    />
  );
}
