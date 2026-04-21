import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { getNativePlatform } from "../../app/config/env";

// Fire-and-forget haptics for calendar DnD. Web builds early-return; devices
// without Taptic Engine / Vibrator no-op inside the plugin. Never throws —
// a failed haptic must not break the interaction.
const isNative = (): boolean => getNativePlatform() !== "web";

/** Light tap at drag activation — "you picked it up". */
export function dragStartHaptic(): void {
  if (!isNative()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Subtle tick when the drag crosses into a new slot — Apple scrubber feel. */
export function slotChangeHaptic(): void {
  if (!isNative()) return;
  Haptics.selectionChanged().catch(() => {});
}

/** Success pulse after a confirmed drop. */
export function dropSuccessHaptic(): void {
  if (!isNative()) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

/** Warning pulse when a drop is rejected (cross-column, forbidden slot, etc.). */
export function dropRejectHaptic(): void {
  if (!isNative()) return;
  Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
}
