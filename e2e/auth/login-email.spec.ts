import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { makeTestUser, registerViaApi } from '../fixtures/test-helpers'

test.describe('Email login', () => {
  test('happy path: registered user logs in and lands on /dashboard', async ({
    page,
    request,
  }) => {
    const user = makeTestUser()
    await registerViaApi(request, user)

    const login = new LoginPage(page)
    await login.goto()
    await login.login(user.email, user.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })

  test('shows toast and stays on /login when email is unregistered', async ({
    page,
  }) => {
    const ghost = makeTestUser()
    const login = new LoginPage(page)
    await login.goto()
    await login.login(ghost.email, ghost.password)

    await expect(page.locator('[data-sonner-toast]')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows toast and stays on /login when password is wrong', async ({
    page,
    request,
  }) => {
    const user = makeTestUser()
    await registerViaApi(request, user)

    const login = new LoginPage(page)
    await login.goto()
    await login.login(user.email, 'WrongPassword123!')

    await expect(page.locator('[data-sonner-toast]')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page).toHaveURL(/\/login/)
  })
})
