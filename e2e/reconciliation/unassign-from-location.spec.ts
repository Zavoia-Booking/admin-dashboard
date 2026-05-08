import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ReconciliationModal } from '../pages/ReconciliationModal'
import { seedUnassignFixture } from '../fixtures/reconciliation-seed'
import {
  getAppointmentStatus,
  getUserBusinessRoles,
  isUserAssignedToLocation,
  markWizardComplete,
} from '../fixtures/test-db'

test.describe('Reconciliation — unassign from location', () => {
  test('toggles a member off a location with no appointments without opening the modal', async ({ page }) => {
    const seed = await seedUnassignFixture()
    await markWizardComplete(seed.owner.userId)

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    // The OTHER location has no appointments — toggle `cover` off there.
    await page.goto(`/assignments?locationId=${seed.otherLocation.id}`)
    const switchBtn = page.getByRole('switch', {
      name: new RegExp(`Remove ${seed.cover.user.firstName} from location`, 'i'),
    })
    await expect(switchBtn).toBeVisible({ timeout: 15_000 })
    await switchBtn.click()

    const modal = new ReconciliationModal(page)
    await modal.expectClosed()

    await expect.poll(
      () => isUserAssignedToLocation(seed.cover.userId, seed.otherLocation.id),
      { timeout: 15_000 },
    ).toBe(false)
    // Cover is still assigned to the original location.
    expect(await isUserAssignedToLocation(seed.cover.userId, seed.location.id)).toBe(true)
  })

  test('toggles a member off a location WITH appointments — reassign path commits', async ({ page }) => {
    const seed = await seedUnassignFixture()
    await markWizardComplete(seed.owner.userId)

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    await page.goto(`/assignments?locationId=${seed.location.id}`)
    const switchBtn = page.getByRole('switch', {
      name: new RegExp(`Remove ${seed.member.user.firstName} from location`, 'i'),
    })
    await expect(switchBtn).toBeVisible({ timeout: 15_000 })
    await switchBtn.click()

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('unassign_from_location')
    const customerName = `${seed.customer.firstName} ${seed.customer.lastName}`
    await modal.expectAppointmentRow(customerName)
    await modal.reassignAppointment(customerName, seed.cover.user.firstName)
    await modal.expectPrimaryEnabled()
    await modal.clickPrimary()
    await modal.expectClosed()

    // Member no longer at the targeted location, but still at the other one and
    // still a TEAM_MEMBER of the business.
    await expect.poll(
      () => isUserAssignedToLocation(seed.member.userId, seed.location.id),
      { timeout: 15_000 },
    ).toBe(false)
    expect(await isUserAssignedToLocation(seed.member.userId, seed.otherLocation.id)).toBe(true)
    const roles = await getUserBusinessRoles(seed.member.userId)
    expect(
      roles.find(
        (r) =>
          r.businessId === seed.owner.businessId &&
          r.role === 'team_member' &&
          r.status === 'active',
      ),
    ).toBeDefined()

    // Appointment was reassigned to the cover member.
    await expect.poll(
      async () => (await getAppointmentStatus(seed.appointment.id)).staffUserIds,
      { timeout: 15_000 },
    ).toEqual([seed.cover.userId])
  })

  test('bulk-cancel commits and member is removed only from the selected location', async ({ page }) => {
    const seed = await seedUnassignFixture()
    await markWizardComplete(seed.owner.userId)

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    await page.goto(`/assignments?locationId=${seed.location.id}`)
    await page.getByRole('switch', {
      name: new RegExp(`Remove ${seed.member.user.firstName} from location`, 'i'),
    }).click()

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('unassign_from_location')
    await modal.bulkCancelAll()
    await modal.expectPrimaryEnabled()
    await modal.clickPrimary()
    await modal.expectClosed()

    await expect.poll(
      async () => (await getAppointmentStatus(seed.appointment.id)).status,
      { timeout: 15_000 },
    ).toMatch(/cancel/i)

    // Still TEAM_MEMBER, still at the other location.
    expect(await isUserAssignedToLocation(seed.member.userId, seed.otherLocation.id)).toBe(true)
    expect(await isUserAssignedToLocation(seed.member.userId, seed.location.id)).toBe(false)
  })
})
