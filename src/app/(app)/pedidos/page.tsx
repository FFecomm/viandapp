import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { puedeEscribirPedidos } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { fechaHoyAR, formatFecha } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PedidoCardItem, type PedidoCard } from './pedido-card'
import { RealtimeRefresh } from './realtime-refresh'

type SearchParams = { fecha?: string; grado?: string }

export default async function PedidosPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await getProfile()
  const fecha = (searchParams.fecha ?? '').trim() || fechaHoyAR()
  const grado = (searchParams.grado ?? '').trim()

  const supabase = createClient()

  type Row = {
    id: string
    menu: string
    observaciones: string | null
    forma_pago_vianda: PedidoCard['forma_pago_vianda']
    es_agregado: boolean
    fecha: string
    created_at: string
    alumno: { id: string; nombre_completo: string; grado: string; division: string } | null
    pedido_productos: {
      cantidad: number
      forma_pago: PedidoCard['forma_pago_vianda']
      precio_al_momento: number
      producto: { nombre: string } | null
    }[]
  }

  const { data: rows } = await supabase
    .from('pedidos')
    .select(`
      id, menu, observaciones, forma_pago_vianda, es_agregado, fecha, created_at,
      alumno:alumno_id ( id, nombre_completo, grado, division ),
      pedido_productos ( cantidad, forma_pago, precio_al_momento, producto:producto_id ( nombre ) )
    `)
    .eq('fecha', fecha)
    .order('created_at', { ascending: false })
    .returns<Row[]>()

  const pedidos: PedidoCard[] = (rows ?? []).map((r) => ({
    id: r.id,
    menu: r.menu,
    observaciones: r.observaciones,
    forma_pago_vianda: r.forma_pago_vianda,
    es_agregado: r.es_agregado,
    alumno: r.alumno,
    productos: (r.pedido_productos ?? []).map((pp) => ({
      nombre: pp.producto?.nombre ?? 'Producto',
      cantidad: pp.cantidad,
      forma_pago: pp.forma_pago,
    })),
  }))

  const filtrados = grado ? pedidos.filter((p) => p.alumno?.grado === grado) : pedidos

  const esHoy = fecha === fechaHoyAR()
  const puedeBorrar = !!profile && puedeEscribirPedidos(profile.rol)
  const puedeCargar = puedeBorrar

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title={esHoy ? 'Pedidos de hoy' : `Pedidos del ${formatFecha(fecha)}`}
        subtitle={`${filtrados.length} pedido${filtrados.length === 1 ? '' : 's'}`}
        action={
          puedeCargar ? (
            <Link href="/pedidos/nuevo" className={cn(buttonVariants(), 'h-11 px-4')}>
              <Plus className="size-4" />
              Cargar
            </Link>
          ) : (
            <Link href={`/planilla?fecha=${fecha}`} className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-4')}>
              <FileText className="size-4" />
              Imprimir
            </Link>
          )
        }
      />

      <form method="GET" className="flex items-center gap-2">
        <input
          type="date"
          name="fecha"
          defaultValue={fecha}
          className="h-11 px-3 rounded-lg border bg-background text-base flex-1"
        />
        <input
          type="text"
          name="grado"
          defaultValue={grado}
          placeholder="Grado"
          inputMode="numeric"
          className="h-11 w-20 px-3 rounded-lg border bg-background text-base text-center"
        />
      </form>

      {!filtrados.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {grado ? 'No hay pedidos en ese grado para esta fecha.' : 'Todavía no hay pedidos para esta fecha.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtrados.map((p) => (
            <li key={p.id}>
              <PedidoCardItem pedido={p} puedeBorrar={puedeBorrar} />
            </li>
          ))}
        </ul>
      )}

      <RealtimeRefresh fecha={fecha} />
    </div>
  )
}
