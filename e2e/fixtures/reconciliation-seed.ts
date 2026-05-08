/**
 * Seed helpers for the reconciliation Playwright suite.
 *
 * Strategy: real-DB seed via the admin-api HTTP endpoints (the same ones the
 * dashboard calls). The one place we touch the DB directly is to rotate the
 * invitation token's hash in `verification_token` so we can complete the
 * invitation flow as the new team member — the plain token is otherwise only
 * delivered via email, which is disabled in the test environment.
 *
 * Each helper returns the IDs the tests need to drive UI flows and to verify
 * post-conditions via API or DB.
 */

import type { APIRequestContext, Page } from '@playwright/test'
import { request } from '@playwright/test'
import { makeTestUser, registerViaApi, VALID_PASSWORD, type TestUser } from './test-helpers'
import { bootstrapBusinessForOwner, getUserIdByEmail, rotateLatestInvitationToken } from './test-db'

// API requests go through the dashboard's `/api/*` proxy on 5174 → admin-api 3001.
// This matches the existing test-helpers convention.
export const APP_BASE_URL = 'http://localhost:5174'

export interface ApiSession {
  ctx: APIRequestContext
  user: TestUser
  /** Owner user id, resolved from /api/auth/me. */
  userId: number
  /** Owner businessId, resolved from /api/auth/me. */
  businessId: number
  /** Bearer token for Authorization header. */
  accessToken: string
  csrfToken: string
}

interface SeedTeamMember {
  user: TestUser
  userId: number
}

interface SeededLocation {
  id: number
  name: string
}

interface SeededService {
  id: number
  name: string
  duration: number
}

interface SeededCustomer {
  id: number
  firstName: string
  lastName: string
}

export interface SeededAppointment {
  id: number
  scheduledAt: string
  endsAt: string
  staffUserId: number
  customer: SeededCustomer
  service: SeededService
  location: SeededLocation
}

export interface RemoveMemberSeed {
  owner: ApiSession
  location: SeededLocation
  service: SeededService
  /** The team member that the test will try to remove. */
  member: SeedTeamMember
  /** A second team member kept around as a reassignment target. */
  cover: SeedTeamMember
  customer: SeededCustomer
  appointment: SeededAppointment
}

export interface UnassignSeed extends RemoveMemberSeed {
  /** Second location where `member` is also assigned — proves unassign is location-scoped. */
  otherLocation: SeededLocation
}

export interface SeatOverflowSeed {
  owner: ApiSession
  location: SeededLocation
  service: SeededService
  members: SeedTeamMember[]
  cover: SeedTeamMember
  customer: SeededCustomer
  appointment: SeededAppointment
  /** The member whose appointment lives on `appointment` (always members[0]). */
  primaryMember: SeedTeamMember
}

// ────────────────────────────────────────────────────────────────────────────
// FE auth/me mocking with real seed identity
// ────────────────────────────────────────────────────────────────────────────

export interface MockAuthMeOptions {
  paidTeamSeats?: number
  /**
   * Number of currently used seats. When > paidTeamSeats the SeatOverflowDetector
   * will auto-open the seat_overflow reconciliation modal on entry to non-deferred
   * routes.
   */
  usedSeats?: number
  status?: 'trial' | 'active' | 'expired'
  maxTeamMembers?: number
}

/**
 * Stub `GET /api/auth/me` so the FE sees the real seeded owner (correct user id
 * + business id) but with the entitlement shape this test wants — mainly used
 * by seat_overflow to fake the post-downgrade state.
 */
