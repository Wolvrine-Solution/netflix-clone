import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@netflix/ui'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-netflix-black text-white">
      {/* Hero */}
      <div className="relative flex flex-col min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e1-14dd7f6bdb43/en-us/home-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-netflix-black to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-netflix-black/70 to-transparent" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16">
          <div className="text-netflix-red text-4xl font-black tracking-tight">NETFLIX</div>
          <Link href="/login">
            <Button variant="danger" size="sm">Sign In</Button>
          </Link>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-4 py-20">
          <h1 className="text-4xl md:text-6xl font-black max-w-3xl leading-tight">
            Unlimited movies, TV shows, and more
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-200">
            Watch anywhere. Cancel anytime.
          </p>
          <p className="mt-4 text-lg text-gray-300">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 w-full max-w-xl">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 bg-black/70 border border-gray-500 rounded px-4 py-4 text-white placeholder-gray-400 outline-none focus:border-white"
            />
            <Link href="/register">
              <Button variant="danger" size="lg" className="w-full sm:w-auto whitespace-nowrap">
                Get Started &rsaquo;
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t-8 border-netflix-medium-gray">
        {[
          {
            title: 'Enjoy on your TV',
            description: 'Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.',
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
            description: 'Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.',
            icon: '💻',
            reverse: false,
          },
          {
            title: 'Create profiles for kids',
            description: "Send kids on adventures with their favorite characters in a space made just for them—free with your membership.",
            icon: '👨‍👩‍👧',
            reverse: true,
          },
        ].map((feature) => (
          <div key={feature.title} className="border-b-8 border-netflix-medium-gray py-16 px-8 md:px-16">
            <div className={`max-w-6xl mx-auto flex flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8`}>
              <div className="flex-1">
                <h2 className="text-3xl md:text-5xl font-black leading-tight">{feature.title}</h2>
                <p className="mt-4 text-xl text-gray-300">{feature.description}</p>
              </div>
              <div className="flex-1 flex justify-center text-9xl">{feature.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="border-t-8 border-netflix-medium-gray py-16 px-8 md:px-16">
        <h2 className="text-4xl font-black text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-2">
          {[
            { q: 'What is Netflix?', a: 'Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more.' },
            { q: 'How much does Netflix cost?', a: 'Watch Netflix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee.' },
            { q: 'Where can I watch?', a: 'Watch anywhere, anytime. Sign in with your Netflix account to watch instantly on the web.' },
            { q: 'How do I cancel?', a: 'Netflix is flexible. There are no pesky contracts and no commitments. You can easily cancel your account online in two clicks.' },
          ].map((faq) => (
            <details key={faq.q} className="group bg-netflix-medium-gray cursor-pointer">
              <summary className="flex items-center justify-between p-6 text-xl font-medium list-none">
                {faq.q}
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-6 pb-6 text-gray-300 text-lg border-t border-netflix-black mt-0">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-xl text-gray-300 mb-4">Ready to watch? Enter your email to create or restart your membership.</p>
          <Link href="/register">
            <Button variant="danger" size="lg">Get Started &rsaquo;</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-8 border-netflix-medium-gray py-12 px-8 md:px-16 text-netflix-light-gray text-sm">
        <p className="mb-6">Questions? Call 1-800-742-5877</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {['FAQ', 'Help Center', 'Account', 'Media Center', 'Investor Relations', 'Jobs', 'Privacy', 'Cookie Preferences', 'Corporate Information', 'Contact Us', 'Speed Test', 'Legal Notices'].map((link) => (
            <a key={link} href="#" className="hover:underline">{link}</a>
          ))}
        </div>
        <p>Netflix Clone — Built for learning purposes</p>
      </footer>
    </div>
  )
}
