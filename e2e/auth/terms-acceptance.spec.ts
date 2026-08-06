import { expect, test } from '@playwright/test'
import { RegisterPage } from '../pages/RegisterPage'
import { TeamInvitationPage } from '../pages/TeamInvitationPage'
import { makeTestUser, withApiContext } from '../fixtures/test-helpers'
import {
  createLocation,
  registerOwnerSession,
} from '../fixtures/reconciliation-seed'
import { rotateLatestInvitationToken, withTestDb } from '../fixtures/test-db'

/**
 * Every registration path stamps `user.termsAccepted` + `user.termsAcceptedAt`.
 *
 * The stamp is applied server-side when the account is created (the
 * registration UIs gate on a checkbox, so creating the account IS the
 * acceptance). Read the columns straight from the DB rather than trusting an
 * endpoint's 200.
 */

async function getTermsStamp(email: string): Promise<{
  termsAccepted: boolean
  termsAcceptedAt: Date | null
}> {
  return withTestDb(async (client) => {
    const res = await client.query<{
      termsAccepted: boolean
      termsAcceptedAt: Date | null
    }>(
      `SELECT "termsAccepted", "termsAcceptedAt" FROM "user" WHERE email = $1 LIMIT 1`,
      [email],
    )
    if (res.rows.length === 0) {
      throw new Error(`No user found with email ${email}`)
    }
    return res.rows[0]
  })
}

test.describe('Terms acceptance stamp', () => {
  test('dashboard email registration stamps the user row', async ({ page }) => {
    const user = makeTestUser()
    const register = new RegisterPage(page)
    await register.goto()
    await register.register(user)

    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })

    const stamp = await getTermsStamp(user.email)
    expect(stamp.termsAccepted).toBe(true)
    expect(stamp.termsAcceptedAt).toBeInstanceOf(Date)
  })

  test('marketplace email registration stamps the user row', async () => {
    const customer = makeTestUser({ firstName: 'Cust', lastName: 'Omer' })

    await withApiContext(async (ctx) => {
      const res = await ctx.post('/api/marketplace/auth/register', {
        data: {
          email: customer.email,
          password: customer.password,
          firstName: customer.firstName,
          lastName: customer.lastName,
          locale: 'en',
        },
      })
      if (!res.ok()) {
        throw new Error(
          `marketplace register failed: ${res.status()} ${await res.text()}`,
        )
      }
    })

    const stamp = await getTermsStamp(customer.email)
    expect(stamp.termsAccepted).toBe(true)
    expect(stamp.termsAcceptedAt).toBeInstanceOf(Date)
  })

  test('team invitation completion stamps the invitee', async ({ page }) => {
    const owner = await registerOwnerSession()
    const location = await createLocation(owner)
    const invitee = makeTestUser({ firstName: 'Tina', lastName: 'Member' })

    // Drive the completion through the real UI form (not the API seed helper)
    // so the stamp is verified on the path users actually take.
    const inviteRes = await owner.ctx.post('/api/auth/invite-team-member', {
      headers: {
        Authorization: `Bearer ${owner.accessToken}`,
        'X-CSRF-Token': owner.csrfToken,
      },
      data: { email: invitee.email, locationIds: [location.id] },
    })
    if (!inviteRes.ok()) {
      throw new Error(
        `invite-team-member failed: ${inviteRes.status()} ${await inviteRes.text()}`,
      )
    }
    const token = await rotateLatestInvitationToken(invitee.email)

    const invitePage = new TeamInvitationPage(page)
    await invitePage.goto(token)
    await expect(invitePage.submit).toBeVisible({ timeout: 15_000 })
    await invitePage.complete({
      firstName: invitee.firstName,
      lastName: invitee.lastName,
      phone: '+40712345678',
      password: invitee.password,
    })
    await expect(invitePage.completedTitle).toBeVisible({ timeout: 15_000 })

    const stamp = await getTermsStamp(invitee.email)
    expect(stamp.termsAccepted).toBe(true)
    expect(stamp.termsAcceptedAt).toBeInstanceOf(Date)

    // Owner registered via the API helper — stamped there too.
    const ownerStamp = await getTermsStamp(owner.user.email)
    expect(ownerStamp.termsAccepted).toBe(true)

    await owner.ctx.dispose()
  })
})
