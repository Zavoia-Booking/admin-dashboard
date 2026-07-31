/**
 * Customers flow e2e: manual add, the one-live-customer-per-email rule,
 * duplicate detection badges, merge resolution from both sides of the pair,
 * post-merge redirect, edit-email collision/dissolution, remove-dissolves-pair,
 * and status-badge i18n in the details popup + history slider.
 *
 * Real API + real DB end-to-end (no auth/me mocks): each test registers a
 * fresh owner, bootstraps a business, and logs in through the UI.
 */

import { test, expect, type Page } from '@playwright/test'
import {
  registerOwnerSession,
  createLocation,
  createService,
  assignMembersAtLocation,
  createAppointment,
  type ApiSession,
} from '../fixtures/reconciliation-seed'
import {
  createManualCustomerViaApi,
  seedMarketplaceCustomer,
  getBusinessCustomerRow,
  businessCustomerExists,
  removeCustomerViaApi,
} from '../fixtures/customers-seed'
import { LoginPage } from '../pages/LoginPage'

const RAW_STATUS_KEY_FRAGMENT = 'page.common.statuses'

function uniqueEmail(tag: string): string {
  return `cust-${tag}-${Math.random().toString(36).slice(2, 8)}@test.com`
}

async function loginAsOwner(page: Page, owner: ApiSession): Promise<void> {
  const login = new LoginPage(page)
  await login.goto()
  await login.login(owner.user.email, owner.user.password)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
}

async function gotoCustomers(page: Page): Promise<void> {
  await page.goto('/customers')
  await expect(page.getByRole('heading', { name: 'Customers', exact: true })).toBeVisible({ timeout: 15_000 })
}

async function openAddCustomerForm(page: Page): Promise<void> {
  // .first(): the empty list state renders a second "Add Customer" button
  // inside the EmptyState card.
  await page.getByRole('button', { name: 'Add Customer' }).first().click()
  await expect(page.locator('#add-customer-form')).toBeVisible()
}

async function submitAddCustomer(
  page: Page,
  args: { firstName: string; lastName?: string; email?: string },
): Promise<void> {
  const form = page.locator('#add-customer-form')
  await form.getByPlaceholder('e.g. John', { exact: true }).fill(args.firstName)
  if (args.lastName) await form.getByPlaceholder('e.g. Doe', { exact: true }).fill(args.lastName)
  if (args.email) await form.locator('#email').fill(args.email)
  await page.locator('button[form="add-customer-form"]').click()
}

const detailsDialog = (page: Page) =>
  page.getByRole('dialog').filter({ hasText: 'Customer details' })

