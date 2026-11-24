import { expect, test } from '@playwright/test'
import { mockCalendarDefaults, sampleAppointment, sampleLocationContext } from '../fixtures/calendar-mocks'
import { setupAuthenticatedOwner } from '../fixtures/test-helpers'
import { CalendarPage } from '../pages/CalendarPage'

const client = { id: 501, firstName: 'Alex', lastName: 'Overlap' }
const conflict = { message: 'This customer already has an overlapping appointment.', details: { conflictType: 'customer_overlap' } }

function fixtureClock() {
  const now = new Date()
  now.setUTCHours(7, 0, 0, 0)
  const start = new Date(now)
  start.setUTCHours(13, 0, 0, 0)
  const target = new Date(start.getTime() + 60 * 60_000)
  const time = (date: Date) => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit',
  }).format(date)
  return { now, start, target, time, day: now.toISOString().slice(0, 10) }
}

test('creating an overlapping booking keeps the draft on cancel and retries the same booking only after confirmation', async ({ page, request }) => {
  const { now, start, time } = fixtureClock()
  await page.clock.setFixedTime(now)
  const [haircut] = sampleLocationContext().services
  await mockCalendarDefaults(page, {
    locationContext: { open247: true, services: [{ ...haircut, staffIds: [201], staffCount: 1 }] },
    availableSlots: { availableSlots: [start.toISOString()] },
  })
  await page.route('**/api/business-customers/picker-search', route => route.fulfill({
    json: { data: [client], pagination: { offset: 0, limit: 10, hasMore: false } },
  }))
  const requests: Record<string, unknown>[] = []
  await page.route('**/api/appointments/admin-create-group', route => {
    const payload = route.request().postDataJSON()
    requests.push(payload)
    return payload.allowCustomerOverlap
      ? route.fulfill({ status: 201, json: { appointments: [{ id: 4001 }] } })
      : route.fulfill({ status: 409, json: conflict })
  })
  await setupAuthenticatedOwner(page, request, { authMe: { entitlements: { status: 'active' } } })

  const calendar = new CalendarPage(page)
  await calendar.goto()
  await calendar.openAddForm()
  await calendar.addSlider.getByPlaceholder('Search clients...').fill('Alex Overlap')
  await page.getByText('Alex Overlap', { exact: true }).click()
  await page.getByRole('button', { name: 'Select services', exact: true }).click()
  const haircutOption = page.getByText('Haircut', { exact: true })
  if (!await haircutOption.isVisible()) await page.getByText('Hair', { exact: true }).click()
  await haircutOption.click()
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await page.locator('#appointment-date').click()
  await page.getByRole('button', { name: 'Today', exact: true }).last().click()
  const timePicker = page.locator('#appointment-time')
  await timePicker.evaluate(element => element.scrollIntoView({ block: 'center' }))
  await timePicker.click()
  await page.getByRole('button', { name: time(start), exact: true }).click()
  await page.locator('#appointment-notes').fill('Keep this draft')

  const save = page.getByRole('button', { name: 'Create appointment', exact: true })
  const warning = page.getByRole('alertdialog').filter({ hasText: 'Overlapping appointments' })
  await save.click()
  await expect(warning).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0]).toMatchObject({ customerId: client.id, scheduledAt: start.toISOString(), items: [{ serviceId: 301, staffUserId: 201 }] })
  expect(requests[0]).not.toHaveProperty('allowCustomerOverlap')
  await warning.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(warning).toBeHidden()
  await expect(page.locator('#appointment-notes')).toHaveValue('Keep this draft')
  expect(requests).toHaveLength(1)

  await save.click()
  await warning.getByRole('button', { name: 'Book anyway' }).click()
  await expect(calendar.addSlider).toBeHidden()
  expect(requests).toEqual([requests[0], requests[0], { ...requests[0], allowCustomerOverlap: true }])
})

test('editing an overlapping appointment retains the notes and still surfaces a staff conflict', async ({ page, request }) => {
  const { now, start, target, time, day } = fixtureClock()
  await page.clock.setFixedTime(now)
  const appointment = sampleAppointment({
    id: 4001, scheduledAt: start.toISOString(), customerName: 'Alex Overlap', staffUserIds: [201],
  })
  await mockCalendarDefaults(page, {
    day: { appointments: [appointment] }, locationContext: { open247: true },
    availableSlots: { availableSlots: [start.toISOString(), target.toISOString()] },
  })
  const requests: Record<string, unknown>[] = []
  await page.route('**/api/appointments/4001', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: {
      ...appointment,
      customer: client,
      teamMembers: [{ id: 201, firstName: 'Ana', lastName: 'Stylist' }],
      service: { id: 301, name: 'Haircut' },
      location: { id: 101, name: 'E2E Test Salon — Main' },
      notes: '',
      price: 5000,
      currency: 'eur',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } })
    if (route.request().method() !== 'PUT') return route.fallback()
    const payload = route.request().postDataJSON()
    requests.push(payload)
    return payload.allowCustomerOverlap
      ? route.fulfill({ status: 409, json: { message: 'Staff conflict', details: { conflictType: 'staff_appointment' } } })
      : route.fulfill({ status: 409, json: conflict })
  })
  await setupAuthenticatedOwner(page, request, { authMe: { entitlements: { status: 'active' } } })
  await page.goto('/calendar?locationId=101&date=' + day + '&appointmentId=4001')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.locator('#appointment-time').click()
  await page.getByRole('button', { name: time(target), exact: true }).click()
  await page.locator('#appointment-notes').fill('Move only after consent')

  const save = page.getByRole('button', { name: 'Save changes', exact: true })
  await save.click()
  const warning = page.getByRole('alertdialog').filter({ hasText: 'Overlapping appointments' })
  await expect(warning).toBeVisible()
  await warning.getByRole('button', { name: 'Save anyway' }).click()
  await expect(page.locator('[data-sonner-toast]')).toContainText(/already booked|staff member|team member/i)
  await expect(page.locator('#appointment-notes')).toHaveValue('Move only after consent')
  expect(requests).toEqual([
    { scheduledAt: target.toISOString(), notes: 'Move only after consent' },
    { scheduledAt: target.toISOString(), notes: 'Move only after consent', allowCustomerOverlap: true },
  ])
})
