import { expect, test } from '@playwright/test'
import { mockGoogleAuth, presetOauthContext } from '../fixtures/auth-mocks'

test.describe('Account status prompts (via mocked Google auth)', () => {
  test('disabled account: shows the Account Inactive prompt', async ({
    page,
  }) => {
    await presetOauthContext(page, 'login')
    await mockGoogleAuth(page, { behavior: 'account_disabled' })

    await page.goto('/auth/callback?code=mock-code&state=mock-state')
    await expect(page.getByText('Account Inactive')).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      page.getByRole('button', { name: 'Reactivate', exact: true }),
    ).toBeVisible()
  })

  test('scheduled-for-deletion account: shows the deletion prompt', async ({
    page,
  }) => {
    await presetOauthContext(page, 'login')
    await mockGoogleAuth(page, { behavior: 'scheduled_for_deletion' })

    await page.goto('/auth/callback?code=mock-code&state=mock-state')
    await expect(
      page.getByText('Account Scheduled for Deletion'),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByRole('button', { name: 'Keep my account', exact: true }),
    ).toBeVisible()
  })
})
