import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'

const { Client } = pg

// Connection details mirror admin-api/.env.test (test DB on port 5433).
const TEST_DB_CONFIG = {
  host: 'localhost',
  port: 5433,
  user: 'zavoia_user',
  password: 'zavoia_password',
  database: 'zavoia_test_db',
}

export async function withTestDb<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new Client(TEST_DB_CONFIG)
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

/**
 * After `POST /api/auth/invite-team-member` runs, the verification_token row
 * stores a hash of the invitation token that only the email knew. Tests can't
 * read the email, so we rotate the hash to a token we generated ourselves and
 * return the plain token to the caller — it then completes the invitation via
 * `POST /api/auth/complete-team-invitation`.
 *
 * Mirrors `generateInvitationToken()` in admin-api/src/utils/utilFunctions.ts.
 */
export async function rotateLatestInvitationToken(email: string): Promise<string> {
  const plainToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(plainToken).digest('hex')

  await withTestDb(async (client) => {
    const res = await client.query(
      `UPDATE verification_token
         SET token = $1
       WHERE id = (
         SELECT vt.id
           FROM verification_token vt
           JOIN "user" u ON u.id = vt."userId"
          WHERE u.email = $2
            AND vt.type = 'TEAM_INVITATION'
            AND vt.used = false
          ORDER BY vt."createdAt" DESC
          LIMIT 1
       )`,
      [tokenHash, email],
    )
    if (res.rowCount === 0) {
      throw new Error(
        `No active TEAM_INVITATION token found for ${email} — invite-team-member API may have failed.`,
      )
    }
  })

  return plainToken
}

export async function getUserIdByEmail(email: string): Promise<number> {
  return withTestDb(async (client) => {
    const res = await client.query<{ id: number }>(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
      [email],
    )
    if (res.rows.length === 0) {
      throw new Error(`No user found with email ${email}`)
    }
    return res.rows[0].id
  })
}

export async function getAppointmentStatus(appointmentId: number): Promise<{
  status: string
  staffUserIds: number[]
}> {
  return withTestDb(async (client) => {
    const apt = await client.query<{ status: string }>(
      `SELECT status FROM appointment WHERE id = $1 LIMIT 1`,
      [appointmentId],
    )
    if (apt.rows.length === 0) {
      throw new Error(`Appointment ${appointmentId} not found`)
    }
    const staff = await client.query<{ user_id: number }>(
      `SELECT user_id FROM appointment_staff_users WHERE appointment_id = $1`,
      [appointmentId],
    )
    return {
      status: apt.rows[0].status,
      staffUserIds: staff.rows.map((r) => r.user_id),
    }
  })
}

export async function getUserBusinessRoles(userId: number): Promise<
  Array<{ businessId: number | null; role: string; status: string }>
> {
  return withTestDb(async (client) => {
    const res = await client.query<{
      businessId: number | null
      role: string
      status: string
    }>(
      `SELECT "businessId", role, status FROM user_role_entity WHERE "userId" = $1`,
      [userId],
    )
    return res.rows
  })
}

/**
 * After register-business-owner, the new owner has `wizardCompleted=false`,
 * which makes the FE redirect to /setup-wizard. The real wizard is not relevant
 * to reconciliation — flip the flag directly so tests land on `/`.
 */
export async function markWizardComplete(userId: number): Promise<void> {
  await withTestDb(async (client) => {
    await client.query(
      `UPDATE "user" SET "wizardCompleted" = true WHERE id = $1`,
      [userId],
    )
  })
}

/**
 * `register-business-owner` only creates the user, the BusinessOwner row, and
 * a UserRole(OWNER, businessId=null). The business itself is created by the
 * setup wizard. Tests don't go through the wizard — they need a Business with
 * the owner attached so subsequent calls (locations, services, …) work and
 * `/api/auth/me` returns a real `businessId`.
 *
 * Inserts the minimum-viable Business, links it to the BusinessOwner, sets the
 * owner's UserRole.businessId, and flips wizardCompleted=true. Returns the new
 * business id so callers can re-login to mint a JWT with the business in scope.
 */
export async function bootstrapBusinessForOwner(userId: number): Promise<number> {
  return withTestDb(async (client) => {
    // Ensure a BASE plan exists — billing.service requires it to render
    // /billing/subscription-summary, which the seat_overflow gate depends on
    // for `dataReady`. Plans are not seeded by the truncate-and-migrate flow,
    // so the first call inserts one.
    let planId: number | null = null
    const existingPlan = await client.query<{ id: number }>(
      `SELECT id FROM plan WHERE tier = 'BASE' LIMIT 1`,
    )
    if (existingPlan.rows[0]) {
      planId = existingPlan.rows[0].id
    } else {
      const planInsert = await client.query<{ id: number }>(
        `INSERT INTO plan (name, tier, "maxLocations", "maxTeamMembers")
         VALUES ('Base', 'BASE', 5, 10)
         RETURNING id`,
      )
      planId = planInsert.rows[0].id
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    const insertRes = await client.query<{ id: number }>(
      `INSERT INTO business (uuid, name, timezone, phone, "countryCode", "businessCurrency", "trialEndsAt", "planId", "isActive", "paidTeamSeats")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 10)
       RETURNING id`,
      [
        randomBytes(16).toString('hex'),
        'E2E Test Salon',
        'Europe/Bucharest',
        '+40700000000',
        'ro',
        'ron',
        trialEndsAt,
        planId,
      ],
    )
    const businessId = insertRes.rows[0].id

    await client.query(
      `UPDATE business_owner SET "businessId" = $1, "wizardCompleted" = true WHERE "userId" = $2`,
      [businessId, userId],
    )
    await client.query(
      `UPDATE user_role_entity SET "businessId" = $1 WHERE "userId" = $2 AND role = 'owner'`,
      [businessId, userId],
    )
    await client.query(
      `UPDATE "user" SET "wizardCompleted" = true WHERE id = $1`,
      [userId],
    )
    return businessId
  })
}

export async function isUserAssignedToLocation(
  userId: number,
  locationId: number,
): Promise<boolean> {
  return withTestDb(async (client) => {
    const res = await client.query(
      `SELECT 1 FROM user_x_location
        WHERE user_id = $1 AND location_id = $2 LIMIT 1`,
      [userId, locationId],
    )
    return res.rowCount !== null && res.rowCount > 0
  })
}
