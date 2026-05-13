/**
 * Pure helpers for AddAppointmentSlider: payload building, validation, display labels.
 * Kept in a separate file to avoid bloating the component; no React or component state.
 */

import type { TFunction } from "i18next";
import type { AppointmentBookingSource } from '../../../shared/types/calendar';
import { buildZonedDate } from '../timezone';
import type { AddFormPrefill } from '../types';
import { getNoCustomerDisplayLabel } from './utils.tsx';

// ─────────────────────────────────────────────────────────────
// Types (minimal shapes used by helpers; slider can use these or extend)
// ─────────────────────────────────────────────────────────────

export interface CustomerDisplay {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface FormState {
  customerId: number | null;
  customerDisplay: CustomerDisplay | null;
  date: Date | null;
  time: string;
  notes: string;
  bookingSource: AppointmentBookingSource;
}

export interface AppointmentItem {
  /** Set for each segment when editing an existing booking group (PUT targets this id for staff). */
  appointmentId?: number | null;
  serviceId: number | null;
  bundleId: number | null;
  staffUserId: number | null;
  /** Display name when resolved from API (e.g. bookedItemName); fallback when service/bundle lookup fails. */
  itemName?: string;
}

export interface StaffOverride {
  userId: number;
  customPrice: number | null;
  customDuration: number | null;
}

export interface ServiceForDuration {
  serviceId: number;
  customDuration?: number | null;
  defaultDuration?: number;
  customPrice?: number | null;
  defaultPrice?: number;
  /** Per-staff overrides for effective duration/price when staff is selected. */
  staffOverrides?: StaffOverride[];
}

export interface BundleForDuration {
  bundleId: number;
  durationMinutes?: number;
}

// ─────────────────────────────────────────────────────────────
// Date
// ─────────────────────────────────────────────────────────────

export function buildScheduledDate(date: Date | null, time: string, timezone?: string): Date | null {
  if (!date || !time) return null;
  if (timezone) {
    return buildZonedDate(date, time, timezone);
  }
  const [hours, minutes] = time.split(':').map(Number);
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  return localDate;
}

// ─────────────────────────────────────────────────────────────
// Customer display
// ─────────────────────────────────────────────────────────────

export function getCustomerDisplayLabel(display: CustomerDisplay | null, t: TFunction, _forEditMode?: boolean): string {
  if (!display) return getNoCustomerDisplayLabel(t);
  const name = [display.firstName, display.lastName].filter(Boolean).join(' ').trim();
  return name || display.email || t('page.common.customer');
}

export function getCustomerInitials(display: CustomerDisplay | null, fallback: string): string {
  if (!display) return fallback;
  const fromName = [display.firstName?.[0], display.lastName?.[0]].filter(Boolean).join('');
  if (fromName) return fromName;
  if (display.email?.[0]) return display.email[0].toUpperCase();
  return fallback;
}

// ─────────────────────────────────────────────────────────────
// Confirm dialog copy
// ─────────────────────────────────────────────────────────────

export function getConfirmDialogDescription(
  confirmReason: 'out_of_hours' | 'on_block' | null,
  isReschedule: boolean,
  t?: TFunction,
): string {
  if (t) {
    const base =
      confirmReason === 'on_block'
        ? isReschedule
          ? t("page.appointments.confirmDialog.onBlockReschedule")
          : t("page.appointments.confirmDialog.onBlockCreate")
        : isReschedule
          ? t("page.appointments.confirmDialog.outOfHoursReschedule")
          : t("page.appointments.confirmDialog.outOfHoursCreate");
    return base + ' ' + t("page.appointments.confirmDialog.reminderNote");
  }
  const base =
    confirmReason === 'on_block'
      ? isReschedule
        ? 'This time overlaps with blocked time. Are you sure you want to reschedule?'
        : 'This time overlaps with blocked time. Are you sure you want to create this appointment?'
      : isReschedule
        ? 'This time is outside business hours. Are you sure you want to reschedule?'
        : 'This time is outside business hours. Are you sure you want to create this appointment?';
  return base + ' Reminders are not sent to clients between 22:00 and 08:00 (business timezone).';
}

export function getConfirmDialogTitle(isReschedule: boolean, t?: TFunction): string {
  if (t) return isReschedule ? t("page.appointments.confirmDialog.rescheduleAnyway") : t("page.appointments.confirmDialog.createAnyway");
  return isReschedule ? 'Reschedule anyway?' : 'Create appointment anyway?';
}

export function getConfirmButtonTitle(isReschedule: boolean, t?: TFunction): string {
  if (t) return isReschedule ? t("page.appointments.confirmDialog.yesReschedule") : t("page.appointments.confirmDialog.yesCreate");
  return isReschedule ? 'Yes, reschedule' : 'Yes, create';
}

// ─────────────────────────────────────────────────────────────
// Appointment items (service/bundle + staff assignment)
// ─────────────────────────────────────────────────────────────

export function isValidAppointmentItem(item: AppointmentItem, hasTeamMembersAtLocation: boolean): boolean {
  const hasService = item.serviceId != null;
  const hasBundle = item.bundleId != null;
  if (!hasService && !hasBundle) return false;
  if (hasService && hasBundle) return false;
  return item.staffUserId !== null || !hasTeamMembersAtLocation;
}

export function allItemsHaveStaff(items: AppointmentItem[], hasTeamMembersAtLocation: boolean): boolean {
  if (!hasTeamMembersAtLocation) return items.length > 0;
  return items.length > 0 && items.every((item) => item.staffUserId != null);
}

export function getGroupItemsForPayload(
  appointmentItems: AppointmentItem[],
): Array<
  | { serviceId: number; staffUserId?: number }
  | { bundleId: number; staffUserId?: number }
> {
  return appointmentItems.map((item) => {
    if (item.serviceId != null) {
      return {
        serviceId: item.serviceId,
        ...(item.staffUserId != null ? { staffUserId: item.staffUserId } : {}),
      };
    }
    return {
      bundleId: item.bundleId!,
      ...(item.staffUserId != null ? { staffUserId: item.staffUserId } : {}),
    };
  });
}

function getEffectiveServiceDuration(
  service: ServiceForDuration,
  staffUserId: number | null | undefined,
): number {
  const base = service.customDuration ?? service.defaultDuration ?? 0;
  if (staffUserId != null && service.staffOverrides?.length) {
    const override = service.staffOverrides.find((o) => o.userId === staffUserId);
    if (override?.customDuration != null) return override.customDuration;
  }
  return base;
}

function getEffectiveServicePriceMinor(
  service: ServiceForDuration,
  staffUserId: number | null | undefined,
): number {
  const base = service.customPrice ?? service.defaultPrice ?? 0;
  if (staffUserId != null && service.staffOverrides?.length) {
    const override = service.staffOverrides.find((o) => o.userId === staffUserId);
    if (override?.customPrice != null) return override.customPrice;
  }
  return base;
}

export function getGroupTotalDurationMinutes(
  items: Array<{ serviceId?: number; bundleId?: number; staffUserId?: number }>,
  locationServices: ServiceForDuration[],
  locationBundles: BundleForDuration[],
): number {
  return items.reduce((sum, item) => {
    if ('serviceId' in item && item.serviceId) {
      const s = locationServices.find((x) => x.serviceId === item.serviceId);
      return sum + (s ? getEffectiveServiceDuration(s, item.staffUserId) : 0);
    }
    if ('bundleId' in item && item.bundleId) {
      const b = locationBundles.find((x) => x.bundleId === item.bundleId);
      return sum + (b?.durationMinutes ?? 0);
    }
    return sum;
  }, 0);
}

/** Total price in major units (e.g. dollars) for display, respecting staff overrides. */
export function getGroupTotalPriceMajor(
  items: Array<{ serviceId?: number | null; bundleId?: number | null; staffUserId?: number | null }>,
  locationServices: ServiceForDuration[],
  locationBundles: Array<BundleForDuration & { calculatedDisplayPrice?: number }>,
): number {
  return items.reduce((sum, item) => {
    if ('serviceId' in item && item.serviceId) {
      const s = locationServices.find((x) => x.serviceId === item.serviceId);
      if (!s) return sum;
      const minor = getEffectiveServicePriceMinor(s, item.staffUserId);
      return sum + minor / 100;
    }
    if ('bundleId' in item && item.bundleId) {
      const b = locationBundles.find((x) => x.bundleId === item.bundleId);
      return sum + (b?.calculatedDisplayPrice ?? 0);
    }
    return sum;
  }, 0);
}

export function areNumberArraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

// ─────────────────────────────────────────────────────────────
// Edit mode: snapshot + minimal PUT payload
// ─────────────────────────────────────────────────────────────

export type EditFormSnapshot = {
  date: Date | null;
  time: string;
  notes: string;
  serviceId: number | null;
  staffUserId: number | null;
  locationId: number | null;
  /** Per-item staff assignments for group bookings. */
  itemStaffMap: Array<{
    appointmentId: number | null;
    serviceId: number | null;
    bundleId: number | null;
    staffUserId: number | null;
  }>;
};

/** Partial body for PUT /appointments/:id (and pieces stored in pending override confirm). */
export type EditAppointmentPayload = {
  serviceId?: number;
  locationId?: number;
  staffUserIds?: number[];
  scheduledAt?: string;
  notes?: string;
  allowOutOfHours?: boolean;
  overrideConflicts?: boolean;
  overrideReason?: string;
};

export function getPrefillAppointmentItems(prefill: AddFormPrefill | null | undefined): AppointmentItem[] {
  if (!prefill) return [];
  const prefillServiceId = prefill.serviceId ?? null;
  const prefillStaffId = prefill.staffUserId ?? null;
  const prefillBundleId = prefill.bundleId ?? null;
  if (prefill.groupItems != null && prefill.groupItems.length > 1) {
    return prefill.groupItems.map((x) => ({
      appointmentId: x.appointmentId ?? null,
      serviceId: x.serviceId ?? null,
      bundleId: x.bundleId ?? null,
      staffUserId: x.staffUserId ?? null,
      itemName: x.itemName,
    }));
  }
  if (prefillServiceId != null || prefillBundleId != null) {
    return [
      {
        serviceId: prefillServiceId ?? null,
        bundleId: prefillBundleId,
        staffUserId: prefillStaffId ?? null,
      },
    ];
  }
  return [];
}

export function buildEditSnapshotFromPrefill(
  prefill: AddFormPrefill | null | undefined,
  locationId: number | null,
): EditFormSnapshot | null {
  if (prefill?.appointmentId == null) return null;
  const items = getPrefillAppointmentItems(prefill);
  const editRow = items.find((item) => item.serviceId != null);
  return {
    date: prefill.date ?? new Date(),
    time: prefill.time ?? '',
    notes: prefill.notes ?? '',
    serviceId: editRow?.serviceId ?? null,
    staffUserId: editRow?.staffUserId ?? null,
    locationId,
    itemStaffMap: items.map((i) => ({
      appointmentId: i.appointmentId ?? null,
      serviceId: i.serviceId ?? null,
      bundleId: i.bundleId ?? null,
      staffUserId: i.staffUserId ?? null,
    })),
  };
}

/** True when any item's staff assignment differs from the snapshot. */
export function hasItemStaffChanged(
  appointmentItems: AppointmentItem[],
  snapshot: EditFormSnapshot,
): boolean {
  const snapMap = snapshot.itemStaffMap;
  if (appointmentItems.length !== snapMap.length) return true;
  return appointmentItems.some((item, i) => (item.staffUserId ?? null) !== (snapMap[i]?.staffUserId ?? null));
}

/** Multi-segment group edit: each row has a backing appointment id (from GET group / prefill). */
export function usePerItemGroupStaff(appointmentItems: AppointmentItem[]): boolean {
  return (
    appointmentItems.length > 1 &&
    appointmentItems.every((i) => i.appointmentId != null && i.appointmentId !== undefined)
  );
}

export type PerItemStaffUpdate = { appointmentId: number; staffUserIds: number[] };

/**
 * Staff PUT payloads per segment — only items whose staff changed and have a known appointment id.
 */
export function buildPerItemStaffUpdates(
  appointmentItems: AppointmentItem[],
  snapshot: EditFormSnapshot,
  hasTeamMembersAtLocation: boolean,
): PerItemStaffUpdate[] {
  const snapMap = snapshot.itemStaffMap;
  if (appointmentItems.length !== snapMap.length) return [];

  const out: PerItemStaffUpdate[] = [];
  for (let i = 0; i < appointmentItems.length; i++) {
    const item = appointmentItems[i];
    const snap = snapMap[i];
    const appointmentId = item.appointmentId;
    if (appointmentId == null) continue;

    const cur = item.staffUserId ?? null;
    const prev = snap?.staffUserId ?? null;
    if (cur === prev) continue;

    if (hasTeamMembersAtLocation) {
      if (item.staffUserId != null) {
        out.push({ appointmentId, staffUserIds: [item.staffUserId] });
      }
    } else {
      out.push({ appointmentId, staffUserIds: [] });
    }
  }
  return out;
}

/** Notes / service / location for the primary appointment row (excludes staff; group staff uses {@link buildPerItemStaffUpdates}). */
export function pickPrimaryNonSchedulePatch(
  payload: EditAppointmentPayload & Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (payload.notes !== undefined) out.notes = payload.notes;
  if (payload.serviceId !== undefined) out.serviceId = payload.serviceId;
  if (payload.locationId !== undefined) out.locationId = payload.locationId;
  return out;
}

export function buildMinimalEditAppointmentPayload(params: {
  snapshot: EditFormSnapshot;
  form: FormState;
  appointmentItems: AppointmentItem[];
  selectedLocationId: number | null;
  hasTeamMembersAtLocation: boolean;
  scheduledDate: Date;
}): EditAppointmentPayload {
  const { snapshot, form, appointmentItems, selectedLocationId, hasTeamMembersAtLocation, scheduledDate } = params;
  const payload: EditAppointmentPayload = {};
  const editItem = appointmentItems.find((item) => item.serviceId != null);
  if (!editItem?.serviceId) return payload;

  const perItemStaffMode = usePerItemGroupStaff(appointmentItems);

  const notesTrim = form.notes.trim();
  const snapNotesTrim = snapshot.notes.trim();
  if (notesTrim !== snapNotesTrim) {
    payload.notes = notesTrim;
  }
  if (editItem.serviceId !== snapshot.serviceId) {
    payload.serviceId = editItem.serviceId;
  }
  if (selectedLocationId != null && selectedLocationId !== snapshot.locationId) {
    payload.locationId = selectedLocationId;
  }
  if (hasItemStaffChanged(appointmentItems, snapshot)) {
    if (!perItemStaffMode) {
      payload.staffUserIds = hasTeamMembersAtLocation
        ? appointmentItems.filter((i) => i.staffUserId != null).map((i) => i.staffUserId as number)
        : [];
    }
    // Group with per-row ids: staff is applied via updateGroupItemsStaff + buildPerItemStaffUpdates.
  }
  const dateChanged =
    form.date != null &&
    snapshot.date != null &&
    form.date.toDateString() !== snapshot.date.toDateString();
  const timeChanged = form.time !== snapshot.time;
  if (dateChanged || timeChanged) {
    payload.scheduledAt = scheduledDate.toISOString();
  }
  return payload;
}

/** How many successful API mutations the add-form close counter should expect. */
export function getEditMutationDispatchCount(
  bookingGroupId: string | undefined,
  payload: EditAppointmentPayload,
  perItemStaffUpdatesCount: number,
): number {
  if (perItemStaffUpdatesCount > 0) {
    // Saga runs primary patch (optional) + per-appointment staff PUTs + group reschedule (optional) then one success.
    return 1;
  }
  const hasScheduled = payload.scheduledAt != null;
  const hasNonScheduleChanges =
    payload.notes !== undefined ||
    payload.serviceId !== undefined ||
    payload.locationId !== undefined ||
    payload.staffUserIds !== undefined;
  if (bookingGroupId && hasScheduled) {
    return hasNonScheduleChanges ? 2 : 1;
  }
  if (
    payload.scheduledAt !== undefined ||
    payload.notes !== undefined ||
    payload.serviceId !== undefined ||
    payload.locationId !== undefined ||
    payload.staffUserIds !== undefined ||
    payload.allowOutOfHours !== undefined ||
    payload.overrideConflicts !== undefined
  ) {
    return 1;
  }
  return 0;
}

export function pickUpdateAppointmentRequestBody(
  payload: EditAppointmentPayload & Record<string, unknown>,
): Record<string, unknown> {
  const keys = [
    'serviceId',
    'locationId',
    'staffUserIds',
    'scheduledAt',
    'notes',
    'allowOutOfHours',
    'overrideConflicts',
    'overrideReason',
  ] as const;
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (payload[key] !== undefined) out[key] = payload[key];
  }
  return out;
}
