import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { logout } from '@/app/(auth)/login/actions'
import { TabBar } from '@/components/tab-bar'
import { OnboardingTour } from '@/components/onboarding-tour'

export default async function EncargadaLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) {
    await logout()
    redirect('/login')
  }
  if (profile.rol !== 'encargada' && profile.rol !== 'administrativo') {
    redirect(profile.rol === 'padre' ? '/familia' : '/pedidos')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <TabBar rol={profile.rol} nombre={profile.nombre} />
      <OnboardingTour rol={profile.rol} />
    </div>
  )
}
