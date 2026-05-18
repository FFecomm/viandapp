import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { fechaHoyAR, formatFecha } from '@/lib/format'
import { ImprimirButton } from './imprimir-button'

type SearchParams = { fecha?: string }

type Row = {
  id: string
  menu: string
  observaciones: string | null
  alumno: { nombre_completo: string; grado: string; division: string } | null
  pedido_productos: { cantidad: number; producto: { nombre: string } | null }[]
}

const ORDEN_MENU = ['A', 'B', 'C', 'Hamburguesa', 'Fideos', 'Sandwich']

export default async function PlanillaPage({ searchParams }: { searchParams: SearchParams }) {
  const fecha = (searchParams.fecha ?? '').trim() || fechaHoyAR()
  const supabase = createClient()

  const { data: rows } = await supabase
    .from('pedidos')
    .select(`
      id, menu, observaciones,
      alumno:alumno_id ( nombre_completo, grado, division ),
      pedido_productos ( cantidad, producto:producto_id ( nombre ) )
    `)
    .eq('fecha', fecha)
    .order('menu')
    .returns<Row[]>()

  const pedidos = (rows ?? []).slice().sort((a, b) => {
    const ag = a.alumno?.grado ?? ''
    const bg = b.alumno?.grado ?? ''
    if (ag !== bg) return ag.localeCompare(bg, 'es-AR', { numeric: true })
    const ad = a.alumno?.division ?? ''
    const bd = b.alumno?.division ?? ''
    if (ad !== bd) return ad.localeCompare(bd)
    const an = a.alumno?.nombre_completo ?? ''
    const bn = b.alumno?.nombre_completo ?? ''
    return an.localeCompare(bn)
  })

  const totalesPorMenu: Record<string, number> = {}
  for (const p of pedidos) totalesPorMenu[p.menu] = (totalesPorMenu[p.menu] ?? 0) + 1
  const totalesOrden = ORDEN_MENU.filter((m) => totalesPorMenu[m]).map((m) => ({
    label: m.length === 1 ? `Menú ${m}` : m,
    total: totalesPorMenu[m],
  }))
  const totalGeneral = pedidos.length

  return (
    <div className="p-5 space-y-6 print:p-0">
      <div className="flex items-end justify-between gap-3 print:hidden">
        <form method="GET" className="flex-1">
          <label className="text-sm text-muted-foreground">Fecha</label>
          <Input type="date" name="fecha" defaultValue={fecha} className="h-11 text-base" />
        </form>
        <ImprimirButton />
      </div>

      <article className="print:text-black space-y-6">
        <header className="text-center space-y-1 print:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight print:text-xl">Planilla de salón</h1>
          <p className="text-sm text-muted-foreground print:text-black">{formatFecha(fecha)} · {totalGeneral} viandas</p>
        </header>

        {pedidos.length === 0 ? (
          <p className="text-center text-muted-foreground">Sin pedidos para esta fecha.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="border-b-2 border-foreground">
              <tr className="text-left">
                <th className="py-1.5 pr-2 font-medium">Curso</th>
                <th className="py-1.5 pr-2 font-medium">Nombre</th>
                <th className="py-1.5 pr-2 font-medium">Menú</th>
                <th className="py-1.5 pr-2 font-medium">Observaciones</th>
                <th className="py-1.5 font-medium">Extras</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-muted">
                  <td className="py-1.5 pr-2 whitespace-nowrap">{p.alumno?.grado}° {p.alumno?.division}</td>
                  <td className="py-1.5 pr-2">{p.alumno?.nombre_completo}</td>
                  <td className="py-1.5 pr-2">{p.menu.length === 1 ? `Menú ${p.menu}` : p.menu}</td>
                  <td className="py-1.5 pr-2 italic">{p.observaciones ?? ''}</td>
                  <td className="py-1.5">
                    {p.pedido_productos
                      .map((pp) => `${pp.cantidad > 1 ? pp.cantidad + '× ' : ''}${pp.producto?.nombre ?? ''}`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalesOrden.length > 0 && (
          <section className="break-inside-avoid space-y-2 pt-4 border-t-2 border-foreground">
            <h2 className="text-lg font-bold">Resumen de cocina</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-sm">
              {totalesOrden.map((t) => (
                <li key={t.label} className="flex justify-between border-b border-muted py-1">
                  <span>{t.label}</span>
                  <span className="font-semibold tabular-nums">{t.total}</span>
                </li>
              ))}
              <li className="flex justify-between border-b border-muted py-1 col-span-full font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{totalGeneral}</span>
              </li>
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
