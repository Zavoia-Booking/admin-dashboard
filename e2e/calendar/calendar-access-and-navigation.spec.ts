import { expect, test } from '@playwright/test'
import { CalendarPage } from '../pages/CalendarPage'
import { mockCalendarDefaults, postBody } from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Defaults from src/features/calendar/calendarPreferences.ts:
//   defaultViewMode = WEEK, defaultViewType = LIST
// Tests that need Day view must call selectViewMode('Day') after goto().

test.describe('Calendar — access and navigation', () => {
  test('owner lands on /calendar with header rendered (default Week view)', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()

    // All three view-mode pills are present.
    await expect(calendar.viewModeMonth).toBeVisible()
    await expect(calendar.viewModeWeek).toBeVisible()
    await expect(calendar.viewModeDay).toBeVisible()

    // Default is Week — title format "23 – 29 Mar, 2026" (or cross-month).
    await calendar.expectTitleMatches(
      /^\d{1,2}( [A-Z][a-z]{2})? – \d{1,2} [A-Z][a-z]{2}, \d{4}$/,
    )

    // Today button is disabled (we're on the current week by default).
    await expect(calendar.todayButton).toBeDisabled()
  })

  test('switching Day → Week → Month produces the matching title format', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()

    // Day → "Sat, 28 Mar 2026"
    await calendar.selectViewMode('Day')
    await calendar.expectTitleMatches(
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{1,2} [A-Z][a-z]{2} \d{4}$/,
    )

    // Week → "23 – 29 Mar, 2026" or cross-month "28 Mar – 3 Apr, 2026"
    await calendar.selectViewMode('Week')
    await calendar.expectTitleMatches(
      /^\d{1,2}( [A-Z][a-z]{2})? – \d{1,2} [A-Z][a-z]{2}, \d{4}$/,
    )

    // Month → "March 2026"
    await calendar.selectViewMode('Month')
    await calendar.expectTitleMatches(/^[A-Z][a-z]+ \d{4}$/)
  })

  test('Prev/Next buttons re-fetch the day view with the new date', async ({
    page,
    request,
  }) => {
    const handles = await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Day')

    // Wait for the initial day fetch to land before counting subsequent ones.
    await expect.poll(() => handles.day.requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    const before = handles.day.requests.length

    await calendar.clickNext()
    await expect.poll(() => handles.day.requests.length, { timeout: 10_000 }).toBeGreaterThan(before)

    // Today is no longer current → the Today button becomes enabled.
    await expect(calendar.todayButton).toBeEnabled()

    // Clicking Today re-fetches.
    const beforeToday = handles.day.requests.length
    await calendar.clickToday()
    await expect.poll(() => handles.day.requests.length, { timeout: 10_000 }).toBeGreaterThan(beforeToday)

    // Title back to today's "<weekday>, <DD> <Mon> <YYYY>".
    await calendar.expectTitleMatches(
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{1,2} [A-Z][a-z]{2} \d{4}$/,
    )
  })

  test('switching to Week view triggers POST /calendar/week with locationId and weekStart', async ({
    page,
    request,
  }) => {
    const handles = await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    // Default is already Week, but flip to Day and back so we can deterministically
    // capture the *new* week request triggered by the user-driven view change.
    await calendar.selectViewMode('Day')
    await calendar.selectViewMode('Week')

    await expect.poll(() => handles.week.requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    const body = postBody(handles.week.requests[handles.week.requests.length - 1])
    expect(body.locationId).toBeDefined()
    expect(body.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('switching to Month view triggers POST /calendar/summary for that month', async ({
    page,
    request,
  }) => {
    const handles = await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Month')

    await expect.poll(() => handles.summary.requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
    const body = postBody(handles.summary.requests[handles.summary.requests.length - 1])
    expect(body.locationId).toBeDefined()
    expect(body.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(body.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('grid ↔ list toggle is present in Day and Week, hidden in Month', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()

    // The toggle button is present in Day and Week views — its accessible name
    // alternates between "Switch to list view" and "Switch to grid view"
    // depending on the current view-type. Default is List, so the visible
    // button is "Switch to grid view" first.
    const anyToggle = calendar.viewTypeToggleToList.or(calendar.viewTypeToggleToGrid)

    await calendar.selectViewMode('Day')
    await expect(anyToggle).toBeVisible()

    await calendar.selectViewMode('Week')
    await expect(anyToggle).toBeVisible()

    // Month → no toggle.
    await calendar.selectViewMode('Month')
    await expect(calendar.viewTypeToggleToList).toHaveCount(0)
    await expect(calendar.viewTypeToggleToGrid).toHaveCount(0)
  })

  test('sidebar toggle flips its accessible name', async ({
    page,
    request,
  }) => {
    await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()

    const initialName = await calendar.sidebarToggle.getAttribute('title')
    await calendar.sidebarToggle.click()
    await expect
      .poll(async () => calendar.sidebarToggle.getAttribute('title'), { timeout: 5_000 })
      .not.toBe(initialName)
  })
})
