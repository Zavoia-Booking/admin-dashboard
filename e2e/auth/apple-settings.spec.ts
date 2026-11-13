import { expect, test, type Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { makeTestUser, registerViaApi, withApiContext, type TestUser } from '../fixtures/test-helpers'
import { apiError, json, mockApplePost, stubAppleJs } from '../fixtures/apple-mocks'

type AppleInfo = { linked: boolean; email: string | null; isPrivateEmail: boolean; emailForwardingDisabled: boolean }

const NOT_LINKED: AppleInfo = { linked: false, email: null, isPrivateEmail: false, emailForwardingDisabled: false }
const LINKED_RELAY: AppleInfo = {
  linked: true,
  email: 'abc123@privaterelay.appleid.com',
  isPrivateEmail: true,
  emailForwardingDisabled: false,
}

/**
 * A real owner session (real cookies, so refresh works), with /auth/me
 * answered from `me()` so the Apple fields can change during the test.
 * The owner has no business yet, so /account loads no business data.
 */
async function signInOwner(page: Page, me: () => Record<string, unknown>): Promise<TestUser> {
  const user = makeTestUser()
  await withApiContext((ctx) => registerViaApi(ctx, user))
  await page.route('**/api/auth/me', (route) =>
    json(route, 200, {
      id: 1,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'owner',
      businessId: null,
      wizardCompleted: false,
      emailVerified: true,
      ...me(),
    }),
  )
  const login = new LoginPage(page)
  await login.goto()
  await login.login(user.email, user.password)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
  return user
}

const appleRow = (page: Page) =>
  page.getByText('Sign in with Apple', { exact: true }).locator('xpath=ancestor::div[contains(@class,"space-y-2")][1]')

test.describe('Sign in with Apple — Account settings', () => {
  test('an owner connects Apple, then disconnects it with the password', async ({ page }) => {
    await stubAppleJs(page)
    let apple: AppleInfo = NOT_LINKED
    let methods = ['password']
    const user = await signInOwner(page, () => ({ hasPassword: true, apple, signInMethods: methods }))

    const links = await mockApplePost(page, '/auth/link/apple', () => {
      apple = LINKED_RELAY
      methods = ['password', 'apple']
      return { status: 200, body: { message: 'APPLE.S02', apple, signInMethods: methods } }
    })
    const unlinks = await mockApplePost(page, '/auth/unlink/apple', (body) => {
      if (body.password !== user.password) {
        return { status: 401, body: apiError(401, 'APPLE.E08', 'apple_link_proof_invalid') }
      }
      apple = NOT_LINKED
      methods = ['password']
      return { status: 200, body: { message: 'APPLE.S03', apple, signInMethods: methods } }
    })

    await page.goto('/account')
    const row = appleRow(page)
    await expect(row).toContainText('Use your Apple ID to sign in.', { timeout: 15_000 })

    // Connect: Apple's popup, then POST /auth/link/apple with the credential.
    await row.getByRole('button', { name: 'Connect' }).click()
    await expect(row).toContainText('Connected', { timeout: 10_000 })
    await expect(row).toContainText("Apple's relay address abc123@privaterelay.appleid.com")
    expect(links).toHaveLength(1)
    expect(links[0]).toMatchObject({ platform: 'web', authorizationCode: 'mock-apple-code', identityToken: 'mock-apple-id-token' })
    expect(links[0].intent).toBeUndefined()

    // Disconnect: the account has a password, so it is asked for.
    await row.getByRole('button', { name: 'Disconnect' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Disconnect Apple')
    await dialog.getByLabel('Current password').fill('Wrong123!')
    await dialog.getByRole('button', { name: 'Disconnect Apple' }).click()
    await expect(dialog).toContainText('Incorrect password. Please try again.', { timeout: 10_000 })

    await dialog.getByLabel('Current password').fill(user.password)
    await dialog.getByRole('button', { name: 'Disconnect Apple' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10_000 })
    await expect(row).toContainText('Use your Apple ID to sign in.')
    expect(unlinks[unlinks.length - 1]).toEqual({ password: user.password })
  })

  test('Apple as the only sign-in method leads to "set a password first"', async ({ page }) => {
    await stubAppleJs(page)
    await signInOwner(page, () => ({ hasPassword: false, apple: LINKED_RELAY, signInMethods: ['apple'] }))
    const unlinks = await mockApplePost(page, '/auth/unlink/apple', () => ({ status: 500, body: {} }))

    await page.goto('/account')
    const row = appleRow(page)
    await expect(row).toContainText('Connected', { timeout: 15_000 })
    await row.getByRole('button', { name: 'Disconnect' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Set a password first')
    await dialog.getByRole('button', { name: 'Set up password' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(unlinks).toHaveLength(0)
  })

  test('the API refusing the last sign-in method shows the same path', async ({ page }) => {
    await stubAppleJs(page)
    // /me is stale (says Google remains); the API knows better.
    await signInOwner(page, () => ({ hasPassword: false, apple: LINKED_RELAY, signInMethods: ['google', 'apple'] }))
    const unlinks = await mockApplePost(page, '/auth/unlink/apple', () => ({
      status: 400,
      body: apiError(400, 'APPLE.E11', 'apple_unlink_last_method'),
    }))

    await page.goto('/account')
    const row = appleRow(page)
    await expect(row).toContainText('Connected', { timeout: 15_000 })
    await row.getByRole('button', { name: 'Disconnect' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText("You'll still be able to sign in with Google.")
    await dialog.getByRole('button', { name: 'Disconnect Apple' }).click()
    await expect(dialog).toContainText('Set a password first', { timeout: 10_000 })
    expect(unlinks[0]).toEqual({})
  })
})
