import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Page object for /calendar.
 *
 * The calendar feature carries no `data-testid` attributes (verified with
 * `grep -rn "data-testid" src/features/calendar/`) so locators here lean on:
 *   - accessible names (translated via en/calendar.json)
 *   - `title=` attributes on icon-only buttons (sidebar toggle, view-type toggle,
 *     settings button)
 *   - role-based selectors for the sliders/dialogs:
 *     - sliders open as `role="dialog"`
 *     - confirmation/override dialogs open as `role="alertdialog"`
 *
 * Header layout (from CalendarHeader.tsx):
 *   [sidebar-toggle] [‹] {date title} [›]   …   {Mon|Wk|Day pills}   …   [Block | Add Event | Filters | Today | List/Grid | Settings]
 */
export type CalendarViewMode = 'Month' | 'Week' | 'Day'

export class CalendarPage {
  readonly page: Page

  // Header — left
  readonly sidebarToggle: Locator
  readonly prevButton: Locator
  readonly nextButton: Locator
  readonly title: Locator

  // Header — center (view-mode pills)
  readonly viewModeMonth: Locator
  readonly viewModeWeek: Locator
  readonly viewModeDay: Locator

  // Header — right (action pill)
  readonly blockButton: Locator
  readonly addEventButton: Locator
  readonly todayButton: Locator
  readonly viewTypeToggleToList: Locator
  readonly viewTypeToggleToGrid: Locator
  readonly settingsButton: Locator

  // Sidebar
  readonly sidebar: Locator

  // Drawers / sliders / dialogs
  readonly addSlider: Locator
  readonly editSlider: Locator
  readonly blockDrawer: Locator
  readonly confirmDialog: Locator

  // Toasts
  readonly toasts: Locator

  // Calendar grid scroll container — useful as a "page is mounted" sentinel.
  readonly gridScroll: Locator

  constructor(page: Page) {
    this.page = page

    this.sidebarToggle = page.getByRole('button', {
      name: /Hide sidebar|Show sidebar/i,
    })
    // The header's date-nav arrows are icon-only with no name. They sit on
    // either side of the centered date title `<h1>`. Anchor on the title.
    this.title = page.locator('h1').first()
    this.prevButton = this.title.locator('xpath=preceding-sibling::button[1]')
    this.nextButton = this.title.locator('xpath=following-sibling::button[1]')

    this.viewModeMonth = page.getByRole('button', { name: 'Month', exact: true })
    this.viewModeWeek = page.getByRole('button', { name: 'Week', exact: true })
    this.viewModeDay = page.getByRole('button', { name: 'Day', exact: true })

    this.blockButton = page
      .getByRole('button', { name: 'Block', exact: true })
      .first()
    this.addEventButton = page
      .getByRole('button', { name: 'Add Event', exact: true })
      .first()
    this.todayButton = page
      .getByRole('button', { name: 'Today', exact: true })
      .first()
    this.viewTypeToggleToList = page.getByRole('button', {
      name: /Switch to list view/i,
    })
    this.viewTypeToggleToGrid = page.getByRole('button', {
      name: /Switch to grid view/i,
    })
    this.settingsButton = page.getByRole('button', {
      name: /Calendar Settings/i,
    })

    this.sidebar = page.locator('[data-calendar-sidebar], aside').first()

    // Sliders open as role=dialog and contain their distinctive title.
    this.addSlider = page.getByRole('dialog').filter({
      hasText: /New Appointment|Edit Appointment/i,
    })
    this.editSlider = page.getByRole('dialog').filter({
      hasText: /Edit Appointment/i,
    })
    this.blockDrawer = page.getByRole('dialog').filter({
      hasText: /Block time|Edit block/i,
    })

    this.confirmDialog = page.getByRole('alertdialog')
    this.toasts = page.locator('[data-sonner-toast]')

    this.gridScroll = page.locator('[data-calendar-scroll]')
  }

  async goto(): Promise<void> {
    await this.page.goto('/calendar')
    // Header always renders once the page mounts (no location-context needed).
    await expect(this.viewModeDay).toBeVisible({ timeout: 15_000 })
  }

  async selectViewMode(mode: CalendarViewMode): Promise<void> {
    if (mode === 'Month') await this.viewModeMonth.click()
    else if (mode === 'Week') await this.viewModeWeek.click()
    else await this.viewModeDay.click()
  }

  async clickPrev(): Promise<void> {
    await this.prevButton.click()
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click()
  }

  async clickToday(): Promise<void> {
    await this.todayButton.click()
  }

  async openAddForm(): Promise<void> {
    await this.addEventButton.click()
    await expect(this.addSlider).toBeVisible({ timeout: 10_000 })
  }

  async openBlockForm(): Promise<void> {
    await this.blockButton.click()
    await expect(this.blockDrawer).toBeVisible({ timeout: 10_000 })
  }

  async expectTitleMatches(pattern: RegExp | string): Promise<void> {
    await expect(this.title).toHaveText(pattern, { timeout: 10_000 })
  }

  async expectToast(pattern: RegExp | string): Promise<void> {
    const toast = this.toasts.filter({ hasText: pattern }).first()
    await expect(toast).toBeVisible({ timeout: 10_000 })
  }
}
