/**
 * Pure helpers for AddAppointmentSlider: payload building, validation, display labels.
 * Kept in a separate file to avoid bloating the component; no React or component state.
 */

import type { AppointmentBookingSource } from '../../../shared/types/calendar';
import { buildZonedDate } from '../timezone';

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

export function getCustomerDisplayLabel(display: CustomerDisplay | null, forEditMode?: boolean): string {
  if (!display) return forEditMode ? 'Walk-in' : 'Customer';
  const name = [display.firstName, display.lastName].filter(Boolean).join(' ').trim();
  return name || display.email || 'Customer';
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
): string {
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

export function getConfirmDialogTitle(isReschedule: boolean): string {
  return isReschedule ? 'Reschedule anyway?' : 'Create appointment anyway?';
}

export function getConfirmButtonTitle(isReschedule: boolean): string {
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
