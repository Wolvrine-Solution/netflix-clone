import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@netflix/ui'

export default function LandingPage() {
  return (
    <div className="bg-netflix-black min-h-screen text-white">
      {/* Hero */}
      <div className="relative flex min-h-screen flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e1-14dd7f6bdb43/en-us/home-bg.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="from-netflix-black absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent" />
          <div className="from-netflix-black/70 absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16">
          <div className="text-netflix-red text-4xl font-black tracking-tight">NETFLIX</div>
          <Link href="/login">
            <Button variant="danger" size="sm">
              Sign In
            </Button>
          </Link>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Unlimited movies, TV shows, and more
          </h1>
          <p className="mt-4 text-xl text-gray-200 md:text-2xl">Watch anywhere. Cancel anytime.</p>
          <p className="mt-4 text-lg text-gray-300">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
          <div className="mt-6 flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 rounded border border-gray-500 bg-black/70 px-4 py-4 text-white placeholder-gray-400 outline-none focus:border-white"
            />
            <Link href="/register">
              <Button variant="danger" size="lg" className="w-full whitespace-nowrap sm:w-auto">
                Get Started &rsaquo;
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-netflix-medium-gray border-t-8">
        {[
          {
            title: 'Enjoy on your TV',
            description:
              'Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.',
            icon: '📺',
            reverse: false,
          },
          {
            title: 'Download your shows to watch offline',
            description: 'Save your favorites easily and always have something to watch.',
            icon: '📱',
            reverse: true,
          },
          {
            title: 'Watch everywhere',
            description:
              'Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.',
            icon: '💻',
            reverse: false,
          },
          {
            title: 'Create profiles for kids',
            description:
              'Send kids on adventures with their favorite characters in a space made just for them—free with your membership.',
            icon: '👨‍👩‍👧',
            reverse: true,
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="border-netflix-medium-gray border-b-8 px-8 py-16 md:px-16"
          >
            <div
              className={`mx-auto flex max-w-6xl flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8`}
            >
              <div className="flex-1">
                <h2 className="text-3xl font-black leading-tight md:text-5xl">{feature.title}</h2>
                <p className="mt-4 text-xl text-gray-300">{feature.description}</p>
              </div>
              <div className="flex flex-1 justify-center text-9xl">{feature.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="border-netflix-medium-gray border-t-8 px-8 py-16 md:px-16">
        <h2 className="mb-8 text-center text-4xl font-black">Frequently Asked Questions</h2>
        <div className="mx-auto max-w-3xl space-y-2">
          {[
            {
              q: 'What is Netflix?',
              a: 'Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more.',
            },
            {
              q: 'How much does Netflix cost?',
              a: 'Watch Netflix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee.',
            },
            {
              q: 'Where can I watch?',
              a: 'Watch anywhere, anytime. Sign in with your Netflix account to watch instantly on the web.',
            },
            {
              q: 'How do I cancel?',
              a: 'Netflix is flexible. There are no pesky contracts and no commitments. You can easily cancel your account online in two clicks.',
            },
          ].map((faq) => (
            <details key={faq.q} className="bg-netflix-medium-gray group cursor-pointer">
              <summary className="flex list-none items-center justify-between p-6 text-xl font-medium">
                {faq.q}
                <span className="text-2xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="border-netflix-black mt-0 border-t px-6 pb-6 text-lg text-gray-300">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="mb-4 text-xl text-gray-300">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
          <Link href="/register">
            <Button variant="danger" size="lg">
              Get Started &rsaquo;
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-netflix-medium-gray text-netflix-light-gray border-t-8 px-8 py-12 text-sm md:px-16">
        <p className="mb-6">Questions? Call 1-800-742-5877</p>
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            'FAQ',
            'Help Center',
            'Account',
            'Media Center',
            'Investor Relations',
            'Jobs',
            'Privacy',
            'Cookie Preferences',
            'Corporate Information',
            'Contact Us',
            'Speed Test',
            'Legal Notices',
          ].map((link) => (
            <a key={link} href="#" className="hover:underline">
              {link}
            </a>
          ))}
        </div>
        <p>Netflix Clone — Built for learning purposes</p>
      </footer>
    </div>
  )
}
