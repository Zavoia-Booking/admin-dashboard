import { test } from '@playwright/test'

// Drag-and-drop reschedule is the trickiest calendar interaction to drive
// from Playwright. It uses `react-dnd` with the HTML5 backend, which
// fires native drag events that Playwright's `mouse.down/move/up` does NOT
// automatically synthesize. The community workaround — `page.dispatchEvent`
// with synthetic DataTransfer — is fragile and version-dependent.
//
// On top of that, the source/target slot elements in DayGrid / WeekGrid
// don't carry stable selectors (no data-testid, no aria roles). Identifying
// "the 10:00 slot in the staff column for Ana" requires DOM coordinate math
// against the time-grid layout.
//
// Until the calendar feature exposes a programmatic reschedule hook (or
// migrates to `@dnd-kit` whose events are JS-dispatchable), this spec is
// intentionally skipped to avoid a flaky test that would erode trust in the
// suite. The plan file's inconsistency #5 captures the longer-term fix.

test.describe('Calendar — drag-reschedule', () => {
  test.skip('drag an appointment to a new time slot triggers PUT /appointments/:id', async () => {
    // Implementation requires:
    //   1. A real seeded appointment so the source card exists in the grid.
    //   2. A reliable way to drive react-dnd from Playwright (or a UI escape hatch).
    //   3. Stable selectors for source card + target slot (data-testid would unblock this).
    // See the plan file's "Inconsistencies and problems" section, item #5.
  })

  test.skip('drag onto a blocked slot opens the override dialog and re-submits with overrideConflicts', async () => {
    // Same blockers as above.
  })

  test.skip('dragging a group segment opens the group dialog and uses /appointments/group/:id/reschedule', async () => {
    // Same blockers as above.
  })
})