export async function mockAuthMeForOwner(
  page: Page,
  owner: ApiSession,
  opts: MockAuthMeOptions = {},
): Promise<void> {
  const status = opts.status ?? 'trial'
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const body = {
    id: owner.userId,
    email: owner.user.email,
    firstName: owner.user.firstName,
    lastName: owner.user.lastName,
    role: 'owner',
    businessId: owner.businessId,
    wizardCompleted: true,
    emailVerified: true,
    business: {
      id: owner.businessId,
      name: 'E2E Test Salon',
      logo: null,
      countryCode: 'ro',
      businessCurrency: 'ron',
      phone: '+40700000000',
    },
    subscription: {
      status: status === 'trial' ? null : status,
      planTier: 'BASE',
      planName: 'Base',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: status === 'trial' ? trialEndsAt : null,
    },
    entitlements: {
      entitled: true,
      status,
      daysRemaining: 7,
      maxLocations: 5,
      maxTeamMembers: opts.maxTeamMembers ?? 10,
      paidTeamSeats: opts.paidTeamSeats ?? 10,
      usedSeats: opts.usedSeats ?? 0,
    },
  }
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  )

  // The seat_overflow gate's `dataReady` requires `subscriptionSummary`. The
  // real endpoint needs Stripe price configuration that's not seeded in test;
  // stub a minimal "no pending payment" summary so the gate moves on.
  const summary = {
    plan: { id: 1, name: 'Base', tier: 'BASE' },
    isInTrial: status === 'trial',
    paidTeamSeats: opts.paidTeamSeats ?? 10,
    currentTeamMembersCount: opts.usedSeats ?? 0,
    numberOfLocations: 1,
    cadence: 'monthly',
    currency: 'RON',
    basePrice: 0,
    seatPrice: 0,
    totalMonthlyCost: 0,
    totalTeamMembersCost: 0,
    breakdown: [],
    pendingPayment: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    currentPeriodEnd: null,
    currentPeriodStart: null,
    trialEndsAt,
    nextBillingDate: null,
  }
  await page.route('**/api/billing/subscription-summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summary),
    }),
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Auth helpers
// ────────────────────────────────────────────────────────────────────────────

async function newApiContext(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: APP_BASE_URL })
}

