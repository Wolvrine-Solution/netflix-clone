import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { ContentModal } from '@/components/home/ContentModal'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-netflix-black">
      <Navbar />
      <main className="pb-20 md:pb-0">{children}</main>
      <MobileNav />
      <ContentModal />
    </div>
  )
}
