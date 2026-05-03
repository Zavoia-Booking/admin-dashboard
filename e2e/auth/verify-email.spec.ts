import { expect, test } from '@playwright/test'
import { mockVerifyEmail } from '../fixtures/auth-mocks'

test.describe('Verify email page', () => {
  test('success: shows the verified state', async ({ page }) => {
    await mockVerifyEmail(page, 'success')
    await page.goto('/verify-email?token=good-token')

    await expect(page.getByText('Email verified', { exact: false })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('already-verified: surfaces the corresponding message', async ({
    page,
  }) => {
    await mockVerifyEmail(page, 'already_verified')
    await page.goto('/verify-email?token=already-verified-token')

    await expect(
      page.getByText('Your email is already verified', { exact: false }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('invalid token: surfaces the invalid-link message', async ({ page }) => {
    await mockVerifyEmail(page, 'invalid')
    await page.goto('/verify-email?token=bad-token')

    await expect(
      page.getByText(/invalid or has expired/i),
    ).toBeVisible({ timeout: 10_000 })
  })
})
