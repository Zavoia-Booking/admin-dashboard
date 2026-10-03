export type LocationSettingsAttentionTarget = "visibility" | "booking";

interface LocationSettingsAttentionRequest {
  locationId: number;
  target: LocationSettingsAttentionTarget;
}

export const LOCATION_SETTINGS_ATTENTION_EVENT =
  "zavoia:location-settings-attention";

let pendingRequest: LocationSettingsAttentionRequest | null = null;
let eventTimer: number | null = null;

/** Delivers attention to an existing workspace or one mounted by navigation. */
export function requestLocationSettingsAttention(
  locationId: number,
  target: LocationSettingsAttentionTarget,
): void {
  const request = { locationId, target };
  pendingRequest = request;
  if (eventTimer !== null) window.clearTimeout(eventTimer);
  eventTimer = null;
  const dispatchAttention = () => {
    if (pendingRequest !== request) return;
    window.dispatchEvent(
      new CustomEvent<LocationSettingsAttentionRequest>(
        LOCATION_SETTINGS_ATTENTION_EVENT,
        { detail: request },
      ),
    );
  };
  // A local action should respond immediately. Keep a delayed delivery for a
  // workspace being revealed, plus the pending request for a later mount.
  dispatchAttention();
  if (pendingRequest === request) {
    eventTimer = window.setTimeout(() => {
      eventTimer = null;
      dispatchAttention();
    }, 350);
  }
}

/** Returns the pending target once, and only to the requested location. */
export function consumeLocationSettingsAttention(
  locationId: number,
): LocationSettingsAttentionTarget | null {
  if (pendingRequest?.locationId !== locationId) return null;
  const target = pendingRequest.target;
  pendingRequest = null;
  if (eventTimer !== null) window.clearTimeout(eventTimer);
  eventTimer = null;
  return target;
}
