import { expect, test } from '@playwright/test'
import { RegisterPage } from '../pages/RegisterPage'
import { makeTestUser, registerViaApi } from '../fixtures/test-helpers'

test.describe('Email registration', () => {
  test('happy path: a new owner registers and lands on /welcome', async ({
    page,
  }) => {
    const user = makeTestUser()
    const register = new RegisterPage(page)
    await register.goto()
    await register.register(user)

    await expect(page).toHaveURL(/\/welcome/, { timeout: 15_000 })
  })

  test('blocks submission when terms are not accepted', async ({ page }) => {
    const user = makeTestUser()
    const register = new RegisterPage(page)
    await register.goto()

    await register.firstName.fill(user.firstName)
    await register.lastName.fill(user.lastName)
    await register.email.fill(user.email)
    await register.password.fill(user.password)

    await expect(register.submit).toBeDisabled()
  })

  test('rejects weak password', async ({ page }) => {
    const user = makeTestUser({ password: 'weakpw' })
    const register = new RegisterPage(page)
    await register.goto()
    await register.fill(user)

    await expect(register.submit).toBeDisabled()
  })

  test('rejects duplicate email', async ({ page, request }) => {
    const user = makeTestUser()
    await registerViaApi(request, user)

    const register = new RegisterPage(page)
    await register.goto()
    await register.register({ ...user, firstName: 'Other', lastName: 'Person' })

    await expect(page).toHaveURL(/\/register/, { timeout: 10_000 })
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({
      timeout: 10_000,
    })
  })
})
