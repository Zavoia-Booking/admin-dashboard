/**
 * Seat-overflow reconciliation — the exact "5 team members but paid for 4,
 * new billing period arrives" scenario, with screenshots of both resolution
 * paths (remove a member vs. pay for the extra seat).
 *
 * The team is real (owner + 4 invited members = 5 used seats, one member has
 * an upcoming appointment). Only /auth/me + /billing/subscription-summary are
 * mocked to fake the post-renewal state (paidTeamSeats: 4) — reproducing it
 * for real would need a Stripe test-clock skip.
 *
 * Deep functional coverage of this modal lives in
 * e2e/reconciliation/seat-overflow.spec.ts; this file pins the user-facing
 * 5-vs-4 story and captures the screens.
 */

import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import {
  assignMembersAtLocation,
  inviteAndAcceptTeamMember,
  mockAuthMeForOwner,
  seedSeatOverflowFixture,
  type SeatOverflowSeed,
} from '../fixtures/reconciliation-seed'
import { getAppointmentStatus, markWizardComplete } from '../fixtures/test-db'
import { LoginPage } from '../pages/LoginPage'
import { ReconciliationModal } from '../pages/ReconciliationModal'

const SCREENSHOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'e2e-screenshots')
mkdirSync(SCREENSHOT_DIR, { recursive: true })

const shot = (page: Page, name: string) =>
  page.screenshot({ path: resolve(SCREENSHOT_DIR, `${name}.png`), fullPage: false })

interface FiveSeatSeed extends SeatOverflowSeed {
  extraMemberFirstName: string
}

/** Owner + 4 real members = 5 used seats; plan pays for 4 → overflow by 1. */
async function seedFiveMembersPaidFour(): Promise<FiveSeatSeed> {
  const seed = await seedSeatOverflowFixture() // owner + 3 members
  const extra = await inviteAndAcceptTeamMember(seed.owner, {
    locationIds: [seed.location.id],
    firstName: 'Enna',
  })
  await assignMembersAtLocation(seed.owner, {
    locationId: seed.location.id,
    serviceId: seed.service.id,
    userIds: [extra.userId],
  })
  await markWizardComplete(seed.owner.userId)
  return { ...seed, extraMemberFirstName: extra.user.firstName }
}

async function loginAndExpectModal(page: Page, seed: FiveSeatSeed): Promise<ReconciliationModal> {
  await mockAuthMeForOwner(page, seed.owner, {
    status: 'active',
    paidTeamSeats: 4,
    usedSeats: 5,
  })
  const login = new LoginPage(page)
  await login.goto()
  await login.login(seed.owner.user.email, seed.owner.user.password)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))

  const modal = new ReconciliationModal(page)
  await modal.expectVisible('seat_overflow')
  return modal
}

test.describe('seat overflow 5-vs-4 — desktop', () => {
  test('auto-opens after login, defers on billing, reopens elsewhere', async ({ page }) => {
    const seed = await seedFiveMembersPaidFour()
    const modal = await loginAndExpectModal(page, seed)
    await shot(page, 'recon-overflow-modal-desktop')

    // Deferred on the billing route so the owner can actually buy seats…
    await page.goto('/account?tab=billing')
    await modal.expectClosed()
    await shot(page, 'recon-overflow-deferred-on-billing')

    // …and re-engages as soon as they navigate anywhere else.
    await page.goto('/team-members')
    await modal.expectVisible('seat_overflow')
  })

  test('path A: removing one member (with appointment reassignment) resolves the overflow', async ({ page }) => {
    const seed = await seedFiveMembersPaidFour()
    const modal = await loginAndExpectModal(page, seed)

    // The member being offboarded has an upcoming appointment — the modal
    // must force a decision (reassign or cancel) before committing.
    await modal.selectMember(seed.primaryMember.user.firstName)
    const customerName = `${seed.customer.firstName} ${seed.customer.lastName}`
    await modal.expectAppointmentRow(customerName)
    await shot(page, 'recon-overflow-member-selected-appointments')

    await modal.reassignAppointment(customerName, seed.cover.user.firstName)
    await modal.expectPrimaryEnabled()
    await shot(page, 'recon-overflow-ready-to-commit')
    await modal.clickPrimary()

    // Backend really reassigned the appointment to the covering member…
    await expect
      .poll(async () => (await getAppointmentStatus(seed.appointment.id)).staffUserIds, {
        timeout: 15_000,
      })
      .toEqual([seed.cover.userId])
    // …and the offboarded member is gone from the member list.
    await expect(
      page.getByRole('button', {
        name: new RegExp(`^${seed.primaryMember.user.firstName}\\b`, 'i'),
      }),
    ).toHaveCount(0, { timeout: 15_000 })
    await shot(page, 'recon-overflow-after-removal')
  })

  test('path B: "Pay for extra seats" routes to billing with the modal closed', async ({ page }) => {
    const seed = await seedFiveMembersPaidFour()
    const modal = await loginAndExpectModal(page, seed)

    await modal.payForSeatsButton().click()
    await page.waitForURL(/\/account\?tab=billing/)
    await modal.expectClosed()
    await shot(page, 'recon-overflow-pay-landed-on-billing')
  })
})

test.describe('seat overflow 5-vs-4 — mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('modal renders correctly on mobile', async ({ page }) => {
    const seed = await seedFiveMembersPaidFour()
    const modal = await loginAndExpectModal(page, seed)
    await shot(page, 'recon-overflow-modal-mobile')

    await modal.selectMember(seed.primaryMember.user.firstName)
    await modal.expectAppointmentRow(`${seed.customer.firstName} ${seed.customer.lastName}`)
    await shot(page, 'recon-overflow-member-selected-mobile')
  })
})
