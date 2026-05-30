import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { rutaInicio } from '@/lib/auth/roles'

/**
 * Landing tras login. Redirige según el rol.
 * Padres → /familia · Staff → /pedidos
 */
export default async function HomePage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  redirect(rutaInicio(profile.rol))
}
