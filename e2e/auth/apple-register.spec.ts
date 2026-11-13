import { expect, test } from '@playwright/test'
import {
  apiError,
  appleSignInCalls,
  json,
  mockApplePost,
  mockSignedInShell,
  session,
  stubAppleJs,
} from '../fixtures/apple-mocks'

const appleButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Sign up with Apple' })

const newOwner = { wizardCompleted: false, businessId: null }

test.describe('Sign in with Apple — register (web)', () => {
  test('is gated by the terms checkbox, like Google', async ({ page }) => {
    await stubAppleJs(page)
    await mockSignedInShell(page, newOwner)
    const bodies = await mockApplePost(page, '/auth/apple', () => ({ status: 200, body: session(newOwner, true) }))

    await page.goto('/register')
    await appleButton(page).click()

    await expect(page.getByText('You must accept the terms to continue')).toBeVisible()
    expect(await appleSignInCalls(page)).toBe(0)
    expect(bodies).toHaveLength(0)

    await page.locator('#acceptTerms').click()
    await appleButton(page).click()

    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toMatchObject({ platform: 'web', intent: 'register', authorizationCode: 'mock-apple-code' })
    expect(bodies[0].welcomeToken).toBeUndefined()
  })

  test('asks for a name when Apple shared none, then creates the account', async ({ page }) => {
    await stubAppleJs(page, { authorization: { code: 'mock-apple-code', id_token: 'mock-apple-id-token' } })
    await mockSignedInShell(page, newOwner)
    const auths = await mockApplePost(page, '/auth/apple', () => ({
      status: 409,
      body: apiError(409, 'APPLE.E17', 'apple_profile_required', { tx_id: 'tx-name', email: 'hidden@privaterelay.appleid.com' }),
    }))
    const profiles = await mockApplePost(page, '/auth/apple/profile', () => ({ status: 200, body: session(newOwner, true) }))

    await page.goto('/register')
    await page.locator('#acceptTerms').click()
    await appleButton(page).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText("What's your name?", { timeout: 10_000 })
    expect(auths[0].firstName).toBeUndefined()
    expect(auths[0].lastName).toBeUndefined()

    // Same name rule as the register form.
    const submit = dialog.getByRole('button', { name: 'Create account' })
    await dialog.locator('#apple-firstName').fill('A')
    await expect(submit).toBeDisabled()
    await dialog.locator('#apple-firstName').fill('Ana')
    await dialog.locator('#apple-lastName').fill('Pop')
    await submit.click()

    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
    expect(profiles).toEqual([{ tx_id: 'tx-name', firstName: 'Ana', lastName: 'Pop' }])
  })

  test('a welcome link from Apple on iPhone leads with Apple and sends the token', async ({ page }) => {
    await stubAppleJs(page)
    await mockSignedInShell(page, newOwner)
    await page.route('**/api/auth/mobile-register-validate*', (route) =>
      json(route, 200, { email: 'apple-user@test.com', provider: 'apple' }),
    )
    const bodies = await mockApplePost(page, '/auth/apple', () => ({ status: 200, body: session(newOwner, true) }))

    await page.goto('/register?welcomeToken=welcome-123')
    await expect(page.getByText('You started signing up with Apple on your phone.', { exact: false })).toBeVisible({ timeout: 10_000 })

    await page.locator('#acceptTerms').click()
    await appleButton(page).click()

    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
    expect(bodies[0]).toMatchObject({ intent: 'register', welcomeToken: 'welcome-123' })
  })
})
