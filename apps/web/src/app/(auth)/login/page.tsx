'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@netflix/ui'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub } from 'react-icons/fa'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/profiles')
    }
  }

  return (
    <div className="bg-netflix-black flex min-h-screen flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e1-14dd7f6bdb43/en-us/home-bg.jpg')",
        }}
      />
      <div className="bg-netflix-black/60 absolute inset-0" />
      <div className="from-netflix-black absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t to-transparent" />

      {/* Logo */}
      <nav className="relative z-10 flex items-center px-6 py-6 md:px-16">
        <Link
          href="/"
          className="text-netflix-red tracking-tightest text-3xl font-black drop-shadow-[0_2px_10px_rgba(229,9,20,0.4)]"
        >
          NETFLIX
        </Link>
      </nav>

      {/* Form card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="glass-strong animate-scale-in w-full max-w-md rounded-2xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.7)] ring-1 ring-white/5 sm:p-10">
          <h1 className="mb-2 text-3xl font-black">Sign In</h1>
          <p className="text-netflix-light-gray mb-8 text-sm">
            New to Netflix?{' '}
            <Link href="/register" className="font-semibold text-white hover:underline">
              Sign up now
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            {error && (
              <p className="text-netflix-red bg-netflix-red/10 border-netflix-red/30 rounded-lg border px-3 py-2 text-sm">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="danger"
              size="lg"
              loading={loading}
              className="active:scale-98 w-full !rounded-xl !font-bold transition-transform hover:scale-[1.02]"
            >
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="text-netflix-muted bg-transparent px-3 font-medium uppercase tracking-widest">
                or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => signIn('google', { callbackUrl: '/profiles' })}
              className="glass flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold transition hover:bg-white/15 active:scale-95"
            >
              <FcGoogle className="text-xl" /> Google
            </button>
            <button
              onClick={() => signIn('github', { callbackUrl: '/profiles' })}
              className="glass flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold transition hover:bg-white/15 active:scale-95"
            >
              <FaGithub className="text-xl" /> GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
