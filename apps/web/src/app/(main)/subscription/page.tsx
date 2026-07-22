'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FiCheck, FiX, FiAlertCircle, FiCreditCard, FiZap } from 'react-icons/fi'
import { api } from '@/lib/api'

interface Subscription {
  plan: string
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
}

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: 8.99,
    features: ['HD available', '720p quality', '1 screen at a time', 'Ad-supported'],
    limits: ['No 4K', 'No downloads'],
    color: 'border-gray-700',
    popular: false,
  },
  {
    id: 'STANDARD',
    name: 'Standard',
    price: 13.99,
    features: ['Full HD', '1080p quality', '2 screens at a time', 'No ads'],
    limits: ['No 4K'],
    color: 'border-gray-700',
    popular: true,
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 17.99,
    features: [
      'Ultra HD',
      '4K quality',
      '4 screens at a time',
      'No ads',
      'Spatial Audio',
      'Downloads',
    ],
    limits: [],
    color: 'border-netflix-red',
    popular: false,
  },
]

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    api.billing
      .subscription()
      .then((res) => setSubscription(res.data.data))
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false))
  }, [session])

  async function changePlan(planId: string) {
    setUpgrading(planId)
    try {
      const origin = window.location.origin
      const res = await api.billing.checkout(
        planId,
        `${origin}/subscription?success=1`,
        `${origin}/subscription`
      )
      if (res.data.data?.url) {
        window.location.href = res.data.data.url
        return
      }
      setSubscription((s) => ({ ...s, plan: planId, status: 'ACTIVE' }) as Subscription)
    } finally {
      setUpgrading(null)
    }
  }

  const currentPlan = subscription?.plan
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'

  if (loading) {
    return (
      <div className="bg-netflix-black flex min-h-screen items-center justify-center">
        <div className="text-netflix-red animate-spin text-3xl">↻</div>
      </div>
    )
  }

  return (
    <div className="bg-netflix-black min-h-screen text-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-1 text-sm text-gray-500 hover:text-white"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">Subscription</h1>
          </div>
          {isActive && (
            <div className="flex items-center gap-2 rounded-xl border border-green-700/30 bg-green-900/20 px-4 py-2 text-sm text-green-400">
              <FiZap className="flex-shrink-0" />
              {subscription?.status === 'TRIALING' ? 'Free Trial Active' : 'Subscription Active'}
            </div>
          )}
        </div>

        {/* Current Plan Summary */}
        {subscription ? (
          <div className="bg-netflix-dark-gray mb-10 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{currentPlan}</h2>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      subscription.status === 'ACTIVE'
                        ? 'bg-green-900/40 text-green-400'
                        : subscription.status === 'TRIALING'
                          ? 'bg-blue-900/40 text-blue-400'
                          : 'bg-yellow-900/40 text-yellow-400'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="mt-1 text-sm text-gray-500">
                    {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button className="bg-netflix-medium-gray flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition hover:bg-gray-700">
                  <FiCreditCard /> Billing History
                </button>
                <button className="rounded-lg px-4 py-2 text-sm text-red-400 transition hover:text-red-300">
                  Cancel Subscription
                </button>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400">
                <FiAlertCircle />
                Your subscription will end at the current billing period. Resubscribe to keep
                access.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-netflix-dark-gray mb-10 flex items-center gap-4 rounded-2xl border border-gray-800 p-6">
            <FiAlertCircle className="flex-shrink-0 text-2xl text-yellow-400" />
            <div>
              <p className="font-semibold">No active subscription</p>
              <p className="text-sm text-gray-400">Choose a plan below to start watching.</p>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <h2 className="mb-6 text-xl font-semibold">
          {subscription ? 'Change Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const isUpgrading = upgrading === plan.id
            return (
              <div
                key={plan.id}
                className={`bg-netflix-dark-gray relative flex flex-col rounded-2xl border-2 p-6 ${isCurrent ? 'border-netflix-red' : plan.color}`}
              >
                {plan.popular && !isCurrent && (
                  <div className="bg-netflix-red absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="bg-netflix-red absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-4 py-1 text-xs font-semibold text-white">
                    <FiCheck className="text-[10px]" /> Current Plan
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-1 flex items-end gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="mb-1 text-sm text-gray-500">/month</span>
                  </div>
                </div>

                <div className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <FiCheck className="flex-shrink-0 text-green-400" />
                      <span className="text-gray-300">{f}</span>
                    </div>
                  ))}
                  {plan.limits.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <FiX className="flex-shrink-0 text-gray-600" />
                      <span className="text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !isCurrent && changePlan(plan.id)}
                  disabled={isCurrent || isUpgrading}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                    isCurrent
                      ? 'bg-netflix-red/20 text-netflix-red border-netflix-red/30 cursor-default border'
                      : 'bg-netflix-red hover:bg-netflix-red-hover text-white disabled:opacity-60'
                  }`}
                >
                  {isUpgrading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">↻</span> Updating…
                    </span>
                  ) : isCurrent ? (
                    'Your Plan'
                  ) : (
                    `Switch to ${plan.name}`
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          Plans are billed monthly via Stripe Checkout. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
