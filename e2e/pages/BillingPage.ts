import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Page object for the billing & subscription tab on /account?tab=billing.
 *
 * The underlying component (BillingAndSubscriptionV2) carries no
 * `data-testid` attributes, so locators here lean on:
 *   - text labels (translated via en/settings.json)
 *   - aria-labels on the seat stepper (`'increment seats'` / `'decrement seats'`)
 *   - the stable `id="invoice-billing-details"` on the form card
 *   - `.bv2-*` CSS classes only as a last resort (history rows, SMS packs)
 *
 * Confirmation dialogs are Radix AlertDialogs, exposed as `role="alertdialog"`.
 */
export class BillingPage {
  readonly page: Page

  // Hero band
  readonly heroBand: Locator
  readonly heroPrimaryAction: Locator
  readonly upgradeHeroButton: Locator
  readonly managePaymentButton: Locator
  readonly renewButton: Locator
  readonly keepSubscriptionButton: Locator
  readonly revertChangeButton: Locator

  // Status pill / banners
  readonly statusPill: Locator

  // Subscription card
  readonly subscriptionCard: Locator
  readonly seatStepperDecrement: Locator
  readonly seatStepperIncrement: Locator
  readonly seatStepperValue: Locator
  readonly updateSeatsButton: Locator
  readonly cancelSubscriptionLink: Locator
  readonly abortPaymentButton: Locator

  // Invoice details form
  readonly invoiceDetailsCard: Locator
  readonly entityCompanyButton: Locator
  readonly entityPersonButton: Locator
  readonly fiscalCodeInput: Locator
  readonly registrationNumberInput: Locator
  readonly legalNameInput: Locator
  readonly addressInput: Locator
  readonly cityInput: Locator
  readonly countyInput: Locator
  readonly countryCodeInput: Locator
  readonly saveBillingDetailsButton: Locator
  readonly invoiceVerifiedPill: Locator
  readonly unconfiguredHint: Locator

  // SMS card
  readonly smsCard: Locator
  readonly smsLockedBanner: Locator
  readonly smsInactiveEmpty: Locator
  readonly smsBuyButton: Locator
  readonly smsPackages: Locator
  readonly smsBalanceValue: Locator

  // History card
  readonly historyCard: Locator
  readonly historyEmpty: Locator
  readonly historyRows: Locator
  readonly historyDownloadLinks: Locator

  // Confirmation dialog (Radix AlertDialog)
  readonly confirmDialog: Locator

  // Toasts
  readonly toasts: Locator

