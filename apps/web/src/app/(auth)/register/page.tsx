'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@netflix/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const data = (await res.json()) as { error: string }
      setError(typeof data.error === 'string' ? data.error : 'Registration failed')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/profiles')
  }

  return (
    <div className="bg-netflix-black flex min-h-screen flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e1-14dd7f6bdb43/en-us/home-bg.jpg')",
        }}
      />
      <nav className="relative z-10 flex items-center px-8 py-6 md:px-16">
        <Link href="/" className="text-netflix-red text-3xl font-black tracking-tight">
          NETFLIX
        </Link>
      </nav>
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-md bg-black/75 p-12">
          <h1 className="mb-8 text-3xl font-bold">Create Account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
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
              placeholder="Password (min 8 characters)"
              required
              minLength={8}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" variant="danger" size="lg" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>
          <p className="text-netflix-light-gray mt-6 text-sm">
            By signing up, you agree to our Terms of Use and Privacy Policy.
          </p>
          <p className="text-netflix-light-gray mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline">
              Sign in.
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
