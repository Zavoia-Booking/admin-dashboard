import { expect, test } from '@playwright/test'
import { TeamInvitationPage } from '../pages/TeamInvitationPage'
import { mockTeamInvitation } from '../fixtures/auth-mocks'
import { VALID_PASSWORD } from '../fixtures/test-helpers'

test.describe('Team invitation', () => {
  test('needs-registration: completes the form and shows the Registration Complete state', async ({
    page,
  }) => {
    await mockTeamInvitation(page, {
      status: 'needs_registration',
      business: { id: 7, name: 'Bookaroo Studio' },
      email: 'invitee@test.com',
    })

    const invite = new TeamInvitationPage(page)
    await invite.goto('mock-team-invite-token')
    await invite.accept()

    await expect(page.getByText(/Bookaroo Studio/i)).toBeVisible({
      timeout: 10_000,
    })
    await invite.complete({
      firstName: 'Tina',
      lastName: 'Member',
      phone: '+40712345678',
      password: VALID_PASSWORD,
    })

    await expect(invite.completedTitle).toBeVisible({ timeout: 15_000 })
  })

  test('already-accepted invitation shows the all-set state', async ({
    page,
  }) => {
    await mockTeamInvitation(page, { status: 'accepted' })
    // The check call accepts the invitation for existing users, so opening the
    // link must not send it: only the ticked box + "Accept invitation" does.
    const checkRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/check-team-invitation')) {
        checkRequests.push(request.url())
      }
    })

    const invite = new TeamInvitationPage(page)
    await invite.goto('mock-team-invite-token')

    await expect(invite.acceptButton).toBeDisabled({ timeout: 10_000 })
    expect(checkRequests).toHaveLength(0)

    await invite.accept()
    await expect(invite.acceptedTitle).toBeVisible({ timeout: 10_000 })
    expect(checkRequests).toHaveLength(1)
  })

  test('invalid token shows the invalid-invitation state', async ({ page }) => {
    await mockTeamInvitation(page, { status: 'invalid' })

    const invite = new TeamInvitationPage(page)
    await invite.goto('mock-bad-token')
    await invite.accept()

    await expect(invite.errorTitle).toBeVisible({ timeout: 10_000 })
  })
})