  constructor(page: Page) {
    this.page = page

    this.heroBand = page.locator('.bv2-hero')
    this.heroPrimaryAction = this.heroBand.locator('button').last()
    this.upgradeHeroButton = page.locator('.bv2-btn-upgrade-hero').first()
    this.managePaymentButton = page.getByRole('button', { name: /Manage payment|Payment Method/i })
    this.renewButton = page.getByRole('button', { name: /^Renew/i })
    this.keepSubscriptionButton = page.getByRole('button', { name: /Keep subscription/i })
    this.revertChangeButton = page.getByRole('button', { name: /Revert change/i })

    this.statusPill = this.heroBand.locator('.bv2-pill').first()

    this.subscriptionCard = page.locator('.bv2-col').first().locator('div').first()
    this.seatStepperDecrement = page.getByRole('button', { name: 'decrement seats' })
    this.seatStepperIncrement = page.getByRole('button', { name: 'increment seats' })
    this.seatStepperValue = page.locator('.bv2-stepper-v')
    this.updateSeatsButton = page.locator('.bv2-btn-upgrade').first()
    this.cancelSubscriptionLink = page.locator('.bv2-cancel-link')
    this.abortPaymentButton = page.locator('.bv2-btn-cancel-payment')

    this.invoiceDetailsCard = page.locator('#invoice-billing-details')
    this.entityCompanyButton = this.invoiceDetailsCard.getByRole('button', {
      name: 'Company',
      exact: true,
    })
    this.entityPersonButton = this.invoiceDetailsCard.getByRole('button', {
      name: 'Individual',
      exact: true,
    })
    this.fiscalCodeInput = this.invoiceDetailsCard.locator('#bv2-cui')
    this.registrationNumberInput = this.invoiceDetailsCard.locator('#bv2-reg')
    this.legalNameInput = this.invoiceDetailsCard.locator('#bv2-legal, #bv2-fullname').first()
    this.addressInput = this.invoiceDetailsCard.locator('#bv2-addr')
    this.cityInput = this.invoiceDetailsCard.locator('#bv2-city')
    this.countyInput = this.invoiceDetailsCard.locator('#bv2-county')
    this.countryCodeInput = this.invoiceDetailsCard.locator('#bv2-country')
    this.saveBillingDetailsButton = this.invoiceDetailsCard.getByRole('button', {
      name: /Save details/i,
    })
    this.invoiceVerifiedPill = this.invoiceDetailsCard.locator('.bv2-pill-verified')
    this.unconfiguredHint = this.invoiceDetailsCard.getByText(
      /You haven't set up invoice details yet/i,
    )

    this.smsCard = page.locator('.bv2-col').nth(1).locator('div').filter({ hasText: 'SMS credits' }).first()
    this.smsLockedBanner = page.getByText(/SMS locked during trial/i)
    this.smsInactiveEmpty = page.getByText(/Subscribe to buy SMS/i)
    this.smsBuyButton = page.getByRole('button', { name: /^Buy \d+ SMS/i })
    this.smsPackages = page.locator('.bv2-sms-pack')
    this.smsBalanceValue = page.locator('.bv2-bal-val').first()

    this.historyCard = page.locator('.bv2-col').nth(1).locator('div').filter({ hasText: 'Purchase history' }).first()
    this.historyEmpty = page.getByText(/No invoices yet/i)
    this.historyRows = page.locator('.bv2-hist-row')
    this.historyDownloadLinks = page.locator('a.bv2-hist-dl')

    this.confirmDialog = page.getByRole('alertdialog')
    this.toasts = page.locator('[data-sonner-toast]')
  }

  async goto(): Promise<void> {
    await this.page.goto('/account?tab=billing')
    // Wait for the hero to render — confirms billing tab actually mounted.
    await expect(this.heroBand).toBeVisible({ timeout: 15_000 })
  }

  async expectStatusText(pattern: RegExp | string): Promise<void> {
    await expect(this.statusPill).toBeVisible({ timeout: 10_000 })
    await expect(this.statusPill).toHaveText(pattern)
  }

  async incrementSeatsBy(n: number): Promise<void> {
    for (let i = 0; i < n; i++) await this.seatStepperIncrement.click()
  }

  async decrementSeatsBy(n: number): Promise<void> {
    for (let i = 0; i < n; i++) await this.seatStepperDecrement.click()
  }

  async confirmDialogClick(buttonName: string | RegExp): Promise<void> {
    await expect(this.confirmDialog).toBeVisible({ timeout: 10_000 })
    await this.confirmDialog
      .getByRole('button', { name: buttonName, exact: false })
      .click()
  }

  async dismissDialog(): Promise<void> {
    await expect(this.confirmDialog).toBeVisible({ timeout: 10_000 })
    await this.confirmDialog
      .getByRole('button', { name: /^Cancel|Keep|No$/i })
      .first()
      .click()
  }

  async fillBillingDetails(values: {
    entity?: 'company' | 'person'
    fiscalCode?: string
    registrationNumber?: string
    legalName?: string
    address?: string
    city?: string
    county?: string
    countryCode?: string
  }): Promise<void> {
    if (values.entity === 'person') await this.entityPersonButton.click()
    if (values.entity === 'company') await this.entityCompanyButton.click()
    if (values.fiscalCode != null) await this.fiscalCodeInput.fill(values.fiscalCode)
    if (values.registrationNumber != null)
      await this.registrationNumberInput.fill(values.registrationNumber)
    if (values.legalName != null) await this.legalNameInput.fill(values.legalName)
    if (values.address != null) await this.addressInput.fill(values.address)
    if (values.city != null) await this.cityInput.fill(values.city)
    if (values.county != null) await this.countyInput.fill(values.county)
    if (values.countryCode != null) await this.countryCodeInput.fill(values.countryCode)
  }

  async expectToast(pattern: RegExp | string): Promise<void> {
    const toast = this.toasts.filter({ hasText: pattern }).first()
    await expect(toast).toBeVisible({ timeout: 10_000 })
  }
}
