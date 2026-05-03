import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { makeTestUser, registerViaApi } from '../fixtures/test-helpers'

test.describe('Protected route + session hydration', () => {
  test('redirects to /login when hitting a protected route while logged out', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('keeps the user logged in across reload', async ({ page, request }) => {
    const user = makeTestUser()
    await registerViaApi(request, user)

    const login = new LoginPage(page)
    await login.goto()
    await login.login(user.email, user.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    await page.reload()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page).not.toHaveURL(/\/login/)
  })
})
