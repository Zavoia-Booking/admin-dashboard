import type { Locator, Page } from '@playwright/test'

export class TeamInvitationPage {
  readonly page: Page
  readonly termsCheckbox: Locator
  readonly acceptButton: Locator
  readonly firstName: Locator
  readonly lastName: Locator
  readonly phone: Locator
  readonly password: Locator
  readonly submit: Locator
  readonly verifyingMessage: Locator
  readonly errorTitle: Locator
  readonly acceptedTitle: Locator
  readonly completedTitle: Locator

  constructor(page: Page) {
    this.page = page
    // Opening the link only shows the invitation: the ticked box + "Accept
    // invitation" is what sends the check call (which accepts it for existing
    // users).
    this.termsCheckbox = page.locator('#acceptTerms')
    this.acceptButton = page.getByRole('button', { name: /^accept invitation$/i })
    this.firstName = page.locator('#firstName')
    this.lastName = page.locator('#lastName')
    this.phone = page.locator('#phone')
    this.password = page.locator('#password')
    // Case-insensitive: the label's casing ("Complete registration") is a copy
    // decision, not a contract the tests should pin.
    this.submit = page.getByRole('button', { name: /^complete registration$/i })
    this.verifyingMessage = page.getByText('Verifying invitation')
    this.errorTitle = page.getByText('Invalid Invitation')
    this.acceptedTitle = page.getByText("You're All Set!")
    this.completedTitle = page.getByText('Registration Complete!')
  }

  async goto(token: string): Promise<void> {
    await this.page.goto(
      `/team-invitation?token=${encodeURIComponent(token)}`,
    )
  }

  /** Ticks the terms box and clicks "Accept invitation". */
  async accept(): Promise<void> {
    await this.termsCheckbox.click()
    await this.acceptButton.click()
  }

  async complete(values: {
    firstName: string
    lastName: string
    phone: string
    password: string
  }): Promise<void> {
    await this.firstName.fill(values.firstName)
    await this.lastName.fill(values.lastName)
    await this.phone.fill(values.phone)
    await this.password.fill(values.password)
    await this.submit.click()
  }
}
