import { expect, test } from '@playwright/test'
import {
  apiError,
  json,
  mockApplePost,
  mockSignedInShell,
  session,
  stubAppleJs,
} from '../fixtures/apple-mocks'

const newOwner = { wizardCompleted: false, businessId: null }

test.describe('Sign in with Apple — /link-business-account', () => {
  test('an Apple-only account confirms with Apple and lands on /welcome', async ({ page }) => {
    await stubAppleJs(page)
    await mockSignedInShell(page, newOwner)
    await page.route('**/api/auth/link-business-account/validate*', (route) =>
      json(route, 200, { email: 'customer@test.com', hasPassword: false, googleLinked: false, appleLinked: true }),
    )
    const bodies = await mockApplePost(page, '/auth/apple/business-link', () => ({ status: 200, body: session(newOwner) }))

    await page.goto('/link-business-account?token=link-token-1')
    await expect(page.getByText('This account uses Apple to sign in.', { exact: false })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /google/i })).toHaveCount(0)

    await page.getByRole('button', { name: 'Continue with Apple' }).click()
    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })

    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toMatchObject({
      token: 'link-token-1',
      platform: 'web',
      authorizationCode: 'mock-apple-code',
      identityToken: 'mock-apple-id-token',
    })
    expect(bodies[0].intent).toBeUndefined()
  })

  test('the password step answering apple_login_required switches to Apple', async ({ page }) => {
    await stubAppleJs(page)
    await page.route('**/api/auth/link-business-account/validate*', (route) =>
      json(route, 200, { email: 'customer@test.com', hasPassword: true, googleLinked: false, appleLinked: false }),
    )
    await mockApplePost(page, '/auth/link-business-account', () => ({
      status: 400,
      body: apiError(400, 'APPLE.E15', 'apple_login_required', { provider: 'apple' }),
    }))

    await page.goto('/link-business-account?token=link-token-2')
    await expect(page.getByRole('button', { name: 'Continue with Apple' })).toHaveCount(0)

    await page.locator('#password').fill('whatever')
    await page.getByRole('button', { name: 'Enable access' }).click()

    await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('This account uses Apple to sign in.', { exact: false })).toBeVisible()
  })

  test('an Apple ID with a different email is explained on the page', async ({ page }) => {
    await stubAppleJs(page)
    await page.route('**/api/auth/link-business-account/validate*', (route) =>
      json(route, 200, { email: 'customer@test.com', hasPassword: false, googleLinked: false, appleLinked: true }),
    )
    await mockApplePost(page, '/auth/apple/business-link', () => ({
      status: 400,
      body: apiError(400, 'APPLE.E02', 'apple_email_mismatch'),
    }))

    await page.goto('/link-business-account?token=link-token-3')
    await page.getByRole('button', { name: 'Continue with Apple' }).click()
    await expect(page.getByText("This Apple ID doesn't match customer@test.com.", { exact: false })).toBeVisible({ timeout: 10_000 })
  })
})
