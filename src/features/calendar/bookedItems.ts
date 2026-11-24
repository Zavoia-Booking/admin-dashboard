import type { Appointment } from "../../shared/types/calendar";

/** One line of what was booked, as shown in the summary and in the edit form. */
export interface BookedItem {
  type: "service" | "bundle";
  serviceId: number | null;
  bundleId: number | null;
  /** "" when the API sent none; the list shows the "unknown item" text. */
  name: string;
  durationMinutes: number;
  priceMinor: number;
  /** Names of the services inside a bundle; empty for a service. */
  includedServices: string[];
  /** Ids of the services inside a bundle, as booked; empty for a service. */
  includedServiceIds: number[];
}

/** Recorded items and totals for the original booking. */
export interface FixedBooking {
  items: BookedItem[];
  durationMinutes: number;
  priceMinor: number;
}

export interface EditableBooking {
  items: BookedItem[];
  expectedUpdatedAt: string;
  scheduledAt: string;
  staffCount: number;
}

/** A bundle or multi-item booking has no standalone service for the scalar editor. */
export function isContentFixed(appointment: Pick<Appointment, "bookingType">): boolean {
  return appointment.bookingType === "bundle" || appointment.bookingType === "composite";
}

/** Length of the whole appointment, from its start and end. */
export function getBookedMinutes(appointment: Pick<Appointment, "scheduledAt" | "endsAt">): number {
  const ms = new Date(appointment.endsAt).getTime() - new Date(appointment.scheduledAt).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

/** What was booked, in order. Mirrors buildAppointmentItems in admin-api. */
export function getBookedItems(appointment: Appointment): BookedItem[] {
  const snapshot = appointment.bookingItemsSnapshot;
  if (snapshot && snapshot.length > 0) {
    return snapshot.map((entry) => ({
      type: entry.type,
      serviceId: entry.serviceId ?? null,
      bundleId: entry.bundleId ?? null,
      name: entry.name ?? "",
      durationMinutes: entry.duration ?? 0,
      priceMinor: entry.price ?? 0,
      includedServices: (entry.bundleServices ?? []).map((service) => service.serviceName),
      includedServiceIds: (entry.bundleServices ?? []).map((service) => service.serviceId),
    }));
  }

  const durationMinutes = getBookedMinutes(appointment);
  const priceMinor = appointment.price ?? 0;
  if (appointment.bookingType === "bundle") {
    return [
      {
        type: "bundle",
        serviceId: null,
        bundleId: appointment.bundle?.id ?? null,
        name: appointment.bookedItemName ?? appointment.bundle?.name ?? "",
        durationMinutes,
        priceMinor,
        includedServices: (appointment.bundleServicesSnapshot ?? []).map((service) => service.serviceName),
        includedServiceIds: (appointment.bundleServicesSnapshot ?? []).map((service) => service.serviceId),
      },
    ];
  }

  return [
    {
      type: "service",
      serviceId: appointment.service?.id ?? null,
      bundleId: null,
      name: appointment.bookedItemName ?? appointment.service?.name ?? appointment.bundle?.name ?? "",
      durationMinutes,
      priceMinor,
      includedServices: [],
      includedServiceIds: [],
    },
  ];
}
