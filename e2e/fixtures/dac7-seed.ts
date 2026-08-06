/**
 * Seed + assertion helpers for the DAC7 ledger suite.
 *
 * The ledger is a pure database side-effect, so these tests assert against the
 * real test DB rather than mocked routes — a mock would prove nothing.
 *
 * Appointments are created through the same admin API the dashboard uses, then
 * their `bookingSource` (and, for bundle cases, their snapshots) are rewritten
 * directly in the DB. Driving the full customer-side marketplace booking flow
 * would test the booking flow rather than the ledger; what matters here is that
 * a marketplace-sourced, completed appointment produces the right rows.
 */

import { withTestDb } from './test-db'
import {
  createAppointment,
  type ApiSession,
} from './reconciliation-seed'

export interface Dac7ActivityRow {
  id: number
  dac7SellerId: number
  sourceBusinessId: number
  sourceAppointmentId: number
  itemIndex: number
  serviceId: number | null
  serviceName: string | null
  activityDate: string
  reportingYear: number
  reportingQuarter: number
  considerationMinor: number
  currency: string
  platformFeeMinor: number
  status: 'active' | 'voided'
  voidedAt: string | null
  voidedReason: string | null
}

export interface Dac7SellerRow {
  id: number
  sourceBusinessId: number
  reportingYear: number
  billingEntityType: string | null
  individualType: string | null
  legalName: string | null
  tradingName: string | null
  fiscalCode: string | null
  tinIssuingCountry: string | null
  registrationNumber: string | null
  dateOfBirth: string | null
  address: string | null
  countryCode: string | null
  ownerEmail: string | null
  sourceDeletedAt: string | null
}

// ────────────────────────────────────────────────────────────────────────────
// Reads
// ────────────────────────────────────────────────────────────────────────────

export async function activitiesForAppointment(
  appointmentId: number,
): Promise<Dac7ActivityRow[]> {
  return withTestDb(async (client) => {
    const res = await client.query(
      `SELECT * FROM dac7_activity WHERE "sourceAppointmentId" = $1 ORDER BY "itemIndex"`,
      [appointmentId],
    )
    return res.rows
  })
}

export async function sellerFor(
  businessId: number,
  reportingYear: number,
): Promise<Dac7SellerRow | null> {
  return withTestDb(async (client) => {
    const res = await client.query(
      `SELECT * FROM dac7_seller WHERE "sourceBusinessId" = $1 AND "reportingYear" = $2`,
      [businessId, reportingYear],
    )
    return res.rows[0] ?? null
  })
}

export async function appointmentExists(appointmentId: number): Promise<boolean> {
  return withTestDb(async (client) => {
    const res = await client.query(`SELECT 1 FROM appointment WHERE id = $1`, [
      appointmentId,
    ])
    return (res.rowCount ?? 0) > 0
  })
}

export async function activeConsiderationTotal(
  businessId: number,
): Promise<number> {
  return withTestDb(async (client) => {
    const res = await client.query(
      `SELECT COALESCE(SUM("considerationMinor"), 0)::int AS total
         FROM dac7_activity
        WHERE "sourceBusinessId" = $1 AND status = 'active'`,
      [businessId],
    )
    return Number(res.rows[0].total)
  })
}

/** Polls until the async DAC7 sync has landed (the hook is fire-and-forget). */
export async function waitForActivities(
  appointmentId: number,
  expectedCount: number,
  timeoutMs = 8000,
): Promise<Dac7ActivityRow[]> {
  const deadline = Date.now() + timeoutMs
  let rows: Dac7ActivityRow[] = []
  while (Date.now() < deadline) {
    rows = await activitiesForAppointment(appointmentId)
    if (rows.length === expectedCount) return rows
    await new Promise((r) => setTimeout(r, 150))
  }
  return rows
}

export async function waitForStatus(
  appointmentId: number,
  status: 'active' | 'voided',
  timeoutMs = 8000,
): Promise<Dac7ActivityRow[]> {
  const deadline = Date.now() + timeoutMs
  let rows: Dac7ActivityRow[] = []
  while (Date.now() < deadline) {
    rows = await activitiesForAppointment(appointmentId)
    if (rows.length > 0 && rows.every((r) => r.status === status)) return rows
    await new Promise((r) => setTimeout(r, 150))
  }
  return rows
}

// ────────────────────────────────────────────────────────────────────────────
// Writes
// ────────────────────────────────────────────────────────────────────────────

