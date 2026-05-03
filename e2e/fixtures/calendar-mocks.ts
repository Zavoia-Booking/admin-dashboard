import type { Page, Request, Route } from '@playwright/test'

/**
 * Calendar API mocks (Class A — read paths). Mirrors the shape of the real
 * responses defined in src/shared/types/calendar.ts so the calendar can render
 * exactly the state a spec wants without seeding a database.
 *
 * For mutations (create/edit/cancel/blocks/reschedule) Class B specs use real
 * DB seeding via calendar-seed.ts and DO NOT call these mocks.
 */

// ─────────────────────────────────────────────────────────────
// Sample builders
// ─────────────────────────────────────────────────────────────

export interface SampleStaff {
  id: number
  firstName: string
  lastName: string
  profileImage: string | null
}

export interface SampleService {
  serviceId: number
  serviceName: string
  category?: { id: number; name: string; color?: string } | null
  defaultPrice: number
  defaultDisplayPrice: number
  defaultDuration: number
  customPrice: number | null
  customDuration: number | null
  staffCount: number
  staffWithOverrides: number
  staffIds: number[]
  staffOverrides: Array<{ userId: number; customPrice: number | null; customDuration: number | null }>
}

export interface SampleAppointment {
  id: number
  scheduledAt: string
  endsAt: string
  status: string
  bookedItemName: string
  duration: number
  staffUserIds: number[]
  customerName: string | null
  bookingSource: string
  isUnassigned: boolean
  bookingGroupId?: string | null
  bookingGroupOrder?: number | null
  groupSize?: number
  notes?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  overrideReason?: string
}

export interface SampleBlock {
  id: number
  blockScope: 'business' | 'location' | 'staff'
  userId: number | null
  startsAt: string
  endsAt: string
  isAllDay: boolean
  reason: string
  title: string | null
  notes?: string | null
  isRecurring?: boolean
  repeatFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  repeatDaysOfWeek?: number[]
  repeatEndDate?: string | null
}

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

const DEFAULT_LOCATION_ID = 101
const DEFAULT_STAFF: SampleStaff[] = [
  { id: 201, firstName: 'Ana', lastName: 'Stylist', profileImage: null },
  { id: 202, firstName: 'Bogdan', lastName: 'Barber', profileImage: null },
]
const DEFAULT_SERVICES: SampleService[] = [
  {
    serviceId: 301,
    serviceName: 'Haircut',
    category: { id: 901, name: 'Hair', color: '#0ea5e9' },
    defaultPrice: 5000,
    defaultDisplayPrice: 50,
    defaultDuration: 30,
    customPrice: null,
    customDuration: null,
    staffCount: 2,
    staffWithOverrides: 0,
    staffIds: [201, 202],
    staffOverrides: [],
  },
  {
    serviceId: 302,
    serviceName: 'Color',
    category: { id: 901, name: 'Hair', color: '#0ea5e9' },
    defaultPrice: 12000,
    defaultDisplayPrice: 120,
    defaultDuration: 60,
    customPrice: null,
    customDuration: null,
    staffCount: 2,
    staffWithOverrides: 0,
    staffIds: [201, 202],
    staffOverrides: [],
  },
]

export interface LocationContextOverrides {
  locationId?: number
  locationName?: string
  timezone?: string | null
  open247?: boolean
  staff?: SampleStaff[]
  services?: SampleService[]
  bundles?: Array<{
    bundleId: number
    bundleName: string
    serviceIds: number[]
    durationMinutes: number
    priceType: 'sum' | 'fixed' | 'discount'
    fixedPriceAmountMinor: number | null
    discountPercentage: number | null
    calculatedPriceAmountMinor: number
    calculatedDisplayPrice: number
    serviceCount: number
    staffIds: number[]
  }>
  bookingSettings?: Partial<{
    slotIntervalMinutes: number
    bufferTimeMinutes: number
    autoConfirmBookings: boolean
    allowStaffSelection: boolean
    allowStaffCancelWithoutConfirmation: boolean
    allowStaffRescheduleWithoutConfirmation: boolean
    allowStaffBlockCalendarWithoutConfirmation: boolean
    staffBlockCalendarTypes: string[]
    reminderHoursBefore: number
    enforceMinAdvanceForAdmin: boolean
    minAdvanceBookingMinutes: number
  }>
}

