import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { Bienvenida } from './bienvenida'

export default async function BienvenidaPage() {
  const profile = await getProfile()
  if (profile) redirect('/')
  return <Bienvenida />
}
