import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { logout } from '@/app/(auth)/login/actions'
import { TabBarFamilia } from '@/components/tab-bar-familia'

/**
 * Layout para padres/madres. Si el rol no es 'padre', se redirige al staff.
 */
export default async function FamiliaLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  if (!profile) {
    await logout()
    redirect('/login')
  }

  if (profile.rol !== 'padre') {
    redirect('/pedidos')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <TabBarFamilia nombre={profile.nombre} />
    </div>
  )
}
