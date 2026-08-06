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
    await page.getByRole('button', { name: /send reset link/i }).click()

    // Neutral message by design — it must not reveal whether the email exists.
    await expect(
      page.getByText('If an account exists for this email', { exact: false }),
    ).toBeVisible({ timeout: 10_000 })
  })
})
