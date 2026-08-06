import { expect, test } from '@playwright/test'
import {
  assignMembersAtLocation,
  createCustomer,
  createLocation,
  createService,
  registerOwnerSession,
  type ApiSession,
} from '../fixtures/reconciliation-seed'
import {
  activeConsiderationTotal,
  activitiesForAppointment,
  appointmentExists,
  createMarketplaceAppointment,
  makeBundleAppointment,
  makeCompositeAppointment,
  sellerFor,
  setAppointmentStatus,
  setBillingIdentity,
  setBookingSource,
  setScheduledDate,
  waitForActivities,
  waitForStatus,
} from '../fixtures/dac7-seed'
import { createAppointment } from '../fixtures/reconciliation-seed'

/**
 * DAC7 ledger.
 *
 * Every assertion here reads the real test database: the feature is a database
 * side-effect, so mocked routes would prove nothing. Each test seeds its own
 * owner so rows never collide across the (serial) suite.
 */

interface Fixture {
  owner: ApiSession
  businessId: number
  locationId: number
  serviceId: number
  customerId: number
  staffUserId: number
}

async function seedFixture(): Promise<Fixture> {
  const owner = await registerOwnerSession()
  const location = await createLocation(owner)
  const service = await createService(owner, { locationIds: [location.id] })
  // The owner must be able to perform the service at the location, otherwise
  // admin-create rejects the booking.
  await assignMembersAtLocation(owner, {
    locationId: location.id,
    serviceId: service.id,
    userIds: [owner.userId],
  })
  const customer = await createCustomer(owner)
  return {
    owner,
    businessId: owner.businessId,
    locationId: location.id,
    serviceId: service.id,
    customerId: customer.id,
    staffUserId: owner.userId,
  }
}

function apptArgs(f: Fixture) {
  return {
    serviceId: f.serviceId,
    locationId: f.locationId,
    customerId: f.customerId,
    staffUserId: f.staffUserId,
  }
}

const currentYear = new Date().getFullYear()

/**
 * `date` columns come back from pg as JS Date objects at local midnight, so
 * compare on formatted local parts rather than on the raw string.
 */
function isoDay(value: unknown): string {
  const d = new Date(value as string)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

test.describe('DAC7 — recording rules', () => {
  test('marketplace + completed is recorded as one activity', async () => {
    const f = await seedFixture()
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))

    await setAppointmentStatus(f.owner, appt.id, 'completed')

    const rows = await waitForActivities(appt.id, 1)
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('active')
    expect(rows[0].sourceBusinessId).toBe(f.businessId)
    expect(rows[0].itemIndex).toBe(0)
    expect(rows[0].considerationMinor).toBeGreaterThan(0)
    expect(rows[0].platformFeeMinor).toBe(0)
  })

  test('a seller snapshot is created with the billing identity', async () => {
    const f = await seedFixture()
    await setBillingIdentity(f.businessId, {
      billingEntityType: 'company',
      individualType: null,
      legalName: 'Salon Test SRL',
      fiscalCode: 'RO12345678',
      registrationNumber: 'J40/1234/2020',
      billingAddress: 'Str. Testului 1',
      billingCountryCode: 'ro',
    })
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))

    await setAppointmentStatus(f.owner, appt.id, 'completed')
    await waitForActivities(appt.id, 1)

    const seller = await sellerFor(f.businessId, currentYear)
    expect(seller).not.toBeNull()
    expect(seller!.legalName).toBe('Salon Test SRL')
    expect(seller!.fiscalCode).toBe('RO12345678')
    expect(seller!.registrationNumber).toBe('J40/1234/2020')
    expect(seller!.billingEntityType).toBe('company')
    expect(seller!.countryCode).toBe('ro')
    expect(seller!.tinIssuingCountry).toBe('ro')
    expect(seller!.sourceDeletedAt).toBeNull()
  })

  test('a PFA is snapshotted as a natural person with its CUI', async () => {
    const f = await seedFixture()
    await setBillingIdentity(f.businessId, {
      billingEntityType: 'person',
      individualType: 'pfa',
      legalName: 'Ionescu Ana PFA',
      fiscalCode: 'RO87654321',
      billingCountryCode: 'ro',
      dateOfBirth: '1990-04-15',
    })
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))

    await setAppointmentStatus(f.owner, appt.id, 'completed')
    await waitForActivities(appt.id, 1)

    const seller = await sellerFor(f.businessId, currentYear)
    expect(seller!.billingEntityType).toBe('person')
    expect(seller!.individualType).toBe('pfa')
    expect(seller!.fiscalCode).toBe('RO87654321')
    expect(isoDay(seller!.dateOfBirth)).toBe('1990-04-15')
  })

  test.describe('non-marketplace sources are ignored', () => {
    for (const source of ['admin', 'phone', 'walk_in'] as const) {
      test(`${source} bookings produce no activity`, async () => {
        const f = await seedFixture()
        const appt = await createAppointment(f.owner, apptArgs(f))
        await setBookingSource(appt.id, source)

        await setAppointmentStatus(f.owner, appt.id, 'completed')
        await new Promise((r) => setTimeout(r, 1500))

        expect(await activitiesForAppointment(appt.id)).toHaveLength(0)
      })
    }
  })

  test('a marketplace booking that is not completed is not recorded', async () => {
    const f = await seedFixture()
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))

    await setAppointmentStatus(f.owner, appt.id, 'confirmed')
    await new Promise((r) => setTimeout(r, 1500))
    expect(await activitiesForAppointment(appt.id)).toHaveLength(0)

    await setAppointmentStatus(f.owner, appt.id, 'cancelled')
    await new Promise((r) => setTimeout(r, 1500))
    expect(await activitiesForAppointment(appt.id)).toHaveLength(0)
  })
})

