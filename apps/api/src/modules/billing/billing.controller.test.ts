import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Stripe from 'stripe'
import {
  eq,
  eventEntitlement,
  liveEvent,
  liveChannel,
  purchase,
  stripeWebhookEvent,
  subscription,
} from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'
import { StripeService } from './stripe.service'

let t: TestApp
let stripeSvc: StripeService
const fake = {
  customers: { create: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  paymentIntents: { create: vi.fn() },
  webhooks: new Stripe('sk_test_dummy').webhooks,
}

beforeAll(async () => {
  t = await createTestApp()
  stripeSvc = t.app.get(StripeService)
})
afterAll(() => t.close())
beforeEach(async () => {
  await t.reset()
  vi.restoreAllMocks()
  vi.spyOn(stripeSvc, 'get').mockReturnValue(fake as unknown as Stripe)
  vi.spyOn(stripeSvc, 'webhookSecret').mockReturnValue('whsec_test')
  vi.spyOn(stripeSvc, 'priceFor').mockImplementation((p) =>
    p === 'PREMIUM' ? 'price_premium' : undefined
  )
  fake.customers.create.mockReset().mockResolvedValue({ id: 'cus_1' })
  fake.checkout.sessions.create
    .mockReset()
    .mockResolvedValue({ id: 'cs_1', url: 'https://stripe/x' })
  fake.paymentIntents.create.mockReset().mockResolvedValue({ id: 'pi_1', client_secret: 'secret' })
})

function signed(event: object) {
  const payload = JSON.stringify(event)
  const header = fake.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' })
  return { payload, header }
}

async function postWebhook(event: object, header?: string) {
  const { payload, header: sig } = signed(event)
  const res = await t.app.inject({
    method: 'POST',
    url: '/webhooks/stripe',
    payload,
    headers: {
      'content-type': 'application/json',
      ...(header === '' ? {} : { 'stripe-signature': header ?? sig }),
    },
  })
  return { status: res.statusCode, body: res.json() }
}

describe('auth', () => {
  it('requires a token on billing routes', async () => {
    for (const p of ['/subscription', '/history']) {
      expect((await t.request('GET', `/api/v1/billing${p}`)).status).toBe(401)
    }
    expect((await t.request('POST', '/api/v1/billing/checkout', { body: {} })).status).toBe(401)
  })
})

describe('GET /subscription and /history', () => {
  it('returns null data without a subscription, then the row', async () => {
    const u = await t.seedUser()
    const token = await t.token(u.id)
    expect((await t.request('GET', '/api/v1/billing/subscription', { token })).body).toEqual({
      data: null,
    })
    await t.db.insert(subscription).values({ userId: u.id, plan: 'PREMIUM' })
    const res = await t.request('GET', '/api/v1/billing/subscription', { token })
    expect(res.body.data.plan).toBe('PREMIUM')
  })

  it('lists the caller purchases newest first', async () => {
    const u = await t.seedUser()
    const other = await t.seedUser()
    await t.db.insert(purchase).values([
      { userId: u.id, type: 'PPV', amountCents: 100, createdAt: new Date('2024-01-01') },
      { userId: u.id, type: 'PPV', amountCents: 200, createdAt: new Date('2024-02-01') },
      { userId: other.id, type: 'PPV', amountCents: 999 },
    ])
    const res = await t.request('GET', '/api/v1/billing/history', { token: await t.token(u.id) })
    expect(res.body.data.map((p: { amountCents: number }) => p.amountCents)).toEqual([200, 100])
  })
})

describe('POST /checkout', () => {
  const body = { plan: 'PREMIUM', successUrl: 'https://a.dev/ok', cancelUrl: 'https://a.dev/no' }

  it('validates the body', async () => {
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/v1/billing/checkout', {
      token: await t.token(u.id),
      body: { plan: 'GOLD', successUrl: 'nope', cancelUrl: 'x' },
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Validation error/)
  })

  it('creates a customer once and returns the checkout url', async () => {
    const u = await t.seedUser()
    const token = await t.token(u.id)
    const res = await t.request('POST', '/api/v1/billing/checkout', { token, body })
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ url: 'https://stripe/x', sessionId: 'cs_1' })
    expect(fake.checkout.sessions.create.mock.calls[0]![0]).toMatchObject({
      customer: 'cus_1',
      line_items: [{ price: 'price_premium', quantity: 1 }],
      metadata: { userId: u.id, plan: 'PREMIUM' },
    })
    await t.request('POST', '/api/v1/billing/checkout', { token, body })
    expect(fake.customers.create).toHaveBeenCalledTimes(1)
    const [sub] = await t.db.select().from(subscription).where(eq(subscription.userId, u.id))
    expect(sub!.stripeCustomerId).toBe('cus_1')
  })

  it('fails with 500 when Stripe is not configured', async () => {
    vi.spyOn(stripeSvc, 'get').mockReturnValue(null)
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/v1/billing/checkout', {
      token: await t.token(u.id),
      body,
    })
    expect(res.status).toBe(500)
  })

  it('fails when no price is configured for the plan', async () => {
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/v1/billing/checkout', {
      token: await t.token(u.id),
      body: { ...body, plan: 'BASIC' },
    })
    expect(res.status).toBe(500)
  })
})

