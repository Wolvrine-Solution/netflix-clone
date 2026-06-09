'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FiCheck, FiX, FiAlertCircle, FiCreditCard, FiZap } from 'react-icons/fi'
import { api } from '@/lib/api'

interface Subscription {
  plan: string; status: string; currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean
}

const PLANS = [
  {
    id: 'BASIC', name: 'Basic', price: 8.99,
    features: ['HD available', '720p quality', '1 screen at a time', 'Ad-supported'],
    limits: ['No 4K', 'No downloads'],
    color: 'border-gray-700',
    popular: false,
  },
  {
    id: 'STANDARD', name: 'Standard', price: 13.99,
    features: ['Full HD', '1080p quality', '2 screens at a time', 'No ads'],
    limits: ['No 4K'],
    color: 'border-gray-700',
    popular: true,
  },
  {
    id: 'PREMIUM', name: 'Premium', price: 17.99,
    features: ['Ultra HD', '4K quality', '4 screens at a time', 'No ads', 'Spatial Audio', 'Downloads'],
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
    api.history.get('_') // warm session
      .catch(() => {})
    // In a real app, call /api/subscriptions to get current sub
    // For this demo, get from session if available
    const s = (session as { subscription?: Subscription }).subscription
    setSubscription(s ?? null)
    setLoading(false)
  }, [session])

  async function changePlan(planId: string) {
    setUpgrading(planId)
    try {
      // In a real app: POST /api/subscriptions/change { plan: planId }
      await new Promise((r) => setTimeout(r, 1500)) // demo delay
      setSubscription((s) => ({ ...s, plan: planId, status: 'ACTIVE' } as Subscription))
    } finally { setUpgrading(null) }
  }

  const currentPlan = subscription?.plan
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin text-3xl text-netflix-red">↻</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-white text-sm mb-1">← Back</button>
            <h1 className="text-3xl font-bold">Subscription</h1>
          </div>
          {isActive && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-700/30 px-4 py-2 rounded-xl">
              <FiZap className="flex-shrink-0" />
              {subscription?.status === 'TRIALING' ? 'Free Trial Active' : 'Subscription Active'}
            </div>
          )}
        </div>

        {/* Current Plan Summary */}
        {subscription ? (
          <div className="bg-netflix-dark-gray rounded-2xl border border-gray-800 p-6 mb-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl font-bold">{currentPlan}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    subscription.status === 'ACTIVE' ? 'bg-green-900/40 text-green-400' :
                    subscription.status === 'TRIALING' ? 'bg-blue-900/40 text-blue-400' :
                    'bg-yellow-900/40 text-yellow-400'
                  }`}>{subscription.status}</span>
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-gray-500 mt-1">
                    {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button className="bg-netflix-medium-gray hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <FiCreditCard /> Billing History
                </button>
                <button className="text-red-400 hover:text-red-300 text-sm px-4 py-2 rounded-lg transition">
                  Cancel Subscription
                </button>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                <FiAlertCircle />
                Your subscription will end at the current billing period. Resubscribe to keep access.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-netflix-dark-gray rounded-2xl border border-gray-800 p-6 mb-10 flex items-center gap-4">
            <FiAlertCircle className="text-yellow-400 text-2xl flex-shrink-0" />
            <div>
              <p className="font-semibold">No active subscription</p>
              <p className="text-sm text-gray-400">Choose a plan below to start watching.</p>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <h2 className="text-xl font-semibold mb-6">
          {subscription ? 'Change Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const isUpgrading = upgrading === plan.id
            return (
              <div
                key={plan.id}
                className={`relative bg-netflix-dark-gray rounded-2xl border-2 p-6 flex flex-col ${isCurrent ? 'border-netflix-red' : plan.color}`}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-netflix-red text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-netflix-red text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                    <FiCheck className="text-[10px]" /> Current Plan
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500 text-sm mb-1">/month</span>
                  </div>
                </div>

                <div className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <FiCheck className="text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{f}</span>
                    </div>
                  ))}
                  {plan.limits.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <FiX className="text-gray-600 flex-shrink-0" />
                      <span className="text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !isCurrent && changePlan(plan.id)}
                  disabled={isCurrent || isUpgrading}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${
                    isCurrent
                      ? 'bg-netflix-red/20 text-netflix-red cursor-default border border-netflix-red/30'
                      : 'bg-netflix-red hover:bg-netflix-red-hover text-white disabled:opacity-60'
                  }`}
                >
                  {isUpgrading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">↻</span> Updating…
                    </span>
                  ) : isCurrent ? 'Your Plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Plans are billed monthly. Cancel anytime. Prices may vary by region.
          <br />
          This is a demo — no real billing is implemented.
        </p>
      </div>
    </div>
  )
}
