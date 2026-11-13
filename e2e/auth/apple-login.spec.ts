import { expect, test } from '@playwright/test'
import {
  APPLE_REDIRECT_URI,
  APPLE_SERVICES_ID,
  apiError,
  appleInitCalls,
  appleSignInCalls,
  mockApplePost,
  mockSignedInShell,
  session,
  sha256Hex,
  stubAppleJs,
} from '../fixtures/apple-mocks'

const appleButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Continue with Apple' })

test.describe('Sign in with Apple — login (web)', () => {
  test('sends the Apple credential with the raw nonce and lands an owner on /dashboard', async ({ page }) => {
    await stubAppleJs(page)
    const owner = { wizardCompleted: true, businessId: 1 }
    await mockSignedInShell(page, owner)
    const bodies = await mockApplePost(page, '/auth/apple', () => ({ status: 200, body: session(owner) }))

    await page.goto('/login')
    await appleButton(page).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    expect(bodies).toHaveLength(1)
    const body = bodies[0]
    expect(body).toMatchObject({
      platform: 'web',
      authorizationCode: 'mock-apple-code',
      identityToken: 'mock-apple-id-token',
      redirectUri: APPLE_REDIRECT_URI,
      intent: 'login',
      firstName: 'Ana',
      lastName: 'Pop',
    })
    expect(body.welcomeToken).toBeUndefined()
    // The API gets the raw nonce; Apple got its SHA-256.
    expect(body.nonce).toMatch(/^[0-9a-f]{64}$/)
    const [init] = (await appleInitCalls(page)).slice(-1)
    expect(init.clientId).toBe(APPLE_SERVICES_ID)
    expect(init.redirectURI).toBe(APPLE_REDIRECT_URI)
    expect(init.usePopup).toBe(true)
    expect(init.nonce).toBe(sha256Hex(body.nonce))
  })

  test('an owner who has not finished the setup wizard lands on /welcome', async ({ page }) => {
    await stubAppleJs(page)
    const owner = { wizardCompleted: false, businessId: null }
    await mockSignedInShell(page, owner)
    await mockApplePost(page, '/auth/apple', () => ({ status: 200, body: session(owner) }))

    await page.goto('/login')
    await appleButton(page).click()
    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
  })

  test('several businesses: the business selector opens, picking one signs in', async ({ page }) => {
    await stubAppleJs(page)
    const businesses = [
      { id: 11, name: 'Acme Salon', role: 'owner' },
      { id: 12, name: 'Beta Barbers', role: 'team_member' },
    ]
    await mockApplePost(page, '/auth/apple', () => ({
      status: 300,
      body: apiError(300, 'AUTH.E17', 'business_selection_required', { selectionToken: 'mock-selection-token', businesses }),
    }))
    const selections = await mockApplePost(page, '/auth/select-business', (body) => ({
      status: 200,
      body: session({ wizardCompleted: true, businessId: body.businessId, role: 'owner' }),
    }))
    await mockSignedInShell(page, { wizardCompleted: true, businessId: 11 })

    await page.goto('/login')
    await appleButton(page).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog).toContainText(/select your business/i)
    await dialog.getByRole('button', { name: /Acme Salon/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    expect(selections[0]).toMatchObject({ selectionToken: 'mock-selection-token', businessId: 11 })
  })

  test('an Apple ID with no account shows the "register first" banner', async ({ page }) => {
    await stubAppleJs(page)
    await mockApplePost(page, '/auth/apple', () => ({
      status: 404,
      body: apiError(404, 'APPLE.E14', 'account_not_found', { suggestedNext: 'register' }),
    }))

    await page.goto('/login')
    await appleButton(page).click()

    await expect(page.getByRole('link', { name: 'create an account' })).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('a pending team invitation is explained in a toast', async ({ page }) => {
    await stubAppleJs(page)
    await mockApplePost(page, '/auth/apple', () => ({
      status: 403,
      body: apiError(403, 'APPLE.E07', 'pending_invitation_requires_acceptance'),
    }))

    await page.goto('/login')
    await appleButton(page).click()

    await expect(page.getByText('Finish accepting your team invitation first, then you can use Apple')).toBeVisible({ timeout: 10_000 })
  })

  test('closing the Apple popup is silent and calls nothing', async ({ page }) => {
    await stubAppleJs(page, { error: 'popup_closed_by_user' })
    const bodies = await mockApplePost(page, '/auth/apple', () => ({ status: 500, body: {} }))

    await page.goto('/login')
    await appleButton(page).click()

    await expect.poll(() => appleSignInCalls(page)).toBe(1)
    await expect(appleButton(page)).toBeEnabled()
    await expect(page.getByText("Sign in with Apple didn't work. Please try again.")).toHaveCount(0)
    expect(bodies).toHaveLength(0)
  })
})

test.describe('Sign in with Apple — account already exists', () => {
  test('proves the account with its password, then signs in', async ({ page }) => {
    await stubAppleJs(page)
    const owner = { wizardCompleted: true, businessId: 1 }
    await mockSignedInShell(page, owner)
    await mockApplePost(page, '/auth/apple', () => ({
      status: 409,
      body: apiError(409, 'APPLE.E10', 'account_exists_unlinked_apple', {
        tx_id: 'tx-password',
        email: 'owner@test.com',
        proofs: ['password'],
      }),
    }))
    const verifies = await mockApplePost(page, '/auth/apple/link/verify', (body) =>
      body.password === 'Right123!'
        ? { status: 200, body: session(owner) }
        : { status: 401, body: apiError(401, 'APPLE.E08', 'apple_link_proof_invalid') },
    )

    await page.goto('/login')
    await appleButton(page).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Connect Apple to your account', { timeout: 10_000 })
    await expect(dialog.locator('#cred-email')).toHaveValue('owner@test.com')

    await dialog.locator('#cred-password').fill('Wrong123!')
    await dialog.getByRole('button', { name: 'Connect Apple' }).click()
    await expect(dialog).toContainText("That password or code isn't right.")

    await dialog.locator('#cred-password').fill('Right123!')
    await dialog.getByRole('button', { name: 'Connect Apple' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    expect(verifies.map((b) => b.tx_id)).toEqual(['tx-password', 'tx-password'])
    expect(verifies[1]).toEqual({ tx_id: 'tx-password', password: 'Right123!' })
  })

  test('proves a passwordless account with an emailed code; the answer can be the business selector', async ({ page }) => {
    await stubAppleJs(page)
    await mockApplePost(page, '/auth/apple', () => ({
      status: 409,
      body: apiError(409, 'APPLE.E10', 'account_exists_unlinked_apple', {
        tx_id: 'tx-code',
        email: 'google-only@test.com',
        proofs: ['email_code'],
      }),
    }))
    const sends = await mockApplePost(page, '/auth/apple/link/send-code', () => ({
      status: 200,
      body: { message: 'APPLE.S04', email: 'google-only@test.com' },
    }))
    const businesses = [
      { id: 21, name: 'Gamma Studio', role: 'owner' },
      { id: 22, name: 'Delta Spa', role: 'team_member' },
    ]
    const verifies = await mockApplePost(page, '/auth/apple/link/verify', () => ({
      status: 300,
      body: apiError(300, 'AUTH.E17', 'business_selection_required', { selectionToken: 'sel-after-link', businesses }),
    }))
    await mockApplePost(page, '/auth/select-business', (body) => ({
      status: 200,
      body: session({ wizardCompleted: true, businessId: body.businessId, role: 'owner' }),
    }))
    await mockSignedInShell(page, { wizardCompleted: true, businessId: 21 })

    await page.goto('/login')
    await appleButton(page).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Connect Apple to your account', { timeout: 10_000 })
    await dialog.getByRole('button', { name: 'Email me a code' }).click()
    await expect(dialog).toContainText('Enter the 6-digit code we sent to google-only@test.com.')
    expect(sends).toEqual([{ tx_id: 'tx-code' }])

    await dialog.getByLabel('Code').fill('123456')
    await dialog.getByRole('button', { name: 'Connect Apple' }).click()

    const selector = page.getByRole('dialog')
    await expect(selector).toContainText(/select your business/i, { timeout: 10_000 })
    expect(verifies).toEqual([{ tx_id: 'tx-code', code: '123456' }])
    await selector.getByRole('button', { name: /Gamma Studio/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })

  test('the code step maps an expired step and the code limit', async ({ page }) => {
    await stubAppleJs(page)
    await mockApplePost(page, '/auth/apple', () => ({
      status: 409,
      body: apiError(409, 'APPLE.E10', 'account_exists_unlinked_apple', {
        tx_id: 'tx-limit',
        email: 'google-only@test.com',
        proofs: ['email_code'],
      }),
    }))
    await mockApplePost(page, '/auth/apple/link/send-code', () => ({
      status: 429,
      body: apiError(429, 'APPLE.E09', 'apple_code_limit'),
    }))

    await page.goto('/login')
    await appleButton(page).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Email me a code' }).click()
    await expect(dialog).toContainText("You've asked for too many codes. Close this window and continue with Apple again.")
    await expect(dialog.getByRole('button', { name: 'Email me a code' })).toBeDisabled()

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // Nothing signed in: still on /login.
    await expect(page).toHaveURL(/\/login/)
  })
})