test.describe('DAC7 — per-service expansion', () => {
  test('a discounted bundle of 3 services yields 3 rows summing to the price', async () => {
    const f = await seedFixture()
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))
    // Parts list at 50/30/20 but the bundle sells for 80 — reporting list
    // prices would overstate the consideration actually agreed.
    await makeBundleAppointment(
      appt.id,
      [
        { serviceId: f.serviceId, serviceName: 'Tuns', price: 5000 },
        { serviceId: f.serviceId, serviceName: 'Spalat', price: 3000 },
        { serviceId: f.serviceId, serviceName: 'Coafat', price: 2000 },
      ],
      8000,
    )

    await setAppointmentStatus(f.owner, appt.id, 'completed')

    const rows = await waitForActivities(appt.id, 3)
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.itemIndex)).toEqual([0, 1, 2])
    expect(rows.map((r) => r.serviceName)).toEqual(['Tuns', 'Spalat', 'Coafat'])
    expect(rows.map((r) => r.considerationMinor)).toEqual([4000, 2400, 1600])

    // The invariant that keeps reported totals honest.
    const sum = rows.reduce((acc, r) => acc + r.considerationMinor, 0)
    expect(sum).toBe(8000)
  })

  test('a composite run of 2 services + a 2-service bundle yields 4 rows', async () => {
    const f = await seedFixture()
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))
    await makeCompositeAppointment(
      appt.id,
      [
        { type: 'service', name: 'Manichiura', price: 4000, serviceId: f.serviceId },
        { type: 'service', name: 'Pedichiura', price: 5000, serviceId: f.serviceId },
        {
          type: 'bundle',
          name: 'Pachet ingrijire',
          price: 6000,
          bundleServices: [
            { serviceId: f.serviceId, serviceName: 'Masaj', price: 3000 },
            { serviceId: f.serviceId, serviceName: 'Masca', price: 3000 },
          ],
        },
      ],
      15000,
    )

    await setAppointmentStatus(f.owner, appt.id, 'completed')

    const rows = await waitForActivities(appt.id, 4)
    expect(rows).toHaveLength(4)
    expect(rows.map((r) => r.serviceName)).toEqual([
      'Manichiura',
      'Pedichiura',
      'Masaj',
      'Masca',
    ])
    expect(rows.reduce((acc, r) => acc + r.considerationMinor, 0)).toBe(15000)
  })

  test('quarter and year are derived from the appointment date', async () => {
    const cases: Array<{ date: string; quarter: number }> = [
      { date: `${currentYear}-02-10`, quarter: 1 },
      { date: `${currentYear}-05-20`, quarter: 2 },
      { date: `${currentYear}-07-01`, quarter: 3 },
      { date: `${currentYear}-12-31`, quarter: 4 },
    ]

    for (const c of cases) {
      const f = await seedFixture()
      const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))
      await setScheduledDate(appt.id, c.date)

      await setAppointmentStatus(f.owner, appt.id, 'completed')

      const rows = await waitForActivities(appt.id, 1)
      expect(rows[0].reportingQuarter, `${c.date} → Q${c.quarter}`).toBe(c.quarter)
      expect(rows[0].reportingYear).toBe(currentYear)
      expect(isoDay(rows[0].activityDate)).toBe(c.date)
    }
  })
})

