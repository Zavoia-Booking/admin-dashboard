import { expect, test } from '@playwright/test'
import { BillingPage } from '../pages/BillingPage'
import {
  mockBillingDefaults,
  mockUpdateBillingDetails,
  sampleBillingDetails,
} from '../fixtures/billing-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'

test.describe('Invoice billing details form', () => {
  test('unconfigured state shows the info banner and no Verified pill', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      billingDetails: { configured: false },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.unconfiguredHint).toBeVisible()
    await expect(billing.invoiceVerifiedPill).toHaveCount(0)
  })

  test('Save button is disabled until the form is dirty AND valid', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      billingDetails: { configured: false },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.saveBillingDetailsButton).toBeDisabled()

    // Filling only some required fields keeps the button disabled
    await billing.fillBillingDetails({
      entity: 'company',
      fiscalCode: 'RO99',
      legalName: 'My SRL',
    })
    await expect(billing.saveBillingDetailsButton).toBeDisabled()

    // Now fill the rest and the button enables
    await billing.fillBillingDetails({
      address: 'Bd. Magheru 12',
      city: 'Bucharest',
      county: 'Bucharest',
      countryCode: 'RO',
    })
    await expect(billing.saveBillingDetailsButton).toBeEnabled()
  })

  test('switching company → person hides the fiscal code / reg number fields', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      billingDetails: { configured: false },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.fiscalCodeInput).toBeVisible()
    await billing.entityPersonButton.click()
    await expect(billing.fiscalCodeInput).toHaveCount(0)
    await expect(billing.registrationNumberInput).toHaveCount(0)
    await expect(billing.legalNameInput).toBeVisible()
  })

  test('country code is auto-locked when the business has a detected country', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      billingDetails: { configured: false, suggestionsCountryCode: 'RO' },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(billing.countryCodeInput).toHaveValue('RO')
    await expect(billing.countryCodeInput).toBeDisabled()
  })

  test('Romania country code surfaces the RO flag indicator on the fiscal code field', async ({
    page,
    request,
  }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      billingDetails: { configured: false, suggestionsCountryCode: 'RO' },
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await expect(page.locator('.bv2-flag-ro')).toBeVisible()
  })

  test('successful save shows the success toast and the Verified pill on reload', async ({
    page,
    request,
  }) => {
    // Mock the other endpoints first so the billing-details handler we register
    // below runs first in LIFO order and fully owns GET/PUT for that route.
    await mockBillingDefaults(page, { state: 'trial' })

    // Single mutable route handler covers both GET (returns current state) and
    // PUT (flips state to configured). The provider triggers a reload after
    // a successful save, which re-fetches GET and renders the Verified pill.
    let configured = false
    const putRequests: Array<{ body: any }> = []
    await page.route('**/api/business/billing-details', async (route) => {
      const req = route.request()
      if (req.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sampleBillingDetails({ configured })),
        })
      }
      if (req.method() === 'PUT') {
        putRequests.push({ body: JSON.parse(req.postData() ?? '{}') })
        configured = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Saved' }),
        })
      }
      return route.fallback()
    })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.fillBillingDetails({
      entity: 'company',
      fiscalCode: 'RO99887766',
      legalName: 'My SRL',
      address: 'Bd. Magheru 12',
      city: 'Bucharest',
      county: 'Bucharest',
      countryCode: 'RO',
    })

    await billing.saveBillingDetailsButton.click()

    await billing.expectToast(/Billing details saved/i)
    await expect.poll(() => putRequests.length, { timeout: 10_000 }).toBe(1)
    expect(putRequests[0].body.billingEntityType).toBe('company')
    expect(putRequests[0].body.fiscalCode).toBe('RO99887766')
    expect(putRequests[0].body.billingCountryCode).toBe('ro')

    // After reload triggered by the provider, the Verified pill appears
    await expect(billing.invoiceVerifiedPill).toBeVisible({ timeout: 10_000 })
  })

  test('failed save surfaces an error toast', async ({ page, request }) => {
    await mockBillingDefaults(page, {
      state: 'trial',
      billingDetails: { configured: false },
    })
    await mockUpdateBillingDetails(page, { behavior: 'failure', status: 500 })
    await setupAuthenticatedOwner(page, request, {
      authMe: { entitlements: { status: 'trial', daysRemaining: 7 } },
    })
    const billing = new BillingPage(page)
    await billing.goto()

    await billing.fillBillingDetails({
      entity: 'company',
      fiscalCode: 'RO99',
      legalName: 'X',
      address: 'Y',
      city: 'Z',
      county: 'W',
      countryCode: 'RO',
    })
    await billing.saveBillingDetailsButton.click()
    await billing.expectToast(/Failed to save/i)
  })
})
