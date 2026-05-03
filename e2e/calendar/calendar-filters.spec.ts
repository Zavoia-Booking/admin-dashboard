import { expect, test } from '@playwright/test'
import { CalendarPage } from '../pages/CalendarPage'
import {
  DEFAULTS,
  mockCalendarDefaults,
  postBody,
} from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

// Filters live inside a header popover (not the sidebar). The flow is:
//   1. Click the "Open calendar filters" button to open the popover.
//   2. Toggle staff pill(s) — these update the popover's *draft* only.
//   3. Click the footer "Apply" button to commit and trigger a refetch.

test.describe('Calendar — filters', () => {
  test('applying a single staff filter refetches /calendar/day with that staffUserIds', async ({
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
    await expect.poll(() => handles.day.requests.length, { timeout: 10_000 }).toBeGreaterThan(0)

    // Open the filters popover.
    await page.getByRole('button', { name: 'Open calendar filters' }).first().click()

    // Inside the popover, the staff filter is `role="group"` aria-label "Filter by staff member".
    const staffGroup = page.getByRole('group', { name: 'Filter by staff member' })
    await expect(staffGroup).toBeVisible({ timeout: 10_000 })

    // Click Ana → updates draft only (no API yet).
    await staffGroup.getByRole('button', { name: 'Ana Stylist' }).click()

    const before = handles.day.requests.length
    await page.getByRole('button', { name: 'Apply' }).click()

    await expect.poll(() => handles.day.requests.length, { timeout: 10_000 }).toBeGreaterThan(before)
    const body = postBody(handles.day.requests[handles.day.requests.length - 1])
    expect(body.locationId).toBe(DEFAULTS.LOCATION_ID)
    expect(body.staffUserIds).toEqual([DEFAULTS.STAFF[0].id])
  })

  test('selecting all staff in the popover is treated as "no filter" (staffUserIds omitted)', async ({
    page,
    request,
  }) => {
    // Product semantic: when the user selects every available staff member,
    // that's equivalent to "All staff" — the API call should NOT include a
    // staffUserIds narrowing. See CalendarHeaderFilters.handleApply where
    // `allSelected = draftStaff.length === staffList.length` flips it to undefined.
    const handles = await mockCalendarDefaults(page)
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'active', paidTeamSeats: 2, usedSeats: 1 } },
    })

    const calendar = new CalendarPage(page)
    await calendar.goto()
    await calendar.selectViewMode('Day')
    await expect.poll(() => handles.day.requests.length, { timeout: 10_000 }).toBeGreaterThan(0)

    // First narrow to Ana so we have a baseline non-empty staffUserIds in the
    // last request — this lets us prove the *next* request drops it.
    await page.getByRole('button', { name: 'Open calendar filters' }).first().click()
    let staffGroup = page.getByRole('group', { name: 'Filter by staff member' })
    await expect(staffGroup).toBeVisible({ timeout: 10_000 })
    await staffGroup.getByRole('button', { name: 'Ana Stylist' }).click()
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect
      .poll(() => postBody(handles.day.requests[handles.day.requests.length - 1]).staffUserIds, {
        timeout: 10_000,
      })
      .toEqual([DEFAULTS.STAFF[0].id])

    // Now widen to Ana + Bogdan = all staff → API treats this as no filter.
    await page.getByRole('button', { name: 'Open calendar filters' }).first().click()
    staffGroup = page.getByRole('group', { name: 'Filter by staff member' })
    await expect(staffGroup).toBeVisible({ timeout: 10_000 })
    await staffGroup.getByRole('button', { name: 'Bogdan Barber' }).click()
    await page.getByRole('button', { name: 'Apply' }).click()

    await expect
      .poll(
        () => {
          const last = handles.day.requests[handles.day.requests.length - 1]
          return last ? postBody(last).staffUserIds : 'pending'
        },
        { timeout: 10_000 },
      )
      .toBeUndefined()
  })

  test('applying then clearing the staff filter drops staffUserIds from subsequent requests', async ({
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
    await expect.poll(() => handles.day.requests.length, { timeout: 10_000 }).toBeGreaterThan(0)

    // Apply Ana.
    await page.getByRole('button', { name: 'Open calendar filters' }).first().click()
    let staffGroup = page.getByRole('group', { name: 'Filter by staff member' })
    await expect(staffGroup).toBeVisible({ timeout: 10_000 })
    await staffGroup.getByRole('button', { name: 'Ana Stylist' }).click()
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect
      .poll(() => postBody(handles.day.requests[handles.day.requests.length - 1]).staffUserIds, {
        timeout: 10_000,
      })
      .toEqual([DEFAULTS.STAFF[0].id])

    // Re-open the popover and click "Clear all" to drop the filter.
    await page.getByRole('button', { name: 'Open calendar filters' }).first().click()
    staffGroup = page.getByRole('group', { name: 'Filter by staff member' })
    await expect(staffGroup).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Clear all' }).click()
    // Clear all also dispatches immediately (handleClearAll calls dispatch directly).

    await expect
      .poll(
        () => {
          const last = handles.day.requests[handles.day.requests.length - 1]
          return last ? postBody(last).staffUserIds : 'pending'
        },
        { timeout: 10_000 },
      )
      .toBeUndefined()
  })

  test('switching from Day (with filter applied) to Week sends the filter on /calendar/week', async ({
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

    await page.getByRole('button', { name: 'Open calendar filters' }).first().click()
    const staffGroup = page.getByRole('group', { name: 'Filter by staff member' })
    await expect(staffGroup).toBeVisible({ timeout: 10_000 })
    await staffGroup.getByRole('button', { name: 'Bogdan Barber' }).click()
    await page.getByRole('button', { name: 'Apply' }).click()

    // Switch to Week — the new /calendar/week request should also carry the filter.
    await calendar.selectViewMode('Week')
    await expect
      .poll(
        () => {
          const last = handles.week.requests[handles.week.requests.length - 1]
          return last ? postBody(last).staffUserIds : null
        },
        { timeout: 10_000 },
      )
      .toEqual([DEFAULTS.STAFF[1].id])
  })
})
