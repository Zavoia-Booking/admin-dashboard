import { formatDateInTimezone } from '../../calendar/timezone';

export function formatAppointmentTime(iso: string, locale: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString(locale, { timeZone, hour: '2-digit', minute: '2-digit' });
}

export function appointmentDayDifference(date: Date, reference: Date, timeZone: string): number {
  // Compare date keys as UTC midnights to count calendar dates across DST changes.
  const dateDay = Date.parse(formatDateInTimezone(date, timeZone));
  const referenceDay = Date.parse(formatDateInTimezone(reference, timeZone));
  return (dateDay - referenceDay) / 86_400_000;
}
