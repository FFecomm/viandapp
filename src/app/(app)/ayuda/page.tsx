import { getProfile } from '@/lib/auth/profile'
import { PageHeader } from '@/components/page-header'
import { AyudaContenido } from './ayuda-contenido'

export const metadata = {
  title: 'Ayuda · ViandApp',
}

export default async function AyudaPage() {
  const profile = await getProfile()
  return (
    <div className="p-5 space-y-5">
      <PageHeader title="Ayuda" subtitle="Cómo usar tu sección de la app" />
      <AyudaContenido rol={profile?.rol ?? 'operadora'} />
    </div>
  )
}
