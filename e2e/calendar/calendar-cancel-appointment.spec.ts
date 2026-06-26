import { expect, test } from '@playwright/test'
import { CalendarPage } from '../pages/CalendarPage'
import {
  mockCalendarDefaults,
  mockCancelAppointment,
  mockGetAppointmentDetail,
  sampleAppointment,
} from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Same scope caveat as calendar-create-appointment.spec.ts — these specs
// exercise the open-edit → click-cancel UI flow, capture the cancel POST when
// it fires (or assert it didn't), but don't assert deeper backend persistence
// (status flip → CANCELLED, snapshot kept, notification path) which needs
// real-DB Class B (see plan inconsistency #6).

test.describe('Calendar — cancel appointment (UI surface)', () => {
  test('Edit slider exposes the "Cancel appointment" action for a confirmed booking', async ({
    page,
    request,
  }) => {
    // Schedule a couple of hours into the future (still "today") so the booking is
    // not in the past — the Cancel CTA is gated on `!isBookingInPast`.
    const start = new Date(Date.now() + 2 * 60 * 60_000)
    const end = new Date(start.getTime() + 30 * 60_000)

    const appt = sampleAppointment({
      id: 5001,
      scheduledAt: start.toISOString(),
      endsAt: end.toISOString(),
      bookedItemName: 'Haircut',
      customerName: 'Andrei Sandu',
      staffUserIds: [201],
      status: 'confirmed',
    })

    await mockCalendarDefaults(page, { day: { appointments: [appt] } })
    await mockGetAppointmentDetail(page, appt)
    const cancels = await mockCancelAppointment(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Day')

    await page.getByText('Andrei Sandu', { exact: false }).first().click()
    // The card click opens the *details* slider — the cancel CTA lives there.
    await expect(page.getByText('Appointment details', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    })

    // The "Cancel appointment" affordance is a text button inside the details
    // slider. Its DOM type may be a plain element styled like a button so we
    // anchor on the visible text rather than role.
    await expect(page.getByText(/Cancel appointment/i).first()).toBeVisible({
      timeout: 10_000,
    })

    // Verifies that *just opening* the details slider does not accidentally
    // fire a cancel request — the user has to click "Cancel appointment" and
    // confirm first.
    expect(cancels.requests.length).toBe(0)
  })
})
