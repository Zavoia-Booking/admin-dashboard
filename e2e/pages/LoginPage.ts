import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly email: Locator
  readonly password: Locator
  readonly submit: Locator
  readonly forgotPasswordTrigger: Locator
  readonly googleButton: Locator
  readonly noAccountBanner: Locator
  readonly registerLink: Locator

  constructor(page: Page) {
    this.page = page
    this.email = page.locator('#cred-email')
    this.password = page.locator('#cred-password')
    this.submit = page.getByRole('button', { name: 'Log in', exact: true })
    this.forgotPasswordTrigger = page.getByRole('button', {
      name: 'Forgot your password?',
    })
    this.googleButton = page.getByRole('button', { name: /google/i })
    this.noAccountBanner = page.getByText('No account found with this email')
    this.registerLink = page.getByRole('link', { name: 'Sign up', exact: true })
  }

  async goto(): Promise<void> {
    await this.page.goto('/login')
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.email.fill(email)
    await this.password.fill(password)
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password)
    await this.submit.click()
  }
}
