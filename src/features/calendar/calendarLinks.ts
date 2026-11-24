/** Link into the calendar: a day, a location, and optionally a service, bundle or person filter. */
export function buildCalendarLink(params: {
  date?: string | null;
  locationId?: number | null;
  serviceId?: number | null;
  bundleId?: number | null;
  staffEmail?: string | null;
  appointmentUuid?: string | null;
}): string {
  const query = new URLSearchParams();
  if (params.date) query.set("date", params.date);
  if (params.locationId != null) query.set("locationId", String(params.locationId));
  if (params.serviceId != null) query.set("serviceId", String(params.serviceId));
  if (params.bundleId != null) query.set("bundleId", String(params.bundleId));
  if (params.staffEmail) query.set("staffEmail", params.staffEmail);
  if (params.appointmentUuid) query.set("appointmentUuid", params.appointmentUuid);
  const qs = query.toString();
  return qs ? `/calendar?${qs}` : "/calendar";
}
