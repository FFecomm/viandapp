import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'

/**
 * Landing tras login. Todos los roles van a "Pedidos del día" por defecto.
 * El tab bar permitirá navegar a las demás secciones según el rol.
 */
export default async function HomePage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  redirect('/pedidos')
}
