import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  fechaHoyAR,
  formatFecha,
  formatHora,
  formatPesos,
  FORMAS_PAGO_LABEL_CORTO,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { CajaExport } from './export-buttons'

type SearchParams = { fecha?: string }

type Movimiento = {
  hora: string
  alumno: string
  gradoDivision: string
  concepto: string
  forma_pago: 'efectivo' | 'transferencia' | 'credito' | 'a_deber'
  monto: number
  esIngreso: boolean
  created_at: string
}

export default async function CajaPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['administrativo'])

  const fecha = (searchParams.fecha ?? '').trim() || fechaHoyAR()

  const supabase = createClient()

  // Rango UTC equivalente al día AR (UTC-3 fijo, sin DST)
  // 00:00 AR = 03:00 UTC del mismo día; 24:00 AR = 03:00 UTC del día siguiente
  const inicio = `${fecha}T03:00:00.000Z`
  const finDate = new Date(`${fecha}T03:00:00.000Z`)
  finDate.setUTCDate(finDate.getUTCDate() + 1)
  const fin = finDate.toISOString()

  type PedidoRow = {
    id: string
    fecha: string
    menu: string
    forma_pago_vianda: 'efectivo' | 'transferencia' | 'credito' | 'a_deber'
    precio_vianda: number
    created_at: string
    alumno: { nombre_completo: string; grado: string; division: string } | null
    pedido_productos: {
      cantidad: number
      forma_pago: 'efectivo' | 'transferencia' | 'credito' | 'a_deber'
      precio_al_momento: number
      producto: { nombre: string } | null
    }[]
  }

  type MovRow = {
    id: string
    tipo: string
    monto: number | string
    forma_pago: string | null
    viandas_equivalentes: number | null
    precio_vianda_al_momento: number | null
    created_at: string
    alumno: { nombre_completo: string; grado: string; division: string } | null
  }

  const [{ data: pedidosDia }, { data: movs }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        id, fecha, menu, forma_pago_vianda, precio_vianda, created_at,
        alumno:alumno_id ( nombre_completo, grado, division ),
        pedido_productos ( cantidad, forma_pago, precio_al_momento, producto:producto_id ( nombre ) )
      `)
      .gte('created_at', inicio)
      .lt('created_at', fin)
      .order('created_at')
      .returns<PedidoRow[]>(),
    supabase
      .from('movimientos_credito')
      .select(`
        id, tipo, monto, forma_pago, viandas_equivalentes, precio_vianda_al_momento, created_at,
        alumno:alumno_id ( nombre_completo, grado, division )
      `)
      .gte('created_at', inicio)
      .lt('created_at', fin)
      .in('tipo', ['carga', 'cancelacion_deuda'])
      .order('created_at')
      .returns<MovRow[]>(),
  ])

  const movimientos: Movimiento[] = []

  for (const p of pedidosDia ?? []) {
    const alumno = p.alumno?.nombre_completo ?? '—'
    const gd = p.alumno ? `${p.alumno.grado}° ${p.alumno.division}` : ''
    const labelMenu = p.menu.length === 1 ? `Menú ${p.menu}` : p.menu

    if (p.forma_pago_vianda !== 'credito' && p.forma_pago_vianda !== 'a_deber') {
      movimientos.push({
        hora: formatHora(p.created_at),
        alumno,
        gradoDivision: gd,
        concepto: labelMenu,
        forma_pago: p.forma_pago_vianda,
        monto: Number(p.precio_vianda),
        esIngreso: true,
        created_at: p.created_at,
      })
    } else if (p.forma_pago_vianda === 'credito') {
      movimientos.push({
        hora: formatHora(p.created_at),
        alumno,
        gradoDivision: gd,
        concepto: `${labelMenu} (con crédito)`,
        forma_pago: 'credito',
        monto: Number(p.precio_vianda),
        esIngreso: false,
        created_at: p.created_at,
      })
    }

    for (const pp of p.pedido_productos ?? []) {
      const nombre = pp.producto?.nombre ?? 'Producto'
      const subtotal = Number(pp.precio_al_momento) * pp.cantidad
      if (pp.forma_pago === 'efectivo' || pp.forma_pago === 'transferencia') {
        movimientos.push({
          hora: formatHora(p.created_at),
          alumno,
          gradoDivision: gd,
          concepto: `${pp.cantidad > 1 ? pp.cantidad + '× ' : ''}${nombre}`,
          forma_pago: pp.forma_pago,
          monto: subtotal,
          esIngreso: true,
          created_at: p.created_at,
        })
      }
    }
  }

  for (const m of movs ?? []) {
    const fp = (m.forma_pago === 'efectivo' || m.forma_pago === 'transferencia') ? m.forma_pago : 'efectivo'
    movimientos.push({
      hora: formatHora(m.created_at),
      alumno: m.alumno?.nombre_completo ?? '—',
      gradoDivision: m.alumno ? `${m.alumno.grado}° ${m.alumno.division}` : '',
      concepto: m.tipo === 'carga'
        ? `Carga de crédito${m.viandas_equivalentes ? ` (${m.viandas_equivalentes} viandas a ${formatPesos(m.precio_vianda_al_momento ?? 0)})` : ''}`
        : 'Pago de deuda',
      forma_pago: fp,
      monto: Number(m.monto),
      esIngreso: true,
      created_at: m.created_at,
    })
  }

  movimientos.sort((a, b) => a.created_at.localeCompare(b.created_at))

  const ingresos = movimientos.filter((m) => m.esIngreso)
  const totalEfectivo = ingresos.filter((m) => m.forma_pago === 'efectivo').reduce((s, m) => s + m.monto, 0)
  const totalTransfer = ingresos.filter((m) => m.forma_pago === 'transferencia').reduce((s, m) => s + m.monto, 0)
  const totalCargas = ingresos.filter((m) => m.concepto.startsWith('Carga') || m.concepto.startsWith('Pago de deuda')).reduce((s, m) => s + m.monto, 0)
  const totalConsumoCredito = movimientos.filter((m) => !m.esIngreso).reduce((s, m) => s + m.monto, 0)
  const totalDelDia = totalEfectivo + totalTransfer

  const esHoy = fecha === fechaHoyAR()

  return (
    <div className="p-5 space-y-5">
      <PageHeader title={esHoy ? 'Caja de hoy' : `Caja del ${formatFecha(fecha)}`} />

      <form method="GET">
        <Input type="date" name="fecha" defaultValue={fecha} className="h-11 text-base" />
      </form>

      <div className="rounded-2xl border bg-card p-6 space-y-1 text-center">
        <p className="text-sm text-muted-foreground">Total del día</p>
        <p className="text-4xl font-semibold tabular-nums">{formatPesos(totalDelDia)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Tarjeta label="Efectivo" value={totalEfectivo} />
        <Tarjeta label="Transferencias" value={totalTransfer} />
        <Tarjeta label="Cargas de crédito" value={totalCargas} muted />
        <Tarjeta label="Pagado con crédito" value={totalConsumoCredito} muted />
      </div>

      <CajaExport movimientos={movimientos} fecha={fecha} totalDelDia={totalDelDia} />

      <Separator />

      <section className="space-y-2">
        <h2 className="font-medium">Movimientos</h2>
        {!movimientos.length ? (
          <p className="text-sm text-muted-foreground">Sin movimientos en esta fecha.</p>
        ) : (
          <ul className="space-y-2">
            {movimientos.map((m, i) => (
              <li key={i} className="rounded-lg border p-3 text-sm flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.alumno} {m.gradoDivision && <span className="text-muted-foreground font-normal">· {m.gradoDivision}</span>}</p>
                  <p className="text-muted-foreground truncate">{m.concepto}</p>
                  <p className="text-xs text-muted-foreground">{m.hora}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('font-semibold tabular-nums', !m.esIngreso && 'text-muted-foreground')}>
                    {m.esIngreso ? '+' : ''}{formatPesos(m.monto)}
                  </p>
                  <Badge variant="outline" className="text-xs mt-0.5">
                    {FORMAS_PAGO_LABEL_CORTO[m.forma_pago]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Tarjeta({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={cn('rounded-xl border p-3', muted && 'bg-muted/40')}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums mt-0.5', muted && 'text-muted-foreground')}>
        {formatPesos(value)}
      </p>
    </div>
  )
}
