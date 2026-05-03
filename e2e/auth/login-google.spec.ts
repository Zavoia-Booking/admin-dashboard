import { expect, test } from '@playwright/test'
import { mockGoogleAuth, presetOauthContext } from '../fixtures/auth-mocks'

test.describe('Google login', () => {
  test('callback completes login for an existing owner with finished wizard → /dashboard', async ({
    page,
  }) => {
    await presetOauthContext(page, 'login')
    await mockGoogleAuth(page, { behavior: 'login_success_wizard_complete' })

    await page.goto('/auth/callback?code=mock-google-code&state=mock-state&scope=email+profile')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })

  test('callback for owner without wizard → /welcome', async ({ page }) => {
    await presetOauthContext(page, 'login')
    await mockGoogleAuth(page, { behavior: 'login_success_new_owner' })

    await page.goto('/auth/callback?code=mock-google-code&state=mock-state&scope=email+profile')
    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
  })

  test('callback with error param redirects back to /login', async ({
    page,
  }) => {
    await presetOauthContext(page, 'login')
    await page.goto('/auth/callback?error=access_denied&state=mock-state')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
