import { expect, test } from '@playwright/test'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { mockResetPassword } from '../fixtures/auth-mocks'
import { VALID_PASSWORD } from '../fixtures/test-helpers'

test.describe('Reset password page', () => {
  test('happy path: submitting matching new passwords shows success', async ({
    page,
  }) => {
    await mockResetPassword(page, { token: 'good-token', behavior: 'success' })
    const reset = new ResetPasswordPage(page)
    await reset.goto('good-token')

    await reset.setNewPassword(VALID_PASSWORD, VALID_PASSWORD)
    await expect(reset.successMessage).toBeVisible({ timeout: 10_000 })
  })

  test('mismatched passwords disable the submit button and show inline error', async ({
    page,
  }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto('good-token')

    await reset.password.fill(VALID_PASSWORD)
    await reset.confirm.fill('Different123!@#')

    await expect(reset.submit).toBeDisabled()
    await expect(
      page.getByText('Passwords must match', { exact: false }),
    ).toBeVisible()
  })

  test('invalid token surfaces an inline error after submission', async ({
    page,
  }) => {
    await mockResetPassword(page, { token: 'mismatch', behavior: 'invalid' })
    const reset = new ResetPasswordPage(page)
    await reset.goto('bad-token')

    await reset.setNewPassword(VALID_PASSWORD, VALID_PASSWORD)

    await expect(
      page.locator('.bg-error-bg, [role="alert"]').first(),
    ).toBeVisible({ timeout: 10_000 })
    await expect(reset.successMessage).not.toBeVisible()
  })
})