test.describe('customers: add + duplicate rules', () => {
  test('adds a manual customer through the UI', async ({ page }) => {
    const owner = await registerOwnerSession()
    await loginAsOwner(page, owner)
    await gotoCustomers(page)

    await openAddCustomerForm(page)
    await submitAddCustomer(page, {
      firstName: 'Ana',
      lastName: 'Ionescu',
      email: uniqueEmail('add'),
    })

    await expect(page.getByText('Customer added successfully')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Ana Ionescu')).toBeVisible()
  })

  test('blocks adding a second manual customer with an email already in use', async ({ page }) => {
    const owner = await registerOwnerSession()
    const email = uniqueEmail('dupadd')
    await createManualCustomerViaApi(owner, { firstName: 'Prima', lastName: 'Client', email })

    await loginAsOwner(page, owner)
    await gotoCustomers(page)
    await expect(page.getByText('Prima Client')).toBeVisible()

    await openAddCustomerForm(page)
    await submitAddCustomer(page, { firstName: 'Copy', lastName: 'Cat', email })

    await expect(page.getByText("We couldn't add the customer")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('A customer with this email already exists')).toBeVisible()
    // No second card was created.
    await expect(page.getByText('Copy Cat')).toHaveCount(0)
  })

  test('blocks adding a manual customer whose email belongs to a marketplace customer', async ({ page }) => {
    const owner = await registerOwnerSession()
    const email = uniqueEmail('mkt')
    await seedMarketplaceCustomer({
      businessId: owner.businessId,
      email,
      firstName: 'Marta',
      lastName: 'Popescu',
    })

    await loginAsOwner(page, owner)
    await gotoCustomers(page)
    await expect(page.getByText('Marta Popescu')).toBeVisible()

    await openAddCustomerForm(page)
    await submitAddCustomer(page, { firstName: 'Manual', lastName: 'Twin', email })

    await expect(page.getByText("We couldn't add the customer")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('A customer with this email already exists')).toBeVisible()
  })
})

test.describe('customers: duplicate pair + merge', () => {
  for (const clickedSide of ['manual', 'marketplace'] as const) {
    test(`resolves a duplicate pair from the ${clickedSide} record`, async ({ page }) => {
      const owner = await registerOwnerSession()
      const email = uniqueEmail(`merge-${clickedSide}`)
      const manual = await createManualCustomerViaApi(owner, {
        firstName: 'Manu',
        lastName: 'Duplicat',
        email,
      })
      const marketplace = await seedMarketplaceCustomer({
        businessId: owner.businessId,
        email,
        firstName: 'Marius',
        lastName: 'Original',
        flagDuplicateOfManualId: manual.id,
      })

      await loginAsOwner(page, owner)
      await gotoCustomers(page)

      // Both records are listed, each flagged with the Duplicate badge.
      await expect(page.getByText('Manu Duplicat')).toBeVisible()
      await expect(page.getByText('Marius Original')).toBeVisible()
      await expect(page.getByText('Duplicate', { exact: true })).toHaveCount(2)

      const clickedName = clickedSide === 'manual' ? 'Manu Duplicat' : 'Marius Original'
      await page.getByText(clickedName).click()

      const dialog = detailsDialog(page)
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Duplicate detected').first()).toBeVisible()

      await dialog.getByRole('button', { name: 'Resolve duplicate' }).click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Resolve duplicate' }).click()

      await expect(page.getByText('Customers merged successfully')).toBeVisible({ timeout: 10_000 })

      // The popup must land on the surviving marketplace record with the
      // duplicate section gone — this exercises the mergedIntoCustomerId
      // redirect when the merge started from the manual side.
      await expect(dialog.getByText('Marius Original')).toBeVisible({ timeout: 10_000 })
      await expect(dialog.getByText('Marketplace', { exact: true })).toBeVisible()
      await expect(dialog.getByText('Duplicate detected')).toHaveCount(0)

      await dialog.getByRole('button', { name: 'Close' }).click()

      // List now shows only the survivor, unflagged.
      await expect(page.getByText('Manu Duplicat')).toHaveCount(0)
      await expect(page.getByText('Marius Original')).toBeVisible()
      await expect(page.getByText('Duplicate', { exact: true })).toHaveCount(0)

      // DB state: manual soft-merged into the survivor; survivor fully cleared.
      const manualRow = await getBusinessCustomerRow(manual.id)
      expect(manualRow.status).toBe('merged')
      expect(manualRow.conflictStatus).toBe('merged')
      expect(manualRow.mergedIntoCustomerId).toBe(marketplace.businessCustomerId)

      const survivorRow = await getBusinessCustomerRow(marketplace.businessCustomerId)
      expect(survivorRow.status).not.toBe('merged')
      expect(survivorRow.conflictStatus).toBe('none')
      expect(survivorRow.duplicateOfId).toBeNull()

      // Re-adding the merged email must be blocked — the marketplace record
      // still owns it.
      await openAddCustomerForm(page)
      await submitAddCustomer(page, { firstName: 'Again', lastName: 'Duplicat', email })
      await expect(page.getByText("We couldn't add the customer")).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('A customer with this email already exists')).toBeVisible()
    })
  }
})

