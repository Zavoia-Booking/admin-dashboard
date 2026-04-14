import type { DaySummary } from "../../../shared/types/calendar";

/** Appointment density under the day number (matches reference: dot / double / bar). */
export type DayMarker = "none" | "dot" | "double" | "triple" | "bar";

/** Appointments use primary; block-only days use warning (amber) — gray reads as "disabled" on date cells; grid blocks use large gray panels, not 4px dots. */
export type MarkerTone = "primary" | "blocked";

export function dayMarkerFromSummary(
  ds: DaySummary | undefined,
): { kind: DayMarker; tone: MarkerTone } {
  if (!ds) return { kind: "none", tone: "primary" };
  const c = ds.appointmentCount;
  const b = ds.blockedSlots ?? 0;
  if (c === 0 && b === 0) return { kind: "none", tone: "primary" };
  const blockOnly = c === 0 && b > 0;
  const tone: MarkerTone = blockOnly ? "blocked" : "primary";
  if (c > 3) return { kind: "bar", tone };
  if (c === 3) return { kind: "triple", tone };
  if (c === 2) return { kind: "double", tone };
  if (c === 1) return { kind: "dot", tone };
  // Blocks only (no appointments): same density scale as appointments (was capped at double for any b≥2).
  if (b > 3) return { kind: "bar", tone };
  if (b === 3) return { kind: "triple", tone };
  if (b === 2) return { kind: "double", tone };
  return { kind: "dot", tone };
}
