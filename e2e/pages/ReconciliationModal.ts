import { expect, type Locator, type Page } from '@playwright/test'

export type ReconciliationMode = 'seat_overflow' | 'remove_member' | 'unassign_from_location'

/**
 * Wraps the SeatOverflowGate modal that drives all three reconciliation flows.
 * Locators rely on the modal's title text and stable accessible labels — see
 * src/features/teamMembers/components/SeatOverflowGate.tsx for the source.
 */
export class ReconciliationModal {
  constructor(private page: Page) {}

  // The reconciliation modal is the [role="dialog"] whose own heading matches
  // one of the three mode-specific titles. We scope by requiring the heading
  // to live inside the dialog so the team-member slider (which also has a
  // "Remove Team Member" section) doesn't get matched.
  private dialog(): Locator {
    const heading = this.page.getByRole('heading', {
      name: /(Reconcile your team with your new plan|Remove .* from organisation|Unassign .* from )/i,
    })
    return this.page.locator('[role="dialog"]').filter({ has: heading })
  }

  async expectVisible(mode: ReconciliationMode): Promise<void> {
    const expected =
      mode === 'remove_member'
        ? /Remove .* from organisation/i
        : mode === 'unassign_from_location'
          ? /Unassign .* from /i
          : /Reconcile your team with your new plan/i
    await expect(this.page.getByRole('heading', { name: expected })).toBeVisible({
      timeout: 15_000,
    })
  }

  async expectClosed(): Promise<void> {
    await expect(this.dialog()).toHaveCount(0, { timeout: 15_000 })
  }

  appointmentsRegion(): Locator {
    // AppointmentsPane is a <main> inside the dialog tree.
    return this.page.locator('main').filter({
      has: this.page.getByText('Upcoming appointments', { exact: true }),
    })
  }

  appointmentRow(customerName: string): Locator {
    return this.appointmentsRegion()
      .locator('div.grid')
      .filter({ has: this.page.getByText(customerName, { exact: true }) })
      .first()
  }

  async expectAppointmentRow(customerName: string): Promise<void> {
    await expect(this.appointmentRow(customerName)).toBeVisible({ timeout: 15_000 })
  }

  async expectAppointmentCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.appointmentsRegion().getByText('No upcoming appointments')).toBeVisible()
      return
    }
    // Each row is a top-level grid div inside the scroll container.
    const rows = this.appointmentsRegion().locator('div.grid.items-center.rounded-xl')
    await expect(rows).toHaveCount(count, { timeout: 15_000 })
  }

  /**
   * Click a candidate row in the seat_overflow aside. MemberRow buttons set
   * `aria-label` to the member's full name (`firstName lastName`), so we
   * match by aria-label starting with the firstName — that uniquely targets
   * the member-row button (the appointment-pane buttons all have names like
   * "Reassign" / "More actions" / "Cancel appointment").
   */
  async selectMember(firstName: string): Promise<void> {
    const button = this.dialog()
      .getByRole('button', { name: new RegExp(`^${firstName}\\b`, 'i') })
      .first()
    await button.waitFor({ state: 'visible', timeout: 10_000 })
    await button.click()
  }

  /**
   * Reassign an appointment to a staff member.
   * - Click the "Reassign" outline button on the row
   * - Pick the staff name in the popover
   */
  async reassignAppointment(customerName: string, staffFirstName: string): Promise<void> {
    const row = this.appointmentRow(customerName)
    await row.getByRole('button', { name: 'Reassign' }).click()
    // Popover renders inside a portal; wait for at least one cmdk option to
    // appear before picking, otherwise we race the popover hydration.
    const option = this.page.getByRole('option', { name: new RegExp(staffFirstName, 'i') }).first()
    await option.waitFor({ state: 'visible', timeout: 10_000 })
    await option.click()
  }

  /** Cancel an appointment via the ⋯ menu. */
  async cancelAppointment(customerName: string): Promise<void> {
    const row = this.appointmentRow(customerName)
    await row.getByRole('button', { name: /more actions/i }).click()
    await this.page.getByRole('menuitem', { name: /Cancel appointment/i }).click()
  }

  bulkCancelButton(): Locator {
    // BulkActionsBar renders a "Cancel all" button only when there are undecided appts.
    return this.dialog().getByRole('button', { name: /Cancel all/i })
  }

  async bulkCancelAll(): Promise<void> {
    await this.bulkCancelButton().click()
    // Some flows show a confirm — accept any visible confirm button.
    const confirm = this.page.getByRole('button', { name: /^Cancel all$|^Confirm$|^Yes/i })
    if (await confirm.count()) {
      await confirm.first().click().catch(() => {})
    }
  }

  primaryButton(): Locator {
    // Footer commit button — text varies by mode.
    return this.dialog()
      .getByRole('button', {
        name: /^(Save & remove members?|Save & unassign|Pick a member to remove)$/i,
      })
      .last()
  }

  async expectPrimaryDisabled(): Promise<void> {
    await expect(this.primaryButton()).toBeDisabled()
  }

  async expectPrimaryEnabled(): Promise<void> {
    await expect(this.primaryButton()).toBeEnabled({ timeout: 15_000 })
  }

  async clickPrimary(): Promise<void> {
    await this.primaryButton().click()
  }

  payForSeatsButton(): Locator {
    return this.dialog().getByRole('button', { name: /Pay for extra seats/i })
  }

  orphanBanner(): Locator {
    return this.dialog().locator('text=/can\'t be reassigned/i')
  }
}
