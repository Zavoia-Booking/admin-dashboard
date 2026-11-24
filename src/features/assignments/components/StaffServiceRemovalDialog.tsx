import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../../../shared/components/ui/drawer";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import { getErrorMessage } from "../../../shared/utils/error";
import type { AppointmentActionItem, OffboardPreviewResponse } from "../../teamMembers/api";
import { AppointmentsPane, type StaffById } from "../../teamMembers/components/seat-reconciliation/AppointmentsPane";
import { useDecisions } from "../../teamMembers/components/seat-reconciliation/useDecisions";
import {
  getStaffServiceRemovalPreviewRequest,
  removeStaffServiceRequest,
  type StaffServiceRemovalScope,
} from "../api";

export interface StaffServiceRemovalTarget extends StaffServiceRemovalScope {
  memberName: string;
  locationName: string;
  serviceName: string;
}

interface StaffServiceRemovalDialogProps {
  target: StaffServiceRemovalTarget;
  staffById: StaffById;
  onClose: () => void;
  onRemoved: () => void;
  onOpenCalendar: (scheduledAt: string) => void;
}

export function StaffServiceRemovalDialog({
  target,
  staffById,
  onClose,
  onRemoved,
  onOpenCalendar,
}: StaffServiceRemovalDialogProps) {
  const { t } = useTranslation(["assignments", "common"]);
  const isMobile = useIsMobile();
  const { locationId, userId, serviceId, memberName, locationName, serviceName } = target;
  const { decisions, decide, decideMany, reset } = useDecisions();
  const [preview, setPreview] = useState<OffboardPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<unknown>(null);
  const [removeError, setRemoveError] = useState<unknown>(null);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);
  const isRemovingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    getStaffServiceRemovalPreviewRequest({ locationId, userId, serviceId }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setPreview(data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setPreviewError(error);
      });
    return () => controller.abort();
  }, [locationId, userId, serviceId, previewAttempt]);

  const refreshPreview = () => {
    reset();
    setPreview(null);
    setPreviewError(null);
    setRemoveError(null);
    setPreviewAttempt((attempt) => attempt + 1);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isRemovingRef.current) onClose();
  };

  const handleRemove = async () => {
    if (isRemovingRef.current || !preview || removeError) return;

    const appointmentActions = preview.appointments.flatMap<AppointmentActionItem>(({ id }) => {
      const decision = decisions.get(id);
      if (!decision) return [];
      return decision.kind === "cancel"
        ? [{ appointmentId: id, cancel: true }]
        : [{ appointmentId: id, newStaffUserId: decision.toUserId }];
    });
    if (appointmentActions.length !== preview.appointments.length) return;

    isRemovingRef.current = true;
    setIsRemoving(true);
    try {
      await removeStaffServiceRequest({ locationId, userId, serviceId }, appointmentActions);
    } catch (error) {
      setRemoveError(error);
      return;
    } finally {
      isRemovingRef.current = false;
      setIsRemoving(false);
    }
    onRemoved();
  };

  const loadingPreview = !preview && !previewError;
  const allDecided = !!preview && preview.appointments.every(({ id }) => decisions.has(id));
  const failure = removeError || previewError;
  const title = t("page.staffServiceRemoval.title", { service: serviceName });
  const description = t("page.staffServiceRemoval.description", { name: memberName, location: locationName });

  const body = (
    <>
      {!!failure && (
        <div className="mx-5 mt-3 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-error-border bg-error-bg p-3">
          <p role="alert" className="min-w-0 flex-1 text-pretty text-sm text-error">
            {getErrorMessage(failure, t(removeError ? "page.staffServiceRemoval.removeError" : "page.staffServiceRemoval.previewError"))}
          </p>
          <Button type="button" variant="outline" size="sm" rounded="full" onClick={refreshPreview}>
            {t("page.staffServiceRemoval.refresh")}
          </Button>
        </div>
      )}
      {loadingPreview || preview ? (
        <AppointmentsPane
          appointments={preview?.appointments ?? []}
          selectedUserId={userId}
          eligibleStaffMap={preview?.eligibleStaffMap ?? {}}
          orphanedAppointmentIds={[]}
          staffById={staffById}
          decisions={decisions}
          loading={loadingPreview}
          bundleContextOnly
          emptyMessage={t("page.staffServiceRemoval.noAffectedAppointments")}
          onDecide={(id, decision) => {
            if (!isRemovingRef.current) decide(id, decision);
          }}
          onDecideMany={(ids, decision) => {
            if (!isRemovingRef.current) decideMany(ids, decision);
          }}
          onOpenCalendar={(scheduledAt) => {
            if (!isRemovingRef.current) onOpenCalendar(scheduledAt);
          }}
        />
      ) : <div className="flex-1" />}
      <div
        className="flex shrink-0 justify-end gap-2 border-t border-border px-5 pb-3 pt-3"
        style={isMobile ? { paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" } : undefined}
      >
        <Button type="button" variant="outline" rounded="full" disabled={isRemoving} onClick={() => handleOpenChange(false)}>
          {t("common:aria.close")}
        </Button>
        <Button type="button" rounded="full" disabled={!allDecided || !!failure || isRemoving} onClick={handleRemove}>
          {t(isRemoving ? "page.staffServiceRemoval.removing" : "page.staffServiceRemoval.confirm")}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={handleOpenChange} dismissible={!isRemoving}>
        <DrawerContent className="z-220 h-[85dvh] overflow-hidden" overlayClassName="z-220" aria-busy={isRemoving}>
          <div className="shrink-0 px-5 pb-3 pt-3">
            <DrawerTitle className="text-balance text-foreground-1">{title}</DrawerTitle>
            <DrawerDescription className="mt-1 text-pretty text-foreground-3">{description}</DrawerDescription>
          </div>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="z-210 flex h-[min(44rem,calc(100dvh_-_2rem))] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl"
        overlayClassName="z-210"
        aria-busy={isRemoving}
        onEscapeKeyDown={(event) => {
          if (isRemovingRef.current) event.preventDefault();
        }}
      >
        <div className="shrink-0 px-5 pb-3 pr-12 pt-4">
          <DialogTitle className="text-balance text-foreground-1">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-pretty text-foreground-3">{description}</DialogDescription>
        </div>
        {body}
      </DialogContent>
    </Dialog>
  );
}
