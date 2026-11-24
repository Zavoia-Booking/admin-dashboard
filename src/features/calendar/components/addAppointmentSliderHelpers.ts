/**
 * Pure helpers for AddAppointmentSlider: payload building, validation, display labels.
 * Kept in a separate file to avoid bloating the component; no React or component state.
 */

import type { TFunction } from "i18next";
import type { AppointmentBookingSource, BookedItemEdit, LocationContextBundle } from '../../../shared/types/calendar';
import { buildZonedDateFromDateKey } from '../timezone';
import { toLocalDateString } from '../utils';
import type { AddFormPrefill } from '../types';
import type { BookedItem } from '../bookedItems';
import { getNoCustomerDisplayLabel } from './utils.tsx';

// ─────────────────────────────────────────────────────────────
// Types (minimal shapes used by helpers; slider can use these or extend)
// ─────────────────────────────────────────────────────────────

export interface CustomerDisplay {
  /** Stable customer id. Optional — falls back to email-based avatar hashing when missing. */
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface FormState {
  customerId: number | null;
  customerDisplay: CustomerDisplay | null;
  date: Date | null; // Location wall day stored as a date-picker value, not an instant.
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

export function buildScheduledDate(date: Date | null, time: string, timezone: string): Date | null {
  if (!date || !time) return null;
  return buildZonedDateFromDateKey(toLocalDateString(date), time, timezone);
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

export function isValidAppointmentItem(item: AppointmentItem): boolean {
  const hasService = item.serviceId != null;
  const hasBundle = item.bundleId != null;
  if (!hasService && !hasBundle) return false;
  if (hasService && hasBundle) return false;
  return item.staffUserId != null;
}

export function allItemsHaveStaff(items: AppointmentItem[]): boolean {
  return items.length > 0 && items.every((item) => item.staffUserId != null);
}

/**
 * Staff user ids allowed to perform an item, straight from the location context.
 * An empty array means nobody is assigned — the item cannot be booked until
 * someone is assigned to it on the Assignments page. `null` means the item could
 * not be resolved against the location context (e.g. an already-booked service
 * that is no longer offered here), in which case eligibility is unknown and the
 * caller should not narrow the roster.
 */
export function getItemAllowedStaffIds(
  item: Pick<AppointmentItem, 'serviceId' | 'bundleId'>,
  services: Array<{ serviceId: number; staffIds?: number[] }>,
  bundles: Array<{ bundleId: number; staffIds?: number[] }>,
): number[] | null {
  if (item.serviceId != null) {
    const service = services.find((s) => s.serviceId === item.serviceId);
    return service ? (service.staffIds ?? []) : null;
  }
  if (item.bundleId != null) {
    const bundle = bundles.find((b) => b.bundleId === item.bundleId);
    return bundle ? (bundle.staffIds ?? []) : null;
  }
  return null;
}

/** People who can do every item (a bundle's booked services) of a fixed booking, plus the person currently assigned; null when it cannot be worked out. */
export function getFixedBookingAllowedStaffIds(
  items: BookedItem[],
  services: Array<{ serviceId: number; staffIds?: number[] }>,
  bundles: Array<{ bundleId: number; staffIds?: number[] }>,
  currentStaffUserId: number | null,
): number[] | null {
  let allowed: number[] | null = null;
  for (const item of items) {
    for (const ids of getBookedItemStaffLookups(item, services, bundles)) {
      if (ids == null) return null;
      allowed = allowed == null ? [...ids] : allowed.filter((id) => ids.includes(id));
    }
  }
  if (allowed == null) return null;
  if (currentStaffUserId != null && !allowed.includes(currentStaffUserId)) allowed.push(currentStaffUserId);
  return allowed;
}

function getBookedItemStaffLookups(
  item: BookedItem,
  services: Array<{ serviceId: number; staffIds?: number[] }>,
  bundles: Array<{ bundleId: number; staffIds?: number[] }>,
): Array<number[] | null> {
  if (item.includedServiceIds.length > 0) {
    return item.includedServiceIds.map((serviceId) => getItemAllowedStaffIds({ serviceId, bundleId: null }, services, bundles));
  }
  return [getItemAllowedStaffIds(item, services, bundles)];
}

export function hasBookedItemChanges(edits: BookedItemEdit[], originalItems: BookedItem[]): boolean {
  return edits.length !== originalItems.length || edits.some((edit, index) => !('bookedIndex' in edit) || edit.bookedIndex !== index);
}

export function getEditedBookingAllowedStaffIds(
  edits: BookedItemEdit[],
  originalItems: BookedItem[],
  services: Array<{ serviceId: number; staffIds?: number[] }>,
  bundles: Array<{ bundleId: number; staffIds?: number[] }>,
): number[] | null {
  let allowed: number[] | null = null;
  for (const edit of edits) {
    const lookups = 'bookedIndex' in edit
      ? getBookedItemStaffLookups(originalItems[edit.bookedIndex], services, bundles)
      : [getItemAllowedStaffIds({
          serviceId: 'serviceId' in edit ? edit.serviceId : null,
          bundleId: 'bundleId' in edit ? edit.bundleId : null,
        }, services, bundles) ?? []];
    for (const ids of lookups) {
      if (ids == null) continue;
      allowed = allowed == null ? [...ids] : allowed.filter((id) => ids.includes(id));
    }
  }
  return allowed;
}

/** Team members that can perform an item; empty when the item has no assignments. */
export function getEligibleTeamMembers<T extends { userId: number }>(
  allowedStaffIds: number[] | null,
  teamMembers: T[],
): T[] {
  if (allowedStaffIds == null) return teamMembers;
  return teamMembers.filter((member) => allowedStaffIds.includes(member.userId));
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

export function getEditedBookingDisplayItems(
  edits: BookedItemEdit[],
  originalItems: BookedItem[],
  services: Array<ServiceForDuration & { serviceName: string }>,
  bundles: LocationContextBundle[],
  staffUserId: number | null,
): BookedItem[] {
  return edits.map((edit) => {
    if ('bookedIndex' in edit) return originalItems[edit.bookedIndex];
    if ('serviceId' in edit) {
      const service = services.find((entry) => entry.serviceId === edit.serviceId);
      return {
        type: 'service',
        serviceId: edit.serviceId,
        bundleId: null,
        name: service?.serviceName ?? '',
        durationMinutes: service ? getEffectiveServiceDuration(service, staffUserId) : 0,
        priceMinor: service ? getEffectiveServicePriceMinor(service, staffUserId) : 0,
        includedServices: [],
        includedServiceIds: [],
      };
    }
    const bundle = bundles.find((entry) => entry.bundleId === edit.bundleId);
    const includedServiceIds = bundle?.serviceIds ?? [];
    const includedServices = includedServiceIds.flatMap((id) => {
      const service = services.find((entry) => entry.serviceId === id);
      return service ? [service.serviceName] : [];
    });
    return {
      type: 'bundle',
      serviceId: null,
      bundleId: edit.bundleId,
      name: bundle?.bundleName ?? '',
      durationMinutes: bundle?.durationMinutes ?? 0,
      priceMinor: bundle?.calculatedPriceAmountMinor ?? 0,
      includedServices,
      includedServiceIds,
    };
  });
}

export function getEditedBookingTotals(
  items: BookedItem[],
): { durationMinutes: number; priceMajor: number } {
  let durationMinutes = 0;
  let priceMinor = 0;
  for (const item of items) {
    durationMinutes += item.durationMinutes;
    priceMinor += item.priceMinor;
  }
  return { durationMinutes, priceMajor: priceMinor / 100 };
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
  items?: BookedItemEdit[];
  expectedUpdatedAt?: string;
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
  // One row stands for the whole bundle or multi-item booking.
  if (prefill.fixedBooking) {
    return [{ appointmentId: prefill.appointmentId ?? null, serviceId: null, bundleId: null, staffUserId: prefill.staffUserId ?? null }];
  }
  const prefillServiceId = prefill.serviceId ?? null;
  const prefillStaffId = prefill.staffUserId ?? null;
  const prefillBundleId = prefill.bundleId ?? null;
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
    staffUserId: prefill.editableBooking && prefill.editableBooking.staffCount !== 1 ? null : prefill.staffUserId ?? null,
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

export function buildMinimalEditAppointmentPayload(params: {
  snapshot: EditFormSnapshot;
  form: FormState;
  appointmentItems: AppointmentItem[];
  selectedLocationId: number | null;
  scheduledDate: Date;
  /** Bundle or multi-item booking: never sends a service. */
  contentFixed?: boolean;
  bookedItemEdit?: {
    items: BookedItemEdit[];
    expectedUpdatedAt: string;
    staffUserId: number | null;
  };
}): EditAppointmentPayload {
  const { snapshot, form, appointmentItems, selectedLocationId, scheduledDate, contentFixed, bookedItemEdit } = params;
  const payload: EditAppointmentPayload = {};
  const editItem = appointmentItems.find((item) => item.serviceId != null);
  if (!editItem?.serviceId && !contentFixed && !bookedItemEdit) return payload;

  const notesTrim = form.notes.trim();
  const snapNotesTrim = snapshot.notes.trim();
  if (notesTrim !== snapNotesTrim) {
    payload.notes = notesTrim;
  }
  if (bookedItemEdit) {
    payload.items = bookedItemEdit.items;
    payload.expectedUpdatedAt = bookedItemEdit.expectedUpdatedAt;
  } else if (editItem?.serviceId != null && editItem.serviceId !== snapshot.serviceId) {
    payload.serviceId = editItem.serviceId;
  }
  if (selectedLocationId != null && selectedLocationId !== snapshot.locationId) {
    payload.locationId = selectedLocationId;
  }
  if (bookedItemEdit) {
    const { staffUserId } = bookedItemEdit;
    if (staffUserId != null && staffUserId !== snapshot.staffUserId) payload.staffUserIds = [staffUserId];
  } else if (hasItemStaffChanged(appointmentItems, snapshot)) {
    payload.staffUserIds = appointmentItems
      .filter((i) => i.staffUserId != null)
      .map((i) => i.staffUserId as number);
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
  payload: EditAppointmentPayload,
): number {
  if (
    payload.scheduledAt !== undefined ||
    payload.notes !== undefined ||
    payload.serviceId !== undefined ||
    payload.items !== undefined ||
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
    'items',
    'expectedUpdatedAt',
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
