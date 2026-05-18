import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { logout } from '@/app/(auth)/login/actions'

/**
 * Layout para rutas autenticadas. Garantiza que existe un perfil en `usuarios`.
 * Si la cuenta de auth no tiene perfil (caso bootstrap), cerramos sesión y
 * mandamos al login con un mensaje.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  if (!profile) {
    await logout()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  )
}
