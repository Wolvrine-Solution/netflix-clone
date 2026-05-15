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
    <div className="min-h-screen bg-netflix-black flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e1-14dd7f6bdb43/en-us/home-bg.jpg')" }}
      />
      <nav className="relative z-10 flex items-center px-8 py-6 md:px-16">
        <Link href="/" className="text-netflix-red text-3xl font-black tracking-tight">NETFLIX</Link>
      </nav>
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="bg-black/75 rounded-md p-12 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8">Sign In</h1>
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" variant="danger" size="lg" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-netflix-medium-gray" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-black/75 px-2 text-netflix-light-gray">OR</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => signIn('google', { callbackUrl: '/profiles' })}
              className="w-full flex items-center justify-center gap-3 bg-netflix-medium-gray hover:bg-netflix-medium-gray/80 text-white py-3 rounded font-semibold transition"
            >
              <FcGoogle className="text-xl" /> Sign in with Google
            </button>
            <button
              onClick={() => signIn('github', { callbackUrl: '/profiles' })}
              className="w-full flex items-center justify-center gap-3 bg-netflix-medium-gray hover:bg-netflix-medium-gray/80 text-white py-3 rounded font-semibold transition"
            >
              <FaGithub className="text-xl" /> Sign in with GitHub
            </button>
          </div>

          <p className="mt-8 text-netflix-light-gray">
            New to Netflix?{' '}
            <Link href="/register" className="text-white hover:underline">
              Sign up now.
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
