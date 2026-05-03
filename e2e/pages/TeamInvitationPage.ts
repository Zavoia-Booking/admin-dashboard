import type { Locator, Page } from '@playwright/test'

export class TeamInvitationPage {
  readonly page: Page
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
    this.firstName = page.locator('#firstName')
    this.lastName = page.locator('#lastName')
    this.phone = page.locator('#phone')
    this.password = page.locator('#password')
    this.submit = page.getByRole('button', {
      name: 'Complete Registration',
      exact: true,
    })
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
