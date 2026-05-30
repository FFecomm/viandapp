import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { fechaHoyAR, formatFecha, FORMAS_PAGO_LABEL_CORTO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BorrarMiPedidoButton } from './borrar-mi-pedido-button'
import type { FormaPago } from '@/lib/supabase/types'

type Row = {
  id: string
  fecha: string
  menu: string
  observaciones: string | null
  forma_pago_vianda: FormaPago
  es_agregado: boolean
  alumno: { nombre_completo: string; grado: string; division: string } | null
  pedido_productos: { cantidad: number; producto: { nombre: string } | null }[]
}

export default async function HistorialPage() {
  await requireRole(['padre'])
  const supabase = createClient()
  const hoy = fechaHoyAR()

  const { data: rows } = await supabase
    .from('pedidos')
    .select(`
      id, fecha, menu, observaciones, forma_pago_vianda, es_agregado,
      alumno:alumno_id ( nombre_completo, grado, division ),
      pedido_productos ( cantidad, producto:producto_id ( nombre ) )
    `)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60)
    .returns<Row[]>()

  const pedidos = rows ?? []
  const futuros = pedidos.filter((p) => p.fecha >= hoy)
  const pasados = pedidos.filter((p) => p.fecha < hoy)

  const colorByFormaPago: Record<FormaPago, string> = {
    credito: 'bg-violet-100 text-violet-900',
    transferencia: 'bg-emerald-100 text-emerald-900',
    efectivo: 'bg-emerald-100 text-emerald-900',
    a_deber: 'bg-red-100 text-red-900',
  }

  function PedidoCard({ p, futuro }: { p: Row; futuro: boolean }) {
    return (
      <article className={cn('rounded-xl border p-4 space-y-2', futuro && 'border-primary/30')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{p.alumno?.nombre_completo}</p>
            <p className="text-sm text-muted-foreground">{p.alumno?.grado}° {p.alumno?.division}</p>
          </div>
          <Badge className={cn('shrink-0', colorByFormaPago[p.forma_pago_vianda])}>
            {FORMAS_PAGO_LABEL_CORTO[p.forma_pago_vianda]}
          </Badge>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">{formatFecha(p.fecha)} · </span>
          {p.menu.length === 1 ? `Menú ${p.menu}` : p.menu}
        </p>
        {p.observaciones ? <p className="text-sm text-muted-foreground italic">«{p.observaciones}»</p> : null}
        {p.pedido_productos.length > 0 && (
          <ul className="text-sm text-muted-foreground">
            {p.pedido_productos.map((pp, i) => (
              <li key={i}>+ {pp.cantidad > 1 ? `${pp.cantidad}× ` : ''}{pp.producto?.nombre ?? 'Extra'}</li>
            ))}
          </ul>
        )}
        {futuro && (
          <div className="flex justify-end pt-1">
            <BorrarMiPedidoButton id={p.id} />
          </div>
        )}
      </article>
    )
  }

  return (
    <div className="p-5 space-y-6">
      <PageHeader title="Mis pedidos" />

      {futuros.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Próximos</h2>
          <ul className="space-y-3">
            {futuros.map((p) => <li key={p.id}><PedidoCard p={p} futuro /></li>)}
          </ul>
        </section>
      )}

      {pasados.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Pasados</h2>
          <ul className="space-y-3">
            {pasados.map((p) => <li key={p.id}><PedidoCard p={p} futuro={false} /></li>)}
          </ul>
        </section>
      )}

      {pedidos.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Todavía no cargaste pedidos.
        </div>
      )}
    </div>
  )
}
