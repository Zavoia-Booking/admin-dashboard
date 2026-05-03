import { expect, test } from '@playwright/test'
import { CalendarPage } from '../pages/CalendarPage'
import { mockCalendarDefaults, mockCreateAppointment } from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Note on coverage scope: AddAppointmentSlider is a 1.9k-line form with deeply
// dynamic field rendering (service picker, bundle picker, staff dropdown, date
// picker, dynamic time-slot grid). Driving the full form to a successful
// `POST /appointments/admin-create-group` requires a real seeded business
// (location-context with services + staff, available time-slots returned by
// /calendar/available-slots). Without true real-DB seeding, even mocked
// available-slots hit a wall when the date picker is asked to render
// against the live `selectedDate`.
//
// What these specs DO cover today:
//   - The "Add Event" button opens the slider with the right title.
//   - The slider's Cancel button closes it without sending any request.
//   - Section headings render (servicesAndBundles, dateAndTime, bookingSource, notes).
//
// What they DO NOT cover yet (gated on real-DB Class B seeding):
//   - Filling customer + service + staff + time and submitting → POST payload.
//   - Out-of-hours override flow (confirm dialog → re-submit with overrideConflicts).
//   - Bundle / multi-service group creation.

test.describe('Calendar — create appointment (UI surface)', () => {
  test('Add Event button opens the New Appointment slider', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.openAddForm()

    // Slider header text — copy from en/calendar.json:
    //   page.appointments.add.newAppointment = "New Appointment"
    await expect(page.getByText('New Appointment', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Cancel button on the slider closes it without firing /appointments/admin-create-group', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    const create = await mockCreateAppointment(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.openAddForm()

    // The slider's footer Cancel button — `add.cancel = "Cancel"` in en/calendar.json.
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click()

    // Slider is gone (no role=dialog with the New Appointment title remaining).
    await expect(calendar.addSlider).toHaveCount(0, { timeout: 5_000 })

    // No create request should have fired.
    expect(create.requests.length).toBe(0)
  })

  test('slider exposes the expected sections (services, date & time, booking source, notes)', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.openAddForm()

    // Section headings (these come from en/calendar.json — page.appointments.add.*):
    await expect(page.getByText('Services & Bundles', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('Date & Time', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Booking Source', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/^Notes/i).first()).toBeVisible()
  })
})
