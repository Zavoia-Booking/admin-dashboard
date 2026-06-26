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
  setUpdateConflictOffer,
  setCalendarPendingDrop,
} from "../../actions.ts";
import { getUpdateConflictOffer, getPendingDrop } from "../../selectors.ts";
import type { AppointmentDragData } from "../CalendarDnD.tsx";
import { CONFIRM_MODAL_DELAY_MS, type PendingReschedulePayload } from "./constants.ts";
import { dragStartHaptic, slotChangeHaptic } from "../../haptics.ts";

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

  const lastOverIdRef = useRef<string | null>(null);
  const pendingOverIdRef = useRef<string | null>(null);
  const overIdRafRef = useRef<number | null>(null);

  const cancelOverIdRaf = useCallback(() => {
    if (overIdRafRef.current != null) {
      cancelAnimationFrame(overIdRafRef.current);
      overIdRafRef.current = null;
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const raw = event.active.data?.current as AppointmentDragData | undefined;
    if (raw?.type === "appointment") {
      dndSessionRef.current = { nowMs: Date.now(), dragData: raw };
      // Light impact at the moment the drag activates (after the 250ms
      // TouchSensor delay / 8px MouseSensor distance). Silent on web.
      dragStartHaptic();
    } else {
      dndSessionRef.current = null;
    }
    setActiveId(String(event.active.id));
    cancelOverIdRaf();
    lastOverIdRef.current = null;
    pendingOverIdRef.current = null;
    setOverId(null);
  }, [cancelOverIdRaf]);

  // RAF-gated `setOverId` — pointermove fires up to ~60-120×/sec on touch;
  // we only need one React render per frame to keep slot highlights + group
  // preview in sync. Collapsing multiple pointer events into one RAF tick cuts
  // drag-time re-renders roughly in half on cheap Android WebView.
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const next = event.over?.id != null ? String(event.over.id) : null;
    pendingOverIdRef.current = next;
    if (overIdRafRef.current != null) return;
    overIdRafRef.current = requestAnimationFrame(() => {
      overIdRafRef.current = null;
      const pending = pendingOverIdRef.current;
      if (pending !== lastOverIdRef.current) {
        lastOverIdRef.current = pending;
        setOverId(pending);
        // Apple-style scrubber tick: one subtle haptic per slot crossing.
        // Skip on the initial null → slot transition (pending is null on
        // entry when the finger hasn't yet reached a droppable) since that's
        // already covered by the dragStart haptic.
        if (pending !== null) slotChangeHaptic();
      }
    });
  }, []);

  // Tear down any scheduled RAF on unmount so stale state isn't pushed after
  // the component is gone.
  useEffect(() => {
    return () => cancelOverIdRaf();
  }, [cancelOverIdRaf]);

  const handleConfirmOverride = useCallback(() => {
    if (!pendingReschedulePayload) return;
    const reason = overrideReasonText.trim() || undefined;
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
    dispatch(
      updateAppointment.request({
        appointmentId: updateConflictOffer.appointmentId,
        data: dataWithOverride,
      }),
    );
    dispatch(setCalendarPendingDrop(null));
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [updateConflictOffer, overrideReasonText, dispatch]);

  const handleCancelConflictOverride = useCallback(() => {
    dispatch(setCalendarPendingDrop(null));
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [dispatch]);

  // Wrapped setOverId — cancels any RAF-gated pending update so callers
  // (e.g. grid handleDragEnd setting overId to null) aren't overridden by a
  // stale RAF tick scheduled mid-drag.
  const safeSetOverId = useCallback(
    (next: string | null) => {
      cancelOverIdRaf();
      pendingOverIdRef.current = next;
      lastOverIdRef.current = next;
      setOverId(next);
    },
    [cancelOverIdRaf],
  );

  return {
    // Redux state
    dispatch,
    pendingDrop,
    updateConflictOffer,
    // Local state
    activeId,
    setActiveId,
    overId,
    setOverId: safeSetOverId,
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
