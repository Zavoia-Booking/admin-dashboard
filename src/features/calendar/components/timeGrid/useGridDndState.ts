import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  updateAppointment,
  rescheduleAppointmentGroup,
  setUpdateConflictOffer,
  setCalendarPendingDrop,
} from "../../actions.ts";
import { getUpdateConflictOffer, getPendingDrop } from "../../selectors.ts";
import type { AppointmentDragData } from "../CalendarDnD.tsx";
import { CONFIRM_MODAL_DELAY_MS, type PendingReschedulePayload } from "./constants.ts";

/**
 * Shared DnD state and handlers used by both DayGrid and WeekGrid.
 *
 * Each grid still owns `handleDragEnd` and `handleConfirmDrop` (genuinely different logic).
 * This hook provides the common state, sensors, and identical handlers.
 */
export function useGridDndState() {
  const dispatch = useDispatch();
  const pendingDrop = useSelector(getPendingDrop);
  const updateConflictOffer = useSelector(getUpdateConflictOffer);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropConfirmInProgress, setDropConfirmInProgress] = useState(false);
  const [confirmModalDelayedOpen, setConfirmModalDelayedOpen] = useState(false);
  const [overrideReasonText, setOverrideReasonText] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [pendingReschedulePayload, setPendingReschedulePayload] = useState<PendingReschedulePayload | null>(null);

  /** Ref for drag-start session data. Each grid sets this in their handleDragStart. */
  const dndSessionRef = useRef<{ nowMs: number; dragData: AppointmentDragData } | null>(null);

  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  // Clear "confirm clicked" when drop is cleared or a new pending drop is set
  useEffect(() => {
    setDropConfirmInProgress(false);
  }, [pendingDrop]);

  // Staff double-book conflict: do not allow override; clear pending drop and offer so card snaps back
  useEffect(() => {
    if (updateConflictOffer?.conflictType === 'staff_appointment') {
      dispatch(setCalendarPendingDrop(null));
      dispatch(setUpdateConflictOffer(null));
    }
  }, [updateConflictOffer?.conflictType, dispatch, updateConflictOffer]);

  // Short delay before showing confirm modal so the card can finish animating
  useEffect(() => {
    if (!pendingDrop || dropConfirmInProgress) {
      setConfirmModalDelayedOpen(false);
      return;
    }
    const t = setTimeout(() => setConfirmModalDelayedOpen(true), CONFIRM_MODAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [pendingDrop, dropConfirmInProgress]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const raw = event.active.data?.current as AppointmentDragData | undefined;
    if (raw?.type === "appointment") {
      dndSessionRef.current = { nowMs: Date.now(), dragData: raw };
    } else {
      dndSessionRef.current = null;
    }
    setActiveId(String(event.active.id));
    setOverId(null);
  }, []);

  const lastOverIdRef = useRef<string | null>(null);
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const next = event.over?.id != null ? String(event.over.id) : null;
    if (next !== lastOverIdRef.current) {
      lastOverIdRef.current = next;
      setOverId(next);
    }
  }, []);

  const handleConfirmOverride = useCallback(() => {
    if (!pendingReschedulePayload) return;
    const reason = overrideReasonText.trim() || undefined;
    const overrideGroupPayload = {
      scheduledAt: pendingReschedulePayload.newScheduledAt.toISOString(),
      allowOutOfHours: true as const,
      overrideConflicts: true as const,
      overrideReason: reason,
    };
    if (pendingReschedulePayload.bookingGroupId) {
      const sid = pendingReschedulePayload.staffUserIds;
      if (sid != null && sid.length > 0) {
        dispatch(
          updateAppointment.request({
            appointmentId: pendingReschedulePayload.appointmentId,
            data: { staffUserIds: sid },
            bookingGroupId: pendingReschedulePayload.bookingGroupId,
            chainReschedule: {
              bookingGroupId: pendingReschedulePayload.bookingGroupId,
              payload: overrideGroupPayload,
            },
          }),
        );
      } else {
        dispatch(
          rescheduleAppointmentGroup.request({
            bookingGroupId: pendingReschedulePayload.bookingGroupId,
            payload: overrideGroupPayload,
          }),
        );
      }
    } else {
      const data: Record<string, unknown> = {
        scheduledAt: pendingReschedulePayload.newScheduledAt.toISOString(),
        allowOutOfHours: true,
        overrideConflicts: true,
        overrideReason: reason,
      };
      if (pendingReschedulePayload.staffUserIds !== undefined) {
        data.staffUserIds = pendingReschedulePayload.staffUserIds;
      }
      dispatch(
        updateAppointment.request({
          appointmentId: pendingReschedulePayload.appointmentId,
          data,
        }),
      );
    }
    dispatch(setCalendarPendingDrop(null));
    setPendingReschedulePayload(null);
    setOverrideDialogOpen(false);
    setOverrideReasonText("");
  }, [pendingReschedulePayload, overrideReasonText, dispatch]);

  const handleCancelDrop = useCallback(() => {
    dispatch(setCalendarPendingDrop(null));
    setPendingReschedulePayload(null);
    setOverrideDialogOpen(false);
    setOverrideReasonText("");
  }, [dispatch]);

  const handleConfirmConflictOverride = useCallback(() => {
    if (!updateConflictOffer) return;
    const reason = overrideReasonText.trim() || undefined;
    const dataWithOverride = {
      ...updateConflictOffer.data,
      overrideConflicts: true,
      overrideReason: reason,
    };
    if (updateConflictOffer.bookingGroupId && updateConflictOffer.data?.scheduledAt) {
      dispatch(
        rescheduleAppointmentGroup.request({
          bookingGroupId: updateConflictOffer.bookingGroupId,
          payload: {
            scheduledAt: String(updateConflictOffer.data.scheduledAt),
            overrideConflicts: true,
            allowOutOfHours: !!updateConflictOffer.data.allowOutOfHours,
            overrideReason: reason,
          },
        }),
      );
    } else {
      dispatch(
        updateAppointment.request({
          appointmentId: updateConflictOffer.appointmentId,
          data: dataWithOverride,
        }),
      );
    }
    dispatch(setCalendarPendingDrop(null));
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [updateConflictOffer, overrideReasonText, dispatch]);

  const handleCancelConflictOverride = useCallback(() => {
    dispatch(setCalendarPendingDrop(null));
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [dispatch]);

  return {
    // Redux state
    dispatch,
    pendingDrop,
    updateConflictOffer,
    // Local state
    activeId,
    setActiveId,
    overId,
    setOverId,
    dropConfirmInProgress,
    setDropConfirmInProgress,
    confirmModalDelayedOpen,
    overrideReasonText,
    setOverrideReasonText,
    overrideDialogOpen,
    setOverrideDialogOpen,
    pendingReschedulePayload,
    setPendingReschedulePayload,
    // Refs
    dndSessionRef,
    // DnD
    dndSensors,
    handleDragStart,
    handleDragOver,
    // Handlers
    handleConfirmOverride,
    handleCancelDrop,
    handleConfirmConflictOverride,
    handleCancelConflictOverride,
  };
}
