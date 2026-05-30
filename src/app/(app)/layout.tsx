import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { logout } from '@/app/(auth)/login/actions'
import { TabBar } from '@/components/tab-bar'

/**
 * Layout autenticado del staff (operadora, encargada, administrativo).
 * Padres se redirigen a /familia.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  if (!profile) {
    await logout()
    redirect('/login')
  }

  if (profile.rol === 'padre') {
    redirect('/familia')
  }

  if (profile.rol === 'encargada') {
    redirect('/encargada')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <TabBar rol={profile.rol} nombre={profile.nombre} />
    </div>
  )
}
