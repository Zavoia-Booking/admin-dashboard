import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ReconciliationModal } from '../pages/ReconciliationModal'
import { seedRemoveMemberFixture } from '../fixtures/reconciliation-seed'
import {
  getAppointmentStatus,
  getUserBusinessRoles,
  markWizardComplete,
} from '../fixtures/test-db'

test.describe('Reconciliation — remove member from organisation', () => {
  test('removes a member with no upcoming appointments without opening the modal', async ({ page }) => {
    const seed = await seedRemoveMemberFixture()
    await markWizardComplete(seed.owner.userId)

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
    await page.goto('/team-members')

    // `cover` has no appointments — clicking remove should skip the modal
    // and call the single-user offboard endpoint directly.
    const card = page.getByText(`${seed.cover.user.firstName} ${seed.cover.user.lastName}`).first()
    await expect(card).toBeVisible({ timeout: 15_000 })
    await card.click()

    await page.getByRole('button', { name: /Remove from organisation/i }).click()
    await page.getByRole('button', { name: /^Delete team member$/i }).click()

    const modal = new ReconciliationModal(page)
    await modal.expectClosed()

    await expect(page.getByText(/team member.*removed|removed.*team member/i).first()).toBeVisible({
      timeout: 15_000,
    })

    // After offboard, the user no longer holds a TEAM_MEMBER role for this business.
    const roles = await getUserBusinessRoles(seed.cover.userId)
    const teamRoleForBiz = roles.find(
      (r) => r.businessId === seed.owner.businessId && r.role === 'team_member',
    )
    expect(teamRoleForBiz).toBeUndefined()
  })

  test('removes a member with appointments — reassign path commits and updates the appointment', async ({ page }) => {
    const seed = await seedRemoveMemberFixture()
    await markWizardComplete(seed.owner.userId)

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
    await page.goto('/team-members')

    const memberFullName = `${seed.member.user.firstName} ${seed.member.user.lastName}`
    await page.getByText(memberFullName).first().click()
    await page.getByRole('button', { name: /Remove from organisation/i }).click()
    await page.getByRole('button', { name: /^Delete team member$/i }).click()

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('remove_member')

    const customerName = `${seed.customer.firstName} ${seed.customer.lastName}`
    await modal.expectAppointmentRow(customerName)
    await modal.expectPrimaryDisabled()

    await modal.reassignAppointment(customerName, seed.cover.user.firstName)
    await modal.expectPrimaryEnabled()
    await modal.clickPrimary()
    await modal.expectClosed()

    await expect.poll(
      async () => (await getAppointmentStatus(seed.appointment.id)).staffUserIds,
      { timeout: 15_000 },
    ).toEqual([seed.cover.userId])

    const roles = await getUserBusinessRoles(seed.member.userId)
    expect(
      roles.find((r) => r.businessId === seed.owner.businessId && r.role === 'team_member'),
    ).toBeUndefined()
  })

  test('cancel path commits and marks the appointment cancelled', async ({ page }) => {
    const seed = await seedRemoveMemberFixture()
    await markWizardComplete(seed.owner.userId)

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
    await page.goto('/team-members')

    const memberFullName = `${seed.member.user.firstName} ${seed.member.user.lastName}`
    await page.getByText(memberFullName).first().click()
    await page.getByRole('button', { name: /Remove from organisation/i }).click()
    await page.getByRole('button', { name: /^Delete team member$/i }).click()

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('remove_member')
    await modal.cancelAppointment(`${seed.customer.firstName} ${seed.customer.lastName}`)
    await modal.expectPrimaryEnabled()
    await modal.clickPrimary()
    await modal.expectClosed()

    await expect.poll(
      async () => (await getAppointmentStatus(seed.appointment.id)).status,
      { timeout: 15_000 },
    ).toMatch(/cancel/i)
  })

  test('keeps the primary action disabled while any appointment is undecided', async ({ page }) => {
    const seed = await seedRemoveMemberFixture()
    await markWizardComplete(seed.owner.userId)

    await new LoginPage(page).goto()
    await new LoginPage(page).login(seed.owner.user.email, seed.owner.user.password)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
    await page.goto('/team-members')

    const memberFullName = `${seed.member.user.firstName} ${seed.member.user.lastName}`
    await page.getByText(memberFullName).first().click()
    await page.getByRole('button', { name: /Remove from organisation/i }).click()
    await page.getByRole('button', { name: /^Delete team member$/i }).click()

    const modal = new ReconciliationModal(page)
    await modal.expectVisible('remove_member')
    await modal.expectAppointmentRow(`${seed.customer.firstName} ${seed.customer.lastName}`)
    await modal.expectPrimaryDisabled()
  })
})
