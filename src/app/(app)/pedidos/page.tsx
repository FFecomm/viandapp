import { getProfile } from '@/lib/auth/profile'
import { PageHeader } from '@/components/page-header'

export default async function PedidosPage() {
  const profile = await getProfile()
  const primer = profile?.nombre.split(' ')[0] ?? ''

  return (
    <div className="p-5 space-y-5">
      <PageHeader title={`Hola, ${primer}`} subtitle="Pedidos del día" />
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Acá va la lista de pedidos del día. (Tarea 7)
      </div>
    </div>
  )
}
