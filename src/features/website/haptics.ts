import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { getNativePlatform } from "../../app/config/env";

// Fire-and-forget Web Studio haptics (mirrors calendar/haptics.ts). Web builds early-return;
// a failed haptic must never break the interaction.
const isNative = (): boolean => getNativePlatform() !== "web";

/** Light tap when the full preview opens — acknowledges the tap while the curtain runs. */
export function previewOpenHaptic(): void {
  if (!isNative()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Subtle tick for segmented choices — device toggle, variant picks. */
export function selectionTickHaptic(): void {
  if (!isNative()) return;
  Haptics.selectionChanged().catch(() => {});
}