export function sampleLocationContext(o: LocationContextOverrides = {}) {
  const staff = o.staff ?? DEFAULT_STAFF
  return {
    location: {
      id: o.locationId ?? DEFAULT_LOCATION_ID,
      name: o.locationName ?? 'E2E Test Salon — Main',
      timezone: o.timezone ?? 'Europe/Bucharest',
      workingHours: {
        monday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
        tuesday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
        wednesday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
        thursday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
        friday: { openTime: '09:00', closeTime: '18:00', isOpen: true },
        saturday: { openTime: '10:00', closeTime: '14:00', isOpen: true },
        sunday: { openTime: '00:00', closeTime: '00:00', isOpen: false },
      },
      open247: o.open247 ?? false,
    },
    staff: staff.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      profileImage: s.profileImage,
    })),
    bookingSettings: {
      slotIntervalMinutes: 15,
      bufferTimeMinutes: 0,
      autoConfirmBookings: true,
      allowStaffSelection: true,
      allowStaffCancelWithoutConfirmation: true,
      allowStaffRescheduleWithoutConfirmation: true,
      allowStaffBlockCalendarWithoutConfirmation: true,
      staffBlockCalendarTypes: ['vacation', 'personal'],
      reminderHoursBefore: 24,
      enforceMinAdvanceForAdmin: false,
      minAdvanceBookingMinutes: 15,
      ...(o.bookingSettings ?? {}),
    },
    services: o.services ?? DEFAULT_SERVICES,
    teamMembers: staff.map((s) => ({
      userId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@e2e.test`,
      profileImage: s.profileImage,
      role: 'team_member',
      servicesEnabled: 2,
      overridesCount: 0,
    })),
    bundles: o.bundles ?? [],
  }
}

export function sampleAppointment(o: Partial<SampleAppointment> = {}): SampleAppointment {
  const now = new Date()
  const start = o.scheduledAt ? new Date(o.scheduledAt) : new Date(now.setHours(10, 0, 0, 0))
  const end = o.endsAt ? new Date(o.endsAt) : new Date(start.getTime() + 30 * 60_000)
  return {
    id: o.id ?? 1,
    scheduledAt: start.toISOString(),
    endsAt: end.toISOString(),
    status: o.status ?? 'confirmed',
    bookedItemName: o.bookedItemName ?? 'Haircut',
    duration: o.duration ?? 30,
    staffUserIds: o.staffUserIds ?? [201],
    customerName: o.customerName ?? 'Maria Popescu',
    bookingSource: o.bookingSource ?? 'admin',
    isUnassigned: o.isUnassigned ?? false,
    bookingGroupId: o.bookingGroupId ?? null,
    bookingGroupOrder: o.bookingGroupOrder ?? null,
    groupSize: o.groupSize,
    notes: o.notes ?? null,
    customerPhone: o.customerPhone ?? null,
    customerEmail: o.customerEmail ?? null,
    overrideReason: o.overrideReason,
  }
}

export function sampleBlock(o: Partial<SampleBlock> = {}): SampleBlock {
  const now = new Date()
  const start = o.startsAt ? new Date(o.startsAt) : new Date(now.setHours(13, 0, 0, 0))
  const end = o.endsAt ? new Date(o.endsAt) : new Date(start.getTime() + 60 * 60_000)
  return {
    id: o.id ?? 1,
    blockScope: o.blockScope ?? 'location',
    userId: o.userId ?? null,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    isAllDay: o.isAllDay ?? false,
    reason: o.reason ?? 'lunch_break',
    title: o.title ?? null,
    notes: o.notes ?? null,
    isRecurring: o.isRecurring ?? false,
    repeatFrequency: o.repeatFrequency,
    repeatDaysOfWeek: o.repeatDaysOfWeek,
    repeatEndDate: o.repeatEndDate ?? null,
  }
}

/** Build a YYYY-MM-DD key in the local calendar (matches what the UI sends). */
export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─────────────────────────────────────────────────────────────
// Route mocks — capture requests so specs can assert on payloads
// ─────────────────────────────────────────────────────────────

export interface RouteCapture {
  requests: Request[]
}

export async function mockCalendarLocationContext(
  page: Page,
  overrides: LocationContextOverrides = {},
): Promise<void> {
  const body = sampleLocationContext(overrides)
  await page.route('**/api/calendar/location-context/*', (route) => json(route, 200, body))
}

export async function mockCalendarSummary(
  page: Page,
  options: { days?: Record<string, { appointmentCount: number; blockedSlots: number; isOpen: boolean }> } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/calendar/summary', (route) => {
    cap.requests.push(route.request())
    return json(route, 200, { days: options.days ?? {} })
  })
  return cap
}

export interface DayDataMock {
  appointments?: SampleAppointment[]
  blocks?: SampleBlock[]
}

export async function mockCalendarDay(
  page: Page,
  data: DayDataMock = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/calendar/day', (route) => {
    cap.requests.push(route.request())
    return json(route, 200, {
      appointments: data.appointments ?? [],
      blocks: data.blocks ?? [],
    })
  })
  return cap
}

export async function mockCalendarWeek(
  page: Page,
  data: { days?: Record<string, DayDataMock>; miniSummary?: Record<string, unknown> } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/calendar/week', (route) => {
    cap.requests.push(route.request())
    const days: Record<string, { appointments: SampleAppointment[]; blocks: SampleBlock[] }> = {}
    for (const [k, v] of Object.entries(data.days ?? {})) {
      days[k] = { appointments: v.appointments ?? [], blocks: v.blocks ?? [] }
    }
    return json(route, 200, { days, miniSummary: data.miniSummary ?? {} })
  })
  return cap
}

export async function mockAvailableSlots(
  page: Page,
  options: { availableSlots?: string[]; outOfHoursSlots?: string[]; nextAvailableDate?: string | null } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/calendar/available-slots', (route) => {
    cap.requests.push(route.request())
    return json(route, 200, {
      availableSlots: options.availableSlots ?? [],
      outOfHoursSlots: options.outOfHoursSlots ?? [],
      nextAvailableDate: options.nextAvailableDate ?? null,
    })
  })
  return cap
}

// Auxiliary endpoints the calendar page touches but Class A specs don't care about:

export async function mockListLocations(
  page: Page,
  locations: Array<{ id: number; name: string }> = [{ id: DEFAULT_LOCATION_ID, name: 'E2E Test Salon — Main' }],
): Promise<void> {
  // Frontend calls POST /locations/list (src/features/locations/api.ts), and the
  // saga destructures `{ locations }` from the response. The api.ts return type
  // says `Promise<LocationType[]>` but that's wrong — the backend returns the
  // envelope `{ locations: [...] }`. Mock the envelope shape so the saga works.
  const body = {
    locations: locations.map((l) => ({
      id: l.id,
      uuid: `loc-uuid-${l.id}`,
      name: l.name,
      email: 'salon@e2e.test',
      phone: '+40700000001',
      description: '',
      address: '123 Test Street',
      city: 'Bucharest',
      countryCode: 'ro',
      latitude: 44.4268,
      longitude: 26.1025,
      timezone: 'Europe/Bucharest',
      isActive: true,
      isRemote: false,
      open247: false,
      createdAt: new Date().toISOString(),
      workingHours: {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '10:00', close: '14:00', isOpen: true },
        sunday: { open: '00:00', close: '00:00', isOpen: false },
      },
      addressComponents: null,
      addressManualMode: false,
      useBusinessContact: false,
      servicesCount: 0,
      teamMembersCount: 0,
    })),
  }
  await page.route('**/api/locations/list', (route) => json(route, 200, body))
}

export async function mockBusinessNotifications(page: Page): Promise<void> {
  await page.route('**/api/business-notifications**', (route) => json(route, 200, { notifications: [], unreadCount: 0 }))
}

// ─────────────────────────────────────────────────────────────
// Convenience: stub *every* read-side endpoint with safe defaults
// so each spec only overrides what it cares about (mirrors mockBillingDefaults).
// ─────────────────────────────────────────────────────────────

export interface CalendarDefaultsOptions {
  locationContext?: LocationContextOverrides
  day?: DayDataMock
  week?: { days?: Record<string, DayDataMock>; miniSummary?: Record<string, unknown> }
  summary?: Parameters<typeof mockCalendarSummary>[1]
  availableSlots?: Parameters<typeof mockAvailableSlots>[1]
  locations?: Parameters<typeof mockListLocations>[1]
}

export interface CalendarMockHandles {
  day: RouteCapture
  week: RouteCapture
  summary: RouteCapture
  availableSlots: RouteCapture
}

/**
 * Stub every read-side endpoint the calendar page calls. The default state is
 * an empty calendar with one location and two staff members, so any view
 * (Day/Week/Month) renders without errors. Specs override individual mocks
 * after this to drive the page into a specific state — the ROUTE OVERRIDE
 * SEMANTICS of Playwright are LIFO, so re-calling `mockCalendarDay` with
 * different data after `mockCalendarDefaults` works correctly.
 */
export async function mockCalendarDefaults(
  page: Page,
  options: CalendarDefaultsOptions = {},
): Promise<CalendarMockHandles> {
  await mockCalendarLocationContext(page, options.locationContext ?? {})
  await mockListLocations(page, options.locations)
  await mockBusinessNotifications(page)
  const day = await mockCalendarDay(page, options.day ?? {})
  const week = await mockCalendarWeek(page, options.week ?? {})
  const summary = await mockCalendarSummary(page, options.summary ?? {})
  const availableSlots = await mockAvailableSlots(page, options.availableSlots ?? {})
  return { day, week, summary, availableSlots }
}

// ─────────────────────────────────────────────────────────────
// Mutation mocks (Class B specs — capture payload, return fabricated success)
//
// These follow the same pattern as billing-mocks `mockCheckoutEndpoint`: we
// intercept the request, return a 2xx with a stub body, and expose the
// captured Request[] to the spec for payload assertions.
//
// NOTE: this approach validates the UI sends the right payload — it does NOT
// exercise the real backend validation, conflict detection, snapshot
// persistence, etc. True real-DB Class B would need a test-only seed endpoint
// in admin-api (gated behind RATE_LIMIT_DISABLED-style env). See plan file
// "Inconsistencies #6" for the trade-off discussion.
// ─────────────────────────────────────────────────────────────

export async function mockCreateAppointment(
  page: Page,
  options: { id?: number; bookingGroupId?: string; status?: number } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  const id = options.id ?? 9001
  const bookingGroupId = options.bookingGroupId ?? `grp-${id}`
  await page.route('**/api/appointments/admin-create-group', (route) => {
    cap.requests.push(route.request())
    return json(route, options.status ?? 201, {
      id,
      bookingGroupId,
      bookingGroupOrder: 1,
      groupSize: 1,
      status: 'confirmed',
    })
  })
  return cap
}

export async function mockUpdateAppointment(
  page: Page,
  options: { status?: number; body?: unknown } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/appointments/*', (route) => {
    if (route.request().method() !== 'PUT') return route.continue()
    cap.requests.push(route.request())
    return json(route, options.status ?? 200, options.body ?? { ok: true })
  })
  return cap
}

export async function mockRescheduleGroup(
  page: Page,
  options: { status?: number } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/appointments/group/*/reschedule', (route) => {
    cap.requests.push(route.request())
    return json(route, options.status ?? 200, { ok: true })
  })
  return cap
}

export async function mockCancelAppointment(
  page: Page,
  options: { status?: number } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/appointments/*/cancel', (route) => {
    cap.requests.push(route.request())
    return json(route, options.status ?? 200, { ok: true })
  })
  return cap
}

export async function mockGetAppointmentDetail(
  page: Page,
  appointment: SampleAppointment & { id: number },
): Promise<void> {
  await page.route('**/api/appointments/*', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    return json(route, 200, {
      ...appointment,
      // The detail endpoint returns the full Appointment shape — for our test
      // purposes the slim shape plus a few extras is enough.
      teamMembers: appointment.staffUserIds.map((uid) => ({ userId: uid })),
      service: { id: 301, name: appointment.bookedItemName },
      location: { id: DEFAULT_LOCATION_ID, name: 'E2E Test Salon — Main' },
      notes: appointment.notes ?? '',
      cancellationReason: '',
      price: 5000,
    })
  })
}

export async function mockCreateBlock(
  page: Page,
  options: { id?: number; status?: number } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  const id = options.id ?? 7001
  await page.route('**/api/calendar-blocks', (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    cap.requests.push(route.request())
    return json(route, options.status ?? 201, { id, ok: true })
  })
  return cap
}

export async function mockUpdateBlock(
  page: Page,
  options: { status?: number } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/calendar-blocks/*', (route) => {
    if (route.request().method() !== 'PUT') return route.continue()
    cap.requests.push(route.request())
    return json(route, options.status ?? 200, { ok: true })
  })
  return cap
}

export async function mockDeleteBlock(
  page: Page,
  options: { status?: number } = {},
): Promise<RouteCapture> {
  const cap: RouteCapture = { requests: [] }
  await page.route('**/api/calendar-blocks/*', (route) => {
    if (route.request().method() !== 'DELETE') return route.continue()
    cap.requests.push(route.request())
    return json(route, options.status ?? 200, { ok: true })
  })
  return cap
}

// ─────────────────────────────────────────────────────────────
// Helpers for assertions on captured requests
// ─────────────────────────────────────────────────────────────

export function postBody(req: Request): Record<string, unknown> {
  const raw = req.postData()
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

export const DEFAULTS = {
  LOCATION_ID: DEFAULT_LOCATION_ID,
  STAFF: DEFAULT_STAFF,
  SERVICES: DEFAULT_SERVICES,
}