describe('POST /ppv', () => {
  it('creates a purchase and an event entitlement', async () => {
    const u = await t.seedUser()
    const [ch] = await t.db.insert(liveChannel).values({ name: 'c', slug: 'c' }).returning()
    const [ev] = await t.db
      .insert(liveEvent)
      .values({ channelId: ch!.id, title: 'Fight', scheduledStart: new Date() })
      .returning()
    const res = await t.request('POST', '/api/v1/billing/ppv', {
      token: await t.token(u.id),
      body: { eventId: ev!.id, amountCents: 1999 },
    })
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ clientSecret: 'secret' })
    const rows = await t.db.select().from(purchase).where(eq(purchase.userId, u.id))
    expect(rows[0]).toMatchObject({ amountCents: 1999, stripePaymentIntentId: 'pi_1' })
    expect(await t.db.select().from(eventEntitlement)).toHaveLength(1)
  })

  it('rejects non-positive amounts', async () => {
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/v1/billing/ppv', {
      token: await t.token(u.id),
      body: { eventId: 'e', amountCents: 0 },
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /webhooks/stripe', () => {
  it('rejects a missing signature', async () => {
    const res = await postWebhook({ id: 'evt_1', type: 'x' }, '')
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Missing stripe-signature/)
  })

  it('rejects a bad signature without recording the event', async () => {
    const res = await postWebhook({ id: 'evt_1', type: 'x' }, 't=1,v1=bad')
    expect(res.status).toBe(400)
    expect(await t.db.select().from(stripeWebhookEvent)).toHaveLength(0)
  })

  it('activates a subscription on checkout.session.completed and ignores replays', async () => {
    const u = await t.seedUser()
    const event = {
      id: 'evt_c',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: u.id, plan: 'PREMIUM' },
          customer: 'cus_9',
          subscription: 'sub_9',
        },
      },
    }
    const first = await postWebhook(event)
    expect(first).toEqual({ status: 200, body: { received: true, duplicate: false } })
    const [sub] = await t.db.select().from(subscription).where(eq(subscription.userId, u.id))
    expect(sub).toMatchObject({
      plan: 'PREMIUM',
      status: 'ACTIVE',
      stripeCustomerId: 'cus_9',
      stripeSubId: 'sub_9',
    })

    await t.db.update(subscription).set({ status: 'CANCELED' }).where(eq(subscription.userId, u.id))
    const replay = await postWebhook(event)
    expect(replay.body.duplicate).toBe(true)
    const [after] = await t.db.select().from(subscription).where(eq(subscription.userId, u.id))
    expect(after!.status).toBe('CANCELED')
  })

  it('maps subscription.updated statuses and period end', async () => {
    const u = await t.seedUser()
    await t.db
      .insert(subscription)
      .values({ userId: u.id, stripeSubId: 'sub_1', stripeCustomerId: 'cus_1' })
    const end = 1_900_000_000
    await postWebhook({
      id: 'evt_u',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1',
          status: 'past_due',
          cancel_at_period_end: true,
          current_period_end: end,
        },
      },
    })
    const [sub] = await t.db.select().from(subscription).where(eq(subscription.userId, u.id))
    expect(sub).toMatchObject({ status: 'PAST_DUE', cancelAtPeriodEnd: true })
    expect(sub!.currentPeriodEnd!.getTime()).toBe(end * 1000)

    await postWebhook({
      id: 'evt_d',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_1',
          status: 'canceled',
          cancel_at_period_end: false,
          current_period_end: end,
        },
      },
    })
    const [gone] = await t.db.select().from(subscription).where(eq(subscription.userId, u.id))
    expect(gone!.status).toBe('CANCELED')
  })

  it('marks PAST_DUE on invoice.payment_failed and tolerates unknown events', async () => {
    const u = await t.seedUser()
    await t.db.insert(subscription).values({ userId: u.id, stripeCustomerId: 'cus_f' })
    await postWebhook({
      id: 'evt_f',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_f' } },
    })
    const [sub] = await t.db.select().from(subscription).where(eq(subscription.userId, u.id))
    expect(sub!.status).toBe('PAST_DUE')
    const other = await postWebhook({ id: 'evt_o', type: 'charge.refunded', data: { object: {} } })
    expect(other.status).toBe(200)
  })
})
