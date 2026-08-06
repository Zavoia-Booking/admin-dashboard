import type { Locator, Page } from '@playwright/test'

export class ResetPasswordPage {
  readonly page: Page
  readonly password: Locator
  readonly confirm: Locator
  readonly submit: Locator
  readonly successMessage: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.password = page.locator('#password')
    this.confirm = page.locator('#confirm')
    this.submit = page.getByRole('button', { name: /^reset password$/i })
    this.successMessage = page.getByText('Password updated')
    this.errorAlert = page.getByText('The link is invalid')
  }

  async goto(token: string): Promise<void> {
    await this.page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
  }

  async setNewPassword(password: string, confirm: string): Promise<void> {
    await this.password.fill(password)
    await this.confirm.fill(confirm)
    await this.submit.click()
  }
}
