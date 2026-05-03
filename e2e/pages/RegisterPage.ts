import type { Locator, Page } from '@playwright/test'
import type { TestUser } from '../fixtures/test-helpers'

export class RegisterPage {
  readonly page: Page
  readonly firstName: Locator
  readonly lastName: Locator
  readonly email: Locator
  readonly password: Locator
  readonly acceptTerms: Locator
  readonly submit: Locator
  readonly googleButton: Locator

  constructor(page: Page) {
    this.page = page
    this.firstName = page.locator('#firstName')
    this.lastName = page.locator('#lastName')
    this.email = page.locator('#email')
    this.password = page.locator('#password')
    this.acceptTerms = page.locator('#acceptTerms')
    this.submit = page.getByRole('button', { name: 'Sign Up', exact: true })
    this.googleButton = page.getByRole('button', { name: /google/i })
  }

  async goto(): Promise<void> {
    await this.page.goto('/register')
  }

  async fill(user: TestUser): Promise<void> {
    await this.firstName.fill(user.firstName)
    await this.lastName.fill(user.lastName)
    await this.email.fill(user.email)
    await this.password.fill(user.password)
    await this.acceptTerms.click()
  }

  async submitForm(): Promise<void> {
    await this.submit.click()
  }

  async register(user: TestUser): Promise<void> {
    await this.fill(user)
    await this.submitForm()
  }
}
