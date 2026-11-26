import { expect, test } from '@playwright/test'
import { makeTestUser } from '../fixtures/test-helpers'

/**
 * Completing the setup wizard succeeds and triggers the setup-complete email
 * (fire-and-forget; with EMAIL_SEND_ENABLED=false the API only logs the
 * attempt, so the email itself is checked in the API log, not here).
 */
test('a new owner completes the wizard through POST /wizard/complete', async ({ request }) => {
  const owner = makeTestUser()
  const reg = await request.post('/api/auth/register-business-owner', {
    data: { email: owner.email, password: owner.password, firstName: owner.firstName, lastName: owner.lastName },
  })
  expect(reg.ok()).toBeTruthy()
  const { accessToken } = await reg.json()

  const res = await request.post('/api/wizard/complete', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      wizardData: {
        businessInfo: {
          name: `Studio ${owner.lastName}`,
          industryId: 1,
          phone: '+40712345678',
          email: owner.email,
          timezone: 'Europe/Bucharest',
          countryCode: 'RO',
          businessCurrency: 'ron',
        },
        location: {
          name: 'Main',
          phone: '+40712345678',
          email: owner.email,
          address: 'Strada Lalelelor 1, Bucuresti',
          timezone: 'Europe/Bucharest',
          workingHours: Object.fromEntries(
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [
              d,
              { open: '09:00', close: '17:00', isOpen: d !== 'sunday' },
            ]),
          ),
        },
        teamMembers: [],
        worksSolo: true,
      },
    },
  })
  expect(res.status(), await res.text()).toBe(201)
  expect((await res.json()).wizardCompleted).toBe(true)
  console.log(`[e2e] wizard completed for ${owner.email}`)
})
