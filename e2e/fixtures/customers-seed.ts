/**
 * Seed helpers for the customers Playwright suite.
 *
 * Manual customers are created through the real API (same endpoint the
 * dashboard calls). The marketplace side of a duplicate pair is seeded with
 * direct SQL that mirrors exactly what the marketplace booking path writes
 * (appointments.service.ts step 11): a User row plus a business_customer row
 * with source='marketplace', both sides flagged 'duplicate_detected' and the
 * marketplace row pointing at the manual one via duplicateOfId. Driving the
 * real marketplace booking flow would require a published listing + customer
 * auth, which is out of scope for dashboard e2e.
 */

import { randomBytes, randomUUID } from 'node:crypto'
import { withTestDb } from './test-db'
import type { ApiSession } from './reconciliation-seed'

function authHeaders(session: ApiSession) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-CSRF-Token': session.csrfToken,
  }
}

export interface SeededManualCustomer {
  id: number
  firstName: string
  lastName: string
  email: string
}

export async function createManualCustomerViaApi(
  session: ApiSession,
  args: { firstName: string; lastName?: string; email?: string; phone?: string },
): Promise<SeededManualCustomer> {
  const res = await session.ctx.post('/api/business-customers/add-manually', {
    headers: authHeaders(session),
    data: {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone ?? '+40755555555',
    },
  })
  if (!res.ok()) {
    throw new Error(`add-manually failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return {
    id: body.id,
    firstName: args.firstName,
    lastName: args.lastName ?? '',
    email: args.email ?? '',
  }
}

export interface SeededMarketplaceCustomer {
  userId: number
  businessCustomerId: number
  firstName: string
  lastName: string
  email: string
}

/**
 * Insert the marketplace half of a duplicate pair, mirroring the booking
 * path's writes. When `flagDuplicateOfManualId` is provided, both rows are
 * flagged the way the booking flow flags them on conflict detection.
 */
export async function seedMarketplaceCustomer(args: {
  businessId: number
  email: string
  firstName: string
  lastName: string
  flagDuplicateOfManualId?: number
}): Promise<SeededMarketplaceCustomer> {
  return withTestDb(async (client) => {
    const userRes = await client.query<{ id: number }>(
      `INSERT INTO "user" (uuid, "firstName", "lastName", email, provider, "registeredVia", email_verified)
       VALUES ($1, $2, $3, $4, 'email', 'email', true)
       RETURNING id`,
      [randomUUID().replace(/-/g, '') + randomBytes(8).toString('hex'), args.firstName, args.lastName, args.email.toLowerCase()],
    )
    const userId = userRes.rows[0].id

    const flagged = args.flagDuplicateOfManualId != null
    const bcRes = await client.query<{ id: number }>(
      `INSERT INTO business_customer
         ("businessId", "userId", email, "firstName", "lastName", phone, source, "conflictStatus", "duplicateOfId")
       VALUES ($1, $2, $3, $4, $5, '+40799999999', 'marketplace', $6, $7)
       RETURNING id`,
      [
        args.businessId,
        userId,
        args.email.toLowerCase(),
        args.firstName,
        args.lastName,
        flagged ? 'duplicate_detected' : 'none',
        flagged ? args.flagDuplicateOfManualId : null,
      ],
    )

    if (flagged) {
      await client.query(
        `UPDATE business_customer
         SET "conflictStatus" = 'duplicate_detected', "duplicateNotified" = false
         WHERE id = $1`,
        [args.flagDuplicateOfManualId],
      )
    }

    return {
      userId,
      businessCustomerId: bcRes.rows[0].id,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email.toLowerCase(),
    }
  })
}

export interface BusinessCustomerRow {
  id: number
  email: string | null
  source: string
  status: string
  conflictStatus: string
  duplicateOfId: number | null
  mergedIntoCustomerId: number | null
}

export async function getBusinessCustomerRow(id: number): Promise<BusinessCustomerRow> {
  return withTestDb(async (client) => {
    const res = await client.query<BusinessCustomerRow>(
      `SELECT id, email, source, status,
              "conflictStatus", "duplicateOfId", "mergedIntoCustomerId"
       FROM business_customer WHERE id = $1`,
      [id],
    )
    if (res.rows.length === 0) {
      throw new Error(`business_customer ${id} not found`)
    }
    return res.rows[0]
  })
}

export async function businessCustomerExists(id: number): Promise<boolean> {
  return withTestDb(async (client) => {
    const res = await client.query(`SELECT 1 FROM business_customer WHERE id = $1`, [id])
    return (res.rowCount ?? 0) > 0
  })
}

/** POST /business-customers/remove/:id via the owner session. */
export async function removeCustomerViaApi(session: ApiSession, customerId: number): Promise<void> {
  const res = await session.ctx.post(`/api/business-customers/remove/${customerId}`, {
    headers: authHeaders(session),
  })
  if (!res.ok()) {
    throw new Error(`remove customer failed: ${res.status()} ${await res.text()}`)
  }
}
