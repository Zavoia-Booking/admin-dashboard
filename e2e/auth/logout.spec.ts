import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { makeTestUser, registerViaApi } from '../fixtures/test-helpers'

test.describe('Logout', () => {
  test('logging out clears session and protected nav redirects to /login', async ({
    page,
    request,
  }) => {
    const user = makeTestUser()
    await registerViaApi(request, user)

    const login = new LoginPage(page)
    await login.goto()
    await login.login(user.email, user.password)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

    const response = await page.request.post('/api/auth/logout')
    expect(response.ok()).toBeTruthy()

    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