/** Rewrites an appointment's booking source, mimicking a customer-side booking. */
export async function setBookingSource(
  appointmentId: number,
  source: 'marketplace' | 'admin' | 'phone' | 'walk_in',
): Promise<void> {
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE appointment SET "bookingSource" = $1 WHERE id = $2`,
      [source, appointmentId],
    )
  })
}

/** Moves an appointment to a specific date, to exercise quarter derivation. */
export async function setScheduledDate(
  appointmentId: number,
  isoDate: string,
): Promise<void> {
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE appointment
          SET scheduled_at = $1::timestamptz,
              ends_at = $1::timestamptz + interval '30 minutes'
        WHERE id = $2`,
      [`${isoDate}T10:00:00Z`, appointmentId],
    )
  })
}

/**
 * Turns an appointment into a BUNDLE of the given services, with a total price
 * that may be lower than their sum — the discount case that makes
 * apportionment matter.
 */
export async function makeBundleAppointment(
  appointmentId: number,
  services: Array<{ serviceId: number; serviceName: string; price: number }>,
  totalPrice: number,
): Promise<void> {
  const snapshot = services.map((s, i) => ({
    serviceId: s.serviceId,
    serviceUuid: `svc-uuid-${i}`,
    serviceName: s.serviceName,
    duration: 30,
    price: s.price,
  }))
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE appointment
          SET "bookingType" = 'bundle',
              "bundleServicesSnapshot" = $1::jsonb,
              price = $2
        WHERE id = $3`,
      [JSON.stringify(snapshot), totalPrice, appointmentId],
    )
  })
}

/** Turns an appointment into a COMPOSITE run of services and/or bundles. */
export async function makeCompositeAppointment(
  appointmentId: number,
  items: Array<{
    type: 'service' | 'bundle'
    name: string
    price: number
    serviceId?: number
    bundleServices?: Array<{ serviceId: number; serviceName: string; price: number }>
  }>,
  totalPrice: number,
): Promise<void> {
  const snapshot = items.map((item, i) => ({
    type: item.type,
    serviceId: item.serviceId,
    name: item.name,
    description: null,
    duration: 30,
    price: item.price,
    startOffsetMinutes: i * 30,
    ...(item.bundleServices
      ? {
          bundleServices: item.bundleServices.map((s, j) => ({
            serviceId: s.serviceId,
            serviceUuid: `bsvc-${i}-${j}`,
            serviceName: s.serviceName,
            duration: 30,
            price: s.price,
          })),
        }
      : {}),
  }))
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE appointment
          SET "bookingType" = 'composite',
              "bookingItemsSnapshot" = $1::jsonb,
              price = $2
        WHERE id = $3`,
      [JSON.stringify(snapshot), totalPrice, appointmentId],
    )
  })
}

/** Fills in the billing identity the seller snapshot is copied from. */
export async function setBillingIdentity(
  businessId: number,
  identity: {
    billingEntityType?: 'company' | 'person'
    individualType?: 'pfa' | 'natural_person' | null
    legalName?: string
    fiscalCode?: string
    registrationNumber?: string
    billingAddress?: string
    billingCountryCode?: string
    dateOfBirth?: string | null
  },
): Promise<void> {
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE business
          SET "billingEntityType" = COALESCE($1, "billingEntityType"),
              "individualType" = $2,
              "legalName" = COALESCE($3, "legalName"),
              "fiscalCode" = COALESCE($4, "fiscalCode"),
              "registrationNumber" = COALESCE($5, "registrationNumber"),
              "billingAddress" = COALESCE($6, "billingAddress"),
              "billingCountryCode" = COALESCE($7, "billingCountryCode"),
              "dateOfBirth" = $8
        WHERE id = $9`,
      [
        identity.billingEntityType ?? null,
        identity.individualType ?? null,
        identity.legalName ?? null,
        identity.fiscalCode ?? null,
        identity.registrationNumber ?? null,
        identity.billingAddress ?? null,
        identity.billingCountryCode ?? null,
        identity.dateOfBirth ?? null,
        businessId,
      ],
    )
  })
}

export function authHeaders(session: ApiSession): Record<string, string> {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'x-csrf-token': session.csrfToken,
  }
}

/** Drives the real status-change endpoint, which is what fires the DAC7 hook. */
export async function setAppointmentStatus(
  session: ApiSession,
  appointmentId: number,
  status: 'completed' | 'confirmed' | 'cancelled' | 'no_show' | 'pending',
): Promise<void> {
  const res = await session.ctx.put(`/api/appointments/${appointmentId}`, {
    headers: authHeaders(session),
    data: { status },
  })
  if (!res.ok()) {
    throw new Error(
      `status update to ${status} failed: ${res.status()} ${await res.text()}`,
    )
  }
}

/** Creates a marketplace-sourced appointment ready to be completed. */
export async function createMarketplaceAppointment(
  session: ApiSession,
  args: {
    serviceId: number
    locationId: number
    customerId: number
    staffUserId: number
    hoursAhead?: number
  },
): Promise<{ id: number }> {
  const appt = await createAppointment(session, args)
  await setBookingSource(appt.id, 'marketplace')
  return { id: appt.id }
}
