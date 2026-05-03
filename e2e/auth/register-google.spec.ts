import { expect, test } from '@playwright/test'
import { mockGoogleAuth, presetOauthContext } from '../fixtures/auth-mocks'

test.describe('Google registration', () => {
  test('callback completes register and redirects new owner to /welcome', async ({
    page,
  }) => {
    await presetOauthContext(page, 'register')
    await mockGoogleAuth(page, { behavior: 'register_success_new_owner' })

    await page.goto('/auth/callback?code=mock-google-code&state=mock-state&scope=email+profile')
    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
  })

  test('callback with error param redirects back to /register', async ({
    page,
  }) => {
    await presetOauthContext(page, 'register')
    await page.goto('/auth/callback?error=access_denied&state=mock-state')
    await expect(page).toHaveURL(/\/register/, { timeout: 10_000 })
  })
})
