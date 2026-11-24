import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import {
  adminCreateAppointmentGroup,
  beginAddFormCloseAfterMutations,
  setCustomerOverlapOffer,
  updateAppointment,
} from "../actions";
import { getCustomerOverlapOffer } from "../selectors";

export function CustomerOverlapDialog() {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const offer = useSelector(getCustomerOverlapOffer);
  if (!offer) return null;

  const close = () => dispatch(setCustomerOverlapOffer(null));
  const confirm = () => {
    close();
    if (offer.kind === "create") {
      dispatch(beginAddFormCloseAfterMutations(1));
      dispatch(adminCreateAppointmentGroup.request({ ...offer.payload, allowCustomerOverlap: true }));
    } else {
      if (offer.source === "editor") {
        dispatch(beginAddFormCloseAfterMutations(1));
      }
      dispatch(updateAppointment.request({
        appointmentId: offer.appointmentId,
        source: offer.source,
        data: { ...offer.data, allowCustomerOverlap: true },
      }));
    }
  };

  return (
    <ConfirmDialog
      open
      onConfirm={confirm}
      onCancel={close}
      title={t("page.appointments.customerOverlap.title")}
      description={t("page.appointments.customerOverlap.description")}
      confirmTitle={t(offer.kind === "create"
        ? "page.appointments.customerOverlap.continueBooking"
        : "page.appointments.customerOverlap.continueEdit")}
      cancelTitle={t("page.blocks.cancelBtn")}
      mobileDrawer
    />
  );
}
