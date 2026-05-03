import { expect, test } from '@playwright/test'
import { CalendarPage } from '../pages/CalendarPage'
import { mockCalendarDefaults, mockCreateBlock } from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Same scope caveat as calendar-create-appointment.spec.ts — full block CRUD
// (recurrence, all-day, scope=staff, edit, delete) needs real seeded staff
// and a real GET /calendar-blocks listing. These specs cover the open / fields
// / cancel surface; deeper assertions are gated on real-DB Class B.

test.describe('Calendar — blocks (UI surface)', () => {
  test('Block button opens the Create Block drawer', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.openBlockForm()

    // Drawer header — copy from en/calendar.json:
    //   page.blocks.create.blockTime = "Block time"
    await expect(page.getByText('Block time', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Cancel on the block drawer closes it without firing POST /calendar-blocks', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    const creates = await mockCreateBlock(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.openBlockForm()

    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click()

    // Drawer closed — no remaining "Block time" header.
    await expect(page.getByText('Block time', { exact: true })).toHaveCount(0, {
      timeout: 5_000,
    })
    expect(creates.requests.length).toBe(0)
  })

  test('block drawer exposes the expected sections (type, date & time, reason)', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.openBlockForm()

    // Section headings from en/calendar.json — page.blocks.create.*:
    //   type = "Type", dateTime = "Date & time", reason = "Reason"
    await expect(page.getByText('Type', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Date & time', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Reason', { exact: true }).first()).toBeVisible()
  })
})
