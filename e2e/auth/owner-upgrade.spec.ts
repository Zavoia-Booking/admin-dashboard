import { expect, test, type APIRequestContext } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { makeTestUser, type TestUser } from '../fixtures/test-helpers'
import { getUserBusinessRoles, getUserIdByEmail } from '../fixtures/test-db'

/**
 * An existing marketplace customer adds business-owner access in place: the
 * "Account already exists" dialog asks for the account password (no email
 * link) and the user lands on the setup wizard with the OWNER role.
 */

async function registerCustomerViaApi(ctx: APIRequestContext, user: TestUser): Promise<void> {
  const res = await ctx.post('/api/marketplace/auth/register', {
    data: {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })
  if (!res.ok()) throw new Error(`registerCustomerViaApi failed: ${res.status()} ${await res.text()}`)
}

async function roles(email: string): Promise<string[]> {
  const userId = await getUserIdByEmail(email)
  return (await getUserBusinessRoles(userId)).map((r) => r.role)
}

test.describe('Owner upgrade in place (no email)', () => {
  test('register with a customer email → password dialog → OWNER role and /welcome', async ({ page, request }) => {
    const customer = makeTestUser()
    await registerCustomerViaApi(request, customer)

    const register = new RegisterPage(page)
    await register.goto()
    // A different password in the form: the dialog asks for the existing one.
    await register.register({ ...customer, password: 'Other123!@#' })

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Account already exists')).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText(/send confirmation email/i)).toHaveCount(0)
    await expect(dialog.locator('#cred-email')).toHaveValue(customer.email)

    await dialog.locator('#cred-password').fill(customer.password)
    await dialog.getByRole('button', { name: 'Add my business' }).click()

    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
    expect(await roles(customer.email)).toEqual(expect.arrayContaining(['customer', 'owner']))
  })

  test('wrong password keeps the dialog open with an error and grants nothing', async ({ page, request }) => {
    const customer = makeTestUser()
    await registerCustomerViaApi(request, customer)

    const register = new RegisterPage(page)
    await register.goto()
    await register.register(customer)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Account already exists')).toBeVisible({ timeout: 10_000 })
    await dialog.locator('#cred-password').fill('Wrong123!@#')
    await dialog.getByRole('button', { name: 'Add my business' }).click()

    await expect(dialog.getByRole('alert')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/register/)
    expect(await roles(customer.email)).not.toContain('owner')
  })

  test('customer signing in on the dashboard gets the same password dialog', async ({ page, request }) => {
    const customer = makeTestUser()
    await registerCustomerViaApi(request, customer)

    const login = new LoginPage(page)
    await login.goto()
    await login.email.fill(customer.email)
    await login.password.fill(customer.password)
    await login.submit.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Account already exists')).toBeVisible({ timeout: 10_000 })
    await dialog.locator('#cred-password').fill(customer.password)
    await dialog.getByRole('button', { name: 'Add my business' }).click()

    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
    expect(await roles(customer.email)).toContain('owner')
  })

  test('owner-upgrade API rejects a wrong password with 401', async ({ request }) => {
    const customer = makeTestUser()
    await registerCustomerViaApi(request, customer)
    const res = await request.post('/api/auth/owner-upgrade', {
      data: { email: customer.email, password: 'Wrong123!@#' },
    })
    expect(res.status()).toBe(401)
    expect(await roles(customer.email)).not.toContain('owner')
  })
})
