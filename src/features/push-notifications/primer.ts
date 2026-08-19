import { isNativeApp } from "../../app/config/env";
import { getPushPermissionState } from "./service";

/**
 * Ask policy for the push-permission primer (the in-app soft ask shown before
 * the OS prompt). The OS budget is scarce — Android grants two lifetime
 * prompts, iOS one — so the native dialog only ever fires after the user
 * accepts the primer. The primer itself is throttled here: only at value
 * moments, at most once per MIN_GAP_DAYS, and never again after MAX_DECLINES.
 * Device-scoped storage on purpose: the OS permission is per-device.
 */

export type PushPrimerTrigger =
  | "wizard-complete"
  | "appointment-created"
  | "team-invited"
  | "notifications-page";

const STORAGE_KEY = "zavoia.pushPrimer.v1";
const MIN_GAP_DAYS = 30;
const MAX_DECLINES = 3;

interface PrimerRecord {
  declines: number;
  lastShownAt?: string;
}

function readRecord(): PrimerRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { declines: 0 };
    const parsed = JSON.parse(raw) as PrimerRecord;
    return { declines: parsed.declines ?? 0, lastShownAt: parsed.lastShownAt };
  } catch {
    return { declines: 0 };
  }
}

function writeRecord(record: PrimerRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable: the primer just becomes more eager; harmless.
  }
}

type PrimerListener = (open: boolean) => void;
let listener: PrimerListener | null = null;

export function subscribePushPrimer(fn: PrimerListener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

let scheduling = false;

/**
 * Ask to show the primer at a value moment. Resolves the policy + current OS
 * permission state and, when eligible, opens the sheet after `delayMs` so the
 * triggering flow's toast/slider-close settles first. Fire-and-forget.
 */
export async function maybeShowPushPrimer(
  trigger: PushPrimerTrigger,
  delayMs = 1400,
): Promise<void> {
  if (!isNativeApp() || scheduling) return;

  const record = readRecord();
  if (record.declines >= MAX_DECLINES) return;
  if (
    record.lastShownAt &&
    Date.now() - Date.parse(record.lastShownAt) < MIN_GAP_DAYS * 86_400_000
  ) {
    return;
  }

  const state = await getPushPermissionState().catch(() => "denied" as const);
  // "prompt-with-rationale" = denied once, one OS shot left; the primer IS the
  // rationale UI, so both pre-denial states are eligible.
  if (state !== "prompt" && state !== "prompt-with-rationale") return;

  scheduling = true;
  window.setTimeout(() => {
    scheduling = false;
    if (!listener) return;
    writeRecord({ ...record, lastShownAt: new Date().toISOString() });
    console.info("[push] primer shown, trigger:", trigger);
    listener(true);
  }, delayMs);
}

export function recordPrimerDecline(): void {
  const record = readRecord();
  writeRecord({ ...record, declines: record.declines + 1 });
}
