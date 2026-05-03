import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { mockBusinessSelectorLogin } from '../fixtures/auth-mocks'
import { makeTestUser, VALID_PASSWORD } from '../fixtures/test-helpers'

test.describe('Login with business selector', () => {
  test('shows the business selector when user owns multiple businesses, picks one, lands on /dashboard', async ({
    page,
  }) => {
    const businesses = [
      { id: 11, name: 'Acme Salon', role: 'owner' },
      { id: 12, name: 'Beta Barbers', role: 'owner' },
    ]
    await mockBusinessSelectorLogin(page, businesses)

    const login = new LoginPage(page)
    await login.goto()
    await login.login(makeTestUser().email, VALID_PASSWORD)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog).toContainText('Select Your Business')

    await dialog.getByRole('button', { name: /Acme Salon/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })
})
