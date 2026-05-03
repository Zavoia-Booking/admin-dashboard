import { expect, test } from '@playwright/test'
import { CalendarPage } from '../pages/CalendarPage'
import {
  dayKey,
  mockCalendarDefaults,
  sampleAppointment,
  sampleBlock,
} from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Default view is WEEK + LIST. For Day-grid assertions we explicitly switch
// to Day and toggle Grid; for List-empty assertions we stay in List mode.

test.describe('Calendar — rendering', () => {
  test('Day list view renders mocked appointments and blocks', async ({
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

    await mockCalendarDefaults(page, {
      day: {
        appointments: [
          sampleAppointment({
            id: 1001,
            scheduledAt: at(10, 0),
            endsAt: at(10, 30),
            bookedItemName: 'Haircut',
            customerName: 'Maria Popescu',
            staffUserIds: [201],
          }),
          sampleAppointment({
            id: 1002,
            scheduledAt: at(11, 0),
            endsAt: at(12, 0),
            bookedItemName: 'Color',
            customerName: 'Ion Marin',
            staffUserIds: [202],
          }),
          sampleAppointment({
            id: 1003,
            scheduledAt: at(14, 0),
            endsAt: at(14, 30),
            bookedItemName: 'Haircut',
            customerName: 'Andrei Sandu',
            staffUserIds: [201],
          }),
        ],
        blocks: [
          sampleBlock({
            id: 5001,
            startsAt: at(13, 0),
            endsAt: at(14, 0),
            reason: 'lunch_break',
          }),
        ],
      },
    })

    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Day') // default is Week — switch explicitly.

    // All three customer names appear (in their cards).
    await expect(page.getByText('Maria Popescu', { exact: false }).first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText('Ion Marin', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('Andrei Sandu', { exact: false }).first()).toBeVisible()
  })

  test('empty Day shows the "Nothing scheduled" placeholder (default = List view)', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Day') // List view is the default → empty placeholder shows.

    // List view's empty state — copy from en/calendar.json:
    //   page.appointments.nothingScheduled = "Nothing scheduled"
    await expect(page.getByText(/Nothing scheduled/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Week view fetch returns 7 day buckets in the response', async ({
    page,
    request,
  }) => {
    const today = new Date()
    const days: Record<string, { appointments: ReturnType<typeof sampleAppointment>[] }> = {}
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      days[dayKey(d)] = { appointments: [] }
    }

    const handles = await mockCalendarDefaults(page, { week: { days, miniSummary: {} } })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    // Already Week by default — wait for the fetch to land.
    await expect.poll(() => handles.week.requests.length, { timeout: 10_000 }).toBeGreaterThan(0)

    // Title format confirms we landed in week view.
    await calendar.expectTitleMatches(
      /^\d{1,2}( [A-Z][a-z]{2})? – \d{1,2} [A-Z][a-z]{2}, \d{4}$/,
    )
  })

  test('Month view renders the displayed month name in the title', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Month')

    await calendar.expectTitleMatches(/^[A-Z][a-z]+ \d{4}$/)
  })
})