test.describe('DAC7 — corrections', () => {
  test('un-completing voids the rows instead of deleting them', async () => {
    const f = await seedFixture()
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))
    await setAppointmentStatus(f.owner, appt.id, 'completed')
    await waitForActivities(appt.id, 1)

    await setAppointmentStatus(f.owner, appt.id, 'confirmed')

    const rows = await waitForStatus(appt.id, 'voided')
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('voided')
    expect(rows[0].voidedAt).not.toBeNull()
    expect(rows[0].voidedReason).toBeTruthy()
  })

  test('re-completing reactivates the same row, it does not duplicate', async () => {
    const f = await seedFixture()
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))
    await setAppointmentStatus(f.owner, appt.id, 'completed')
    const first = await waitForActivities(appt.id, 1)

    await setAppointmentStatus(f.owner, appt.id, 'confirmed')
    await waitForStatus(appt.id, 'voided')

    await setAppointmentStatus(f.owner, appt.id, 'completed')
    const rows = await waitForStatus(appt.id, 'active')

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(first[0].id)
    expect(rows[0].voidedAt).toBeNull()
  })

  test('cancelling after completion voids rather than deletes', async () => {
    const f = await seedFixture()
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))
    await setAppointmentStatus(f.owner, appt.id, 'completed')
    await waitForActivities(appt.id, 1)

    await setAppointmentStatus(f.owner, appt.id, 'cancelled')

    const rows = await waitForStatus(appt.id, 'voided')
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('voided')
  })
})

test.describe('DAC7 — survives account deletion', () => {
  test('ledger and identity outlive the purged business', async () => {
    const f = await seedFixture()
    await setBillingIdentity(f.businessId, {
      billingEntityType: 'company',
      individualType: null,
      legalName: 'Deleted Salon SRL',
      fiscalCode: 'RO99887766',
      billingAddress: 'Str. Ramasa 9',
      billingCountryCode: 'ro',
    })
    const appt = await createMarketplaceAppointment(f.owner, apptArgs(f))
    await setAppointmentStatus(f.owner, appt.id, 'completed')
    const before = await waitForActivities(appt.id, 1)
    const totalBefore = await activeConsiderationTotal(f.businessId)
    expect(totalBefore).toBeGreaterThan(0)

    const res = await f.owner.ctx.post('/api/auth/account/delete', {
      headers: {
        Authorization: `Bearer ${f.owner.accessToken}`,
        'x-csrf-token': f.owner.csrfToken,
      },
    })
    expect(res.ok(), `delete-account failed: ${res.status()}`).toBeTruthy()

    // The source records are gone …
    await expect
      .poll(async () => appointmentExists(appt.id), { timeout: 15000 })
      .toBe(false)

    // … but the evidence we are obliged to keep is not.
    const after = await activitiesForAppointment(appt.id)
    expect(after).toHaveLength(before.length)
    expect(await activeConsiderationTotal(f.businessId)).toBe(totalBefore)

    const seller = await sellerFor(f.businessId, currentYear)
    expect(seller).not.toBeNull()
    expect(seller!.sourceDeletedAt).not.toBeNull()
    expect(seller!.legalName).toBe('Deleted Salon SRL')
    expect(seller!.fiscalCode).toBe('RO99887766')
    expect(seller!.address).toBe('Str. Ramasa 9')
  })
})
