/**
 * Edge-case tests that the real backend can't reproduce reliably:
 *  - Orphaned appointments (no eligible reassignment target).
 *  - Commit failing with 500.
 *
 * Real owner + team + appointment are seeded, but the preview/commit endpoints
 * are stubbed via `page.route` so we can inject the orphan flag and the failure.
 */
import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ReconciliationModal } from '../pages/ReconciliationModal'
import { seedRemoveMemberFixture } from '../fixtures/reconciliation-seed'
import { markWizardComplete } from '../fixtures/test-db'

test.describe('Reconciliation — stubbed edge cases', () => {
  test('orphan banner shows and primary commits cancel-only', async ({ page }) => {
    const seed = await seedRemoveMemberFixture()
    await markWizardComplete(seed.owner.userId)

    const customerName = `${seed.customer.firstName} ${seed.customer.lastName}`

    // Force the offboard preview to mark our real appointment as orphaned.
    await page.route(
      new RegExp(`/api/team-members/${seed.member.userId}/offboard-preview$`),
      async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            appointments: [
              {
                id: seed.appointment.id,
                scheduledAt: seed.appointment.scheduledAt,
                endsAt: seed.appointment.endsAt,
                status: 'confirmed',
                customer: {
                  firstName: seed.customer.firstName,
                  lastName: seed.customer.lastName,
                  email: '',
                },
                service: { id: seed.service.id, name: seed.service.name },
                location: { id: seed.location.id, name: seed.location.name },
                staffUserIds: [seed.member.userId],
              },
            ],
            eligibleStaffMap: { [seed.appointment.id]: [] },
            orphanedAppointmentIds: [seed.appointment.id],
          }),
        })
      },
    )
    // Same body for the bulk-preview path — the gate may use either.
    await page.route(/\/api\/team-members\/offboard-preview$/, async (route) => {
      const req = route.request()
      if (req.method() !== 'POST') return route.continue()
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          appointments: [
            {
              id: seed.appointment.id,
              scheduledAt: seed.appointment.scheduledAt,
              endsAt: seed.appointment.endsAt,
              status: 'confirmed',
              customer: {
                firstName: seed.customer.firstName,
                lastName: seed.customer.lastName,
                email: '',
              },
              service: { id: seed.service.id, name: seed.service.name },
              location: { id: seed.location.id, name: seed.location.name },
              staffUserIds: [seed.member.userId],
            },
          ],
          eligibleStaffMap: { [seed.appointment.id]: [] },
          orphanedAppointmentIds: [seed.appointment.id],
        }),
      })
    })

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
    await page.goto('/team-members')

    await page
      .getByText(`${seed.member.user.firstName} ${seed.member.user.lastName}`)
      .first()
      .click()
    await page.getByRole('button', { name: /Remove from organisation/i }).click()
    await page.getByRole('button', { name: /^Delete team member$/i }).click()

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('remove_member')
    await modal.expectAppointmentRow(customerName)
    await expect(modal.orphanBanner()).toBeVisible({ timeout: 15_000 })

    // Orphan auto-resolves to "cancel" → primary should be enabled out of the gate.
    await modal.expectPrimaryEnabled()
    await modal.clickPrimary()
    await modal.expectClosed()
  })

  test('commit error keeps the modal open and surfaces a failure toast', async ({ page }) => {
    const seed = await seedRemoveMemberFixture()
    await markWizardComplete(seed.owner.userId)

    // Stub the commit endpoint to fail. Both endpoints (single and bulk) — the
    // gate uses bulk for non-unassign offboards.
    await page.route(/\/api\/team-members\/offboard$/, async (route) => {
      const req = route.request()
      if (req.method() !== 'POST') return route.continue()
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Boom' }),
      })
    })

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
    await page.goto('/team-members')

    await page
      .getByText(`${seed.member.user.firstName} ${seed.member.user.lastName}`)
      .first()
      .click()
    await page.getByRole('button', { name: /Remove from organisation/i }).click()
    await page.getByRole('button', { name: /^Delete team member$/i }).click()

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('remove_member')
    const customerName = `${seed.customer.firstName} ${seed.customer.lastName}`
    await modal.reassignAppointment(customerName, seed.cover.user.firstName)
    await modal.clickPrimary()

    // Toast surfaces and modal stays open.
    await expect(page.getByText(/Couldn't|Boom|failed|error/i).first()).toBeVisible({
      timeout: 15_000,
    })
    await modal.expectVisible('remove_member')
  })
})
