import { expect, test } from '@playwright/test'
import { CalendarPage } from '../pages/CalendarPage'
import {
  mockCalendarDefaults,
  mockGetAppointmentDetail,
  mockUpdateAppointment,
  sampleAppointment,
} from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Same scope caveat as calendar-create-appointment.spec.ts: full status-change /
// reassign-staff round-trips need a real seeded business so the slider's
// dropdowns hydrate from real /location-context data. These specs cover the
// open / read-only / cancel-without-fire surface; the deeper mutations are
// gated on real-DB Class B (see plan inconsistency #6).

test.describe('Calendar — edit appointment (UI surface)', () => {
  test('clicking an appointment card opens the Appointment details slider', async ({
    page,
    request,
  }) => {
    const today = new Date()
    today.setHours(10, 0, 0, 0)
    const at = (h: number, m: number) => {
      const d = new Date(today)
      d.setHours(h, m, 0, 0)
      return d.toISOString()
    }

    const appt = sampleAppointment({
      id: 4001,
      scheduledAt: at(10, 0),
      endsAt: at(10, 30),
      bookedItemName: 'Haircut',
      customerName: 'Maria Popescu',
      staffUserIds: [201],
      status: 'confirmed',
    })

    await mockCalendarDefaults(page, { day: { appointments: [appt] } })
    await mockGetAppointmentDetail(page, appt)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Day') // List view by default — appointments render as cards.

    // Click the customer name (most stable on-card text).
    await page.getByText('Maria Popescu', { exact: false }).first().click()

    // The card click opens a *details* slider first (en/calendar.json:
    //   page.appointments.edit.appointmentDetails = "Appointment details").
    // From here the user clicks "Edit" to enter the editable form.
    await expect(page.getByText('Appointment details', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    })

    // The status pill at the top reflects the appointment status.
    await expect(page.getByText(/Confirmed/i).first()).toBeVisible()
  })

  test('clicking Edit on the details slider transitions to the Edit Appointment form', async ({
    page,
    request,
  }) => {
    const today = new Date()
    today.setHours(11, 0, 0, 0)
    const at = (h: number, m: number) => {
      const d = new Date(today)
      d.setHours(h, m, 0, 0)
      return d.toISOString()
    }

    const appt = sampleAppointment({
      id: 4002,
      scheduledAt: at(11, 0),
      endsAt: at(11, 30),
      bookedItemName: 'Color',
      customerName: 'Ion Marin',
      staffUserIds: [202],
      status: 'confirmed',
    })

    await mockCalendarDefaults(page, { day: { appointments: [appt] } })
    await mockGetAppointmentDetail(page, appt)
    const updates = await mockUpdateAppointment(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Day')

    await page.getByText('Ion Marin', { exact: false }).first().click()
    await expect(page.getByText('Appointment details', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    })

    // The Edit affordance in the details slider is an icon-button labeled "Edit".
    await page.getByRole('button', { name: 'Edit', exact: true }).first().click()

    await expect(page.getByText('Edit Appointment', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    })

    // Closing the edit form via Cancel — no PUT should fire.
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click()
    await expect(page.getByText('Edit Appointment', { exact: true })).toHaveCount(0, {
      timeout: 5_000,
    })
    expect(updates.requests.length).toBe(0)
  })
})
