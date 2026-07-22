'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid credentials or insufficient permissions.')
      setLoading(false)
    } else {
      router.replace('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-netflix-red text-3xl font-black tracking-tight">NETFLIX</span>
          <p className="mt-1 text-sm text-gray-400">Admin Dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-8"
        >
          <h2 className="mb-2 text-xl font-bold">Sign In</h2>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-netflix-red hover:bg-netflix-red-hover w-full rounded-lg py-2.5 font-semibold text-white transition disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Admin access only. Regular users cannot log in here.
          </p>
        </form>
      </div>
    </div>
  )
}