async function loginViaApi(
  ctx: APIRequestContext,
  email: string,
  password: string,
): Promise<{ accessToken: string; csrfToken: string; user: { id: number; businessId: number | null } }> {
  const res = await ctx.post('/api/auth/login', { data: { email, password } })
  if (!res.ok()) {
    throw new Error(`loginViaApi failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return body
}

function authHeaders(session: { accessToken: string; csrfToken: string }) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-CSRF-Token': session.csrfToken,
  }
}

/**
 * Register a brand-new owner, bypass the wizard by inserting a Business row
 * directly, and re-login so the JWT carries the business context. Returns a
 * session ready to drive seed calls.
 */
export async function registerOwnerSession(): Promise<ApiSession> {
  const user = makeTestUser({ firstName: 'Owner', lastName: 'McTest' })
  const ctx = await newApiContext()
  await registerViaApi(ctx, user)
  // Resolve the user id from the DB — the register response shape doesn't
  // surface it consistently and we don't need a JWT yet.
  const userId = await getUserIdByEmail(user.email)
  const businessId = await bootstrapBusinessForOwner(userId)
  // Re-login to mint a JWT that contains the business in its payload.
  const login = await loginViaApi(ctx, user.email, user.password)
  return {
    ctx,
    user,
    userId,
    businessId,
    accessToken: login.accessToken,
    csrfToken: login.csrfToken,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Resource creation
// ────────────────────────────────────────────────────────────────────────────

const OPEN_ALL_DAY = { open: '00:00', close: '23:59', isOpen: true }
const OPEN_24_7_HOURS = {
  monday: OPEN_ALL_DAY,
  tuesday: OPEN_ALL_DAY,
  wednesday: OPEN_ALL_DAY,
  thursday: OPEN_ALL_DAY,
  friday: OPEN_ALL_DAY,
  saturday: OPEN_ALL_DAY,
  sunday: OPEN_ALL_DAY,
}

export async function createLocation(
  session: ApiSession,
  overrides: { name?: string } = {},
): Promise<SeededLocation> {
  const name = overrides.name ?? `Salon ${Math.random().toString(36).slice(2, 6)}`
  const res = await session.ctx.post('/api/locations/create', {
    headers: authHeaders(session),
    data: {
      name,
      phone: '+40700000000',
      email: 'salon@test.com',
      address: '1 Test Street',
      isRemote: false,
      open247: true,
      workingHours: OPEN_24_7_HOURS,
    },
  })
  if (!res.ok()) {
    throw new Error(`createLocation failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return { id: body.location.id, name: body.location.name }
}

export async function createService(
  session: ApiSession,
  args: {
    name?: string
    durationMin?: number
    locationIds?: number[]
  } = {},
): Promise<SeededService> {
  const name = args.name ?? `Haircut ${Math.random().toString(36).slice(2, 6)}`
  const duration = args.durationMin ?? 30
  const res = await session.ctx.post('/api/services/create', {
    headers: authHeaders(session),
    data: {
      name,
      price_amount_minor: 5000,
      duration,
      locations: args.locationIds,
      category: { categoryName: 'Hair', categoryColor: '#FF8800' },
    },
  })
  if (!res.ok()) {
    throw new Error(`createService failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return { id: body.service.id, name, duration }
}

/**
 * Send a team-member invitation (creates a pending User + verification_token row),
 * rotate the token hash to one we know, and complete the invitation as the new user.
 * Returns the now-active team member's user id.
 */
export async function inviteAndAcceptTeamMember(
  session: ApiSession,
  args: {
    locationIds: number[]
    firstName?: string
    lastName?: string
  },
): Promise<SeedTeamMember> {
  const member = makeTestUser({
    firstName: args.firstName ?? 'Mem',
    lastName: args.lastName ?? `Ber${Math.random().toString(36).slice(2, 5)}`,
  })

  const inviteRes = await session.ctx.post('/api/auth/invite-team-member', {
    headers: authHeaders(session),
    data: { email: member.email, locationIds: args.locationIds },
  })
  if (!inviteRes.ok()) {
    throw new Error(`invite-team-member failed: ${inviteRes.status()} ${await inviteRes.text()}`)
  }

  const plainToken = await rotateLatestInvitationToken(member.email)

  const completeRes = await session.ctx.post('/api/auth/complete-team-invitation', {
    data: {
      token: plainToken,
      firstName: member.firstName,
      lastName: member.lastName,
      password: VALID_PASSWORD,
      phone: '+40712345678',
    },
  })
  if (!completeRes.ok()) {
    throw new Error(`complete-team-invitation failed: ${completeRes.status()} ${await completeRes.text()}`)
  }
  const userId = await getUserIdByEmail(member.email)
  return { user: member, userId }
}

/**
 * Two-step assignment that mirrors the real dashboard flow:
 *  1) `PUT /assignments/locations/:id` to link users to the location and
 *     enable the service there (creates user_x_location + location_service rows).
 *  2) `PUT /assignments/locations/:locationId/staff/:userId/services` per user
 *     to set canPerform=true on the (user, service, location) triple
 *     (creates user_service_location rows). Without step 2 the appointment
 *     creation rejects the staff as ineligible.
 */
export async function assignMembersAtLocation(
  session: ApiSession,
  args: { locationId: number; serviceId: number; userIds: number[] },
): Promise<void> {
  const linkRes = await session.ctx.put(`/api/assignments/locations/${args.locationId}`, {
    headers: authHeaders(session),
    data: {
      services: [{ serviceId: args.serviceId, isEnabled: true }],
      userIds: args.userIds,
    },
  })
  if (!linkRes.ok()) {
    throw new Error(`assignments PUT failed: ${linkRes.status()} ${await linkRes.text()}`)
  }
  for (const userId of args.userIds) {
    const staffRes = await session.ctx.put(
      `/api/assignments/locations/${args.locationId}/staff/${userId}/services`,
      {
        headers: authHeaders(session),
        data: {
          services: [{ serviceId: args.serviceId, canPerform: true }],
        },
      },
    )
    if (!staffRes.ok()) {
      throw new Error(
        `assignments staff services PUT failed: ${staffRes.status()} ${await staffRes.text()}`,
      )
    }
  }
}

export async function createCustomer(
  session: ApiSession,
  overrides: { firstName?: string; lastName?: string } = {},
): Promise<SeededCustomer> {
  const firstName = overrides.firstName ?? 'Cassie'
  const lastName = overrides.lastName ?? `Stone${Math.random().toString(36).slice(2, 5)}`
  const res = await session.ctx.post('/api/business-customers/add-manually', {
    headers: authHeaders(session),
    data: { firstName, lastName, phone: '+40755555555' },
  })
  if (!res.ok()) {
    throw new Error(`add-manually customer failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return { id: body.customer?.id ?? body.id, firstName, lastName }
}

export async function createAppointment(
  session: ApiSession,
  args: {
    serviceId: number
    locationId: number
    customerId: number
    staffUserId: number
    /** Hours from now. Defaults to 24h ahead so it's safely "upcoming". */
    hoursAhead?: number
  },
): Promise<{ id: number; scheduledAt: string; endsAt: string }> {
  const scheduledAt = new Date(Date.now() + (args.hoursAhead ?? 24) * 60 * 60 * 1000).toISOString()
  const res = await session.ctx.post('/api/appointments/admin-create', {
    headers: authHeaders(session),
    data: {
      serviceId: args.serviceId,
      locationId: args.locationId,
      customerId: args.customerId,
      staffUserIds: [args.staffUserId],
      scheduledAt,
      allowOutOfHours: true,
    },
  })
  if (!res.ok()) {
    throw new Error(`admin-create appointment failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return { id: body.appointment.id, scheduledAt: body.appointment.scheduledAt, endsAt: body.appointment.endsAt }
}

// ────────────────────────────────────────────────────────────────────────────
// High-level fixtures
// ────────────────────────────────────────────────────────────────────────────

/**
 * Owner + 1 location + 1 service + 2 team members ("member" and "cover", both
 * canPerform=true at the location), 1 customer, 1 upcoming appointment booked
 * with `member`. Used by remove-member tests and as the base for seat-overflow.
 */
export async function seedRemoveMemberFixture(): Promise<RemoveMemberSeed> {
  const owner = await registerOwnerSession()
  const location = await createLocation(owner)
  const service = await createService(owner, { locationIds: [location.id] })
  const member = await inviteAndAcceptTeamMember(owner, {
    locationIds: [location.id],
    firstName: 'Mira',
  })
  const cover = await inviteAndAcceptTeamMember(owner, {
    locationIds: [location.id],
    firstName: 'Cory',
  })
  await assignMembersAtLocation(owner, {
    locationId: location.id,
    serviceId: service.id,
    userIds: [member.userId, cover.userId, owner.userId],
  })
  const customer = await createCustomer(owner)
  const appt = await createAppointment(owner, {
    serviceId: service.id,
    locationId: location.id,
    customerId: customer.id,
    staffUserId: member.userId,
  })
  return {
    owner,
    location,
    service,
    member,
    cover,
    customer,
    appointment: { ...appt, staffUserId: member.userId, customer, service, location },
  }
}

/**
 * Same as remove-member but with a second location where `member` is ALSO
 * assigned. Tests for the unassign-from-location flow can then verify the
 * member stays in the org and on the other location.
 */
export async function seedUnassignFixture(): Promise<UnassignSeed> {
  const base = await seedRemoveMemberFixture()
  const otherLocation = await createLocation(base.owner, { name: 'Salon Two' })
  await assignMembersAtLocation(base.owner, {
    locationId: otherLocation.id,
    serviceId: base.service.id,
    userIds: [base.member.userId, base.cover.userId, base.owner.userId],
  })
  return { ...base, otherLocation }
}

/**
 * Seat-overflow setup: 3 team members so the FE can be told (via mocked
 * /api/auth/me with paidTeamSeats: 1) it has more active members than seats.
 * Only the "primary" member has an upcoming appointment — the other two can
 * be removed without reconciliation.
 */
export async function seedSeatOverflowFixture(): Promise<SeatOverflowSeed> {
  const owner = await registerOwnerSession()
  const location = await createLocation(owner)
  const service = await createService(owner, { locationIds: [location.id] })
  const m1 = await inviteAndAcceptTeamMember(owner, { locationIds: [location.id], firstName: 'Mira' })
  const m2 = await inviteAndAcceptTeamMember(owner, { locationIds: [location.id], firstName: 'Nora' })
  const cover = await inviteAndAcceptTeamMember(owner, { locationIds: [location.id], firstName: 'Cory' })
  await assignMembersAtLocation(owner, {
    locationId: location.id,
    serviceId: service.id,
    userIds: [m1.userId, m2.userId, cover.userId, owner.userId],
  })
  const customer = await createCustomer(owner)
  const appt = await createAppointment(owner, {
    serviceId: service.id,
    locationId: location.id,
    customerId: customer.id,
    staffUserId: m1.userId,
  })
  return {
    owner,
    location,
    service,
    members: [m1, m2],
    cover,
    customer,
    appointment: { ...appt, staffUserId: m1.userId, customer, service, location },
    primaryMember: m1,
  }
}
