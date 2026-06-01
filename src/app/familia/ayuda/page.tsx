import { PageHeader } from '@/components/page-header'
import { AyudaContenido } from '@/app/(app)/ayuda/ayuda-contenido'

export const metadata = {
  title: 'Ayuda · ViandApp',
}

export default function AyudaFamiliaPage() {
  return (
    <div className="p-5 space-y-5">
      <PageHeader title="Ayuda" subtitle="Cómo usar ViandApp" />
      <AyudaContenido rol="padre" />
    </div>
  )
}