test.describe('customers: edit email rules', () => {
  test('blocks renaming a manual customer into an email already in use', async ({ page }) => {
    const owner = await registerOwnerSession()
    const emailA = uniqueEmail('edit-a')
    const emailB = uniqueEmail('edit-b')
    await createManualCustomerViaApi(owner, { firstName: 'Alfa', lastName: 'Unu', email: emailA })
    const b = await createManualCustomerViaApi(owner, { firstName: 'Beta', lastName: 'Doi', email: emailB })

    await loginAsOwner(page, owner)
    await gotoCustomers(page)

    await page.getByText('Beta Doi').click()
    const dialog = detailsDialog(page)
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Edit' }).click()

    const editForm = page.locator('#edit-customer-form')
    await expect(editForm).toBeVisible()
    await editForm.locator('#email').fill(emailA)
    await page.locator('button[form="edit-customer-form"]').click()

    await expect(page.getByText("We couldn't update the customer")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('A customer with this email already exists')).toBeVisible()

    const rowB = await getBusinessCustomerRow(b.id)
    expect(rowB.email).toBe(emailB)
  })

  test('renaming a flagged manual customer’s email dissolves the duplicate pair', async ({ page }) => {
    const owner = await registerOwnerSession()
    const email = uniqueEmail('dissolve')
    const manual = await createManualCustomerViaApi(owner, {
      firstName: 'Flag',
      lastName: 'Gone',
      email,
    })
    const marketplace = await seedMarketplaceCustomer({
      businessId: owner.businessId,
      email,
      firstName: 'Keeps',
      lastName: 'Account',
      flagDuplicateOfManualId: manual.id,
    })

    await loginAsOwner(page, owner)
    await gotoCustomers(page)
    await expect(page.getByText('Duplicate', { exact: true })).toHaveCount(2)

    await page.getByText('Flag Gone').click()
    const dialog = detailsDialog(page)
    await dialog.getByRole('button', { name: 'Edit' }).click()

    const editForm = page.locator('#edit-customer-form')
    await expect(editForm).toBeVisible()
    await editForm.locator('#email').fill(uniqueEmail('renamed'))
    await page.locator('button[form="edit-customer-form"]').click()

    await expect(page.getByText('Customer updated successfully')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Duplicate', { exact: true })).toHaveCount(0)

    const manualRow = await getBusinessCustomerRow(manual.id)
    expect(manualRow.conflictStatus).toBe('none')
    const marketplaceRow = await getBusinessCustomerRow(marketplace.businessCustomerId)
    expect(marketplaceRow.conflictStatus).toBe('none')
    expect(marketplaceRow.duplicateOfId).toBeNull()
  })
})

test.describe('customers: removing one side of a pair', () => {
  test('deleting either record clears the partner’s duplicate flag', async ({ page: _page }) => {
    const owner = await registerOwnerSession()

    // Remove the MARKETPLACE side → manual partner must be unflagged.
    const email1 = uniqueEmail('rm-mkt')
    const manual1 = await createManualCustomerViaApi(owner, { firstName: 'Left', lastName: 'Alone', email: email1 })
    const mkt1 = await seedMarketplaceCustomer({
      businessId: owner.businessId,
      email: email1,
      firstName: 'Del',
      lastName: 'Mkt',
      flagDuplicateOfManualId: manual1.id,
    })
    await removeCustomerViaApi(owner, mkt1.businessCustomerId)
    expect(await businessCustomerExists(mkt1.businessCustomerId)).toBe(false)
    const manual1Row = await getBusinessCustomerRow(manual1.id)
    expect(manual1Row.conflictStatus).toBe('none')

    // Remove the MANUAL side → marketplace partner must be unflagged.
    const email2 = uniqueEmail('rm-man')
    const manual2 = await createManualCustomerViaApi(owner, { firstName: 'Del', lastName: 'Man', email: email2 })
    const mkt2 = await seedMarketplaceCustomer({
      businessId: owner.businessId,
      email: email2,
      firstName: 'Still', lastName: 'Here',
      flagDuplicateOfManualId: manual2.id,
    })
    await removeCustomerViaApi(owner, manual2.id)
    expect(await businessCustomerExists(manual2.id)).toBe(false)
    const mkt2Row = await getBusinessCustomerRow(mkt2.businessCustomerId)
    expect(mkt2Row.conflictStatus).toBe('none')
    expect(mkt2Row.duplicateOfId).toBeNull()
  })
})

test.describe('customers: history + status badge i18n', () => {
  test('details popup and history slider render translated status badges', async ({ page }) => {
    const owner = await registerOwnerSession()
    const location = await createLocation(owner)
    const service = await createService(owner, { locationIds: [location.id] })
    await assignMembersAtLocation(owner, {
      locationId: location.id,
      serviceId: service.id,
      userIds: [owner.userId],
    })
    const customer = await createManualCustomerViaApi(owner, {
      firstName: 'Hist',
      lastName: 'Client',
      email: uniqueEmail('hist'),
    })
    await createAppointment(owner, {
      serviceId: service.id,
      locationId: location.id,
      customerId: customer.id,
      staffUserId: owner.userId,
    })

    await loginAsOwner(page, owner)
    await gotoCustomers(page)

    await page.getByText('Hist Client').click()
    const dialog = detailsDialog(page)
    await expect(dialog).toBeVisible()

    // Recent activity in the popup: translated status, never the raw i18n key.
    // Admin-created appointments start as 'confirmed'.
    await expect(dialog.getByText('Recent activity')).toBeVisible()
    await expect(dialog.getByText('Confirmed', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(RAW_STATUS_KEY_FRAGMENT)).toHaveCount(0)

    // Full history slider: same guarantees (this is where the raw
    // `page.common.statuses.*` keys leaked before the fix).
    await dialog.getByRole('button', { name: 'See history' }).click()
    await expect(page.getByText('Customer history')).toBeVisible()
    await expect(page.getByText('Became your customer').last()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Confirmed', { exact: true }).last()).toBeVisible()
    await expect(page.getByText(RAW_STATUS_KEY_FRAGMENT)).toHaveCount(0)
  })
})
