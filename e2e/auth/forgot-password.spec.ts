import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { makeTestUser } from '../fixtures/test-helpers'

test.describe('Forgot password (inline)', () => {
  test('shows success message after submitting email', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()

    await login.forgotPasswordTrigger.click()

    const emailInput = page.locator('#cred-email')
    await emailInput.fill(makeTestUser().email)
    await page
      .getByRole('button', { name: 'Reset Password', exact: true })
      .click()

    await expect(
      page.getByText(
        'If an account exists for the provided email',
        { exact: false },
      ),
    ).toBeVisible({ timeout: 10_000 })
  })
})
