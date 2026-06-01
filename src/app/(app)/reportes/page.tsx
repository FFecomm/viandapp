import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { formatPesos } from '@/lib/format'
import { ReportesExport } from './export-buttons'

type SearchParams = { mes?: string }

type Pago = {
  monto_total: number | string
  acreditado_en: string | null
  creado_en: string
}
type CajaMov = {
  monto: number | string
  medio_pago: 'mercado_pago' | 'efectivo'
  tipo: 'ingreso' | 'egreso'
  fecha: string
  categoria: string
}
type Pedido = {
  id: string
  estado: string
  alumno_id: string
  alumno: { nombre_completo: string; grado: string; division: string } | null
}

function mesAR(): string {
  const now = new Date()
  const ar = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return ar.toISOString().slice(0, 7)
}

function nombreMes(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const f = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
  return f.format(new Date(Date.UTC(y, m - 1, 1)))
}

function ultimoDiaMes(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number)
  const d = new Date(Date.UTC(y, m, 0))
  return d.toISOString().slice(0, 10)
}

export default async function ReportesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['administrativo'])

  const mes = (searchParams.mes ?? '').match(/^\d{4}-\d{2}$/) ? searchParams.mes! : mesAR()
  const desde = `${mes}-01`
  const hasta = ultimoDiaMes(mes)

  // Rango UTC: Argentina UTC-3, sin DST.
  const inicioUtc = `${desde}T03:00:00.000Z`
  const finDate = new Date(`${hasta}T03:00:00.000Z`)
  finDate.setUTCDate(finDate.getUTCDate() + 1)
  const finUtc = finDate.toISOString()

  const supabase = createClient()

  // 1) Facturación: pagos aprobados + caja_movimientos
  const [{ data: pagos }, { data: caja }] = await Promise.all([
    supabase
      .from('pagos')
      .select('monto_total, acreditado_en, creado_en')
      .eq('mp_status', 'approved')
      .gte('acreditado_en', inicioUtc)
      .lt('acreditado_en', finUtc),
    supabase
      .from('caja_movimientos')
      .select('monto, medio_pago, tipo, fecha, categoria')
      .gte('fecha', desde)
      .lte('fecha', hasta),
  ])

  const totalMp = (pagos ?? []).reduce((s, p: Pago) => s + Number(p.monto_total), 0)
  const cajaArr = (caja ?? []) as CajaMov[]
  const totalEfectivo = cajaArr
    .filter((m) => m.medio_pago === 'efectivo' && m.tipo === 'ingreso')
    .reduce((s, m) => s + Number(m.monto), 0)
  const totalEgresos = cajaArr.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0)
  const totalIngresos = totalMp + totalEfectivo
  const neto = totalIngresos - totalEgresos

  // 2) Asistencia por curso
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(`
      id, estado, alumno_id,
      alumno:alumnos!pedidos_alumno_id_fkey ( nombre_completo, grado, division )
    `)
    .gte('fecha', desde)
    .lte('fecha', hasta)

  const pedidosArr = (pedidos ?? []) as unknown as Pedido[]
  const porCurso = new Map<string, { total: number; ausentes: number }>()
  for (const p of pedidosArr) {
    const curso = p.alumno ? `${p.alumno.grado}° ${p.alumno.division}` : 'Sin curso'
    const cur = porCurso.get(curso) ?? { total: 0, ausentes: 0 }
    cur.total += 1
    if (p.estado === 'ausente_acreditado') cur.ausentes += 1
    porCurso.set(curso, cur)
  }
  const filasAsistencia = Array.from(porCurso.entries())
    .map(([curso, { total, ausentes }]) => ({
      curso,
      total,
      ausentes,
      asistidos: total - ausentes,
      pct: total ? Math.round(((total - ausentes) / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // 3) Top consumo
  const porAlumno = new Map<string, { nombre: string; curso: string; total: number; ausentes: number }>()
  for (const p of pedidosArr) {
    const id = p.alumno_id
    const cur = porAlumno.get(id) ?? {
      nombre: p.alumno?.nombre_completo ?? '—',
      curso: p.alumno ? `${p.alumno.grado}° ${p.alumno.division}` : '—',
      total: 0,
      ausentes: 0,
    }
    cur.total += 1
    if (p.estado === 'ausente_acreditado') cur.ausentes += 1
    porAlumno.set(id, cur)
  }
  const topConsumo = Array.from(porAlumno.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  return (
    <div className="p-5 space-y-6">
      <PageHeader title="Reportes" subtitle={`Resumen mensual · ${nombreMes(mes)}`} />

      <form method="GET" className="flex items-center gap-2">
        <label htmlFor="mes" className="text-sm text-muted-foreground">Mes:</label>
        <input
          id="mes"
          name="mes"
          type="month"
          defaultValue={mes}
          className="h-10 px-3 rounded-lg border bg-background"
        />
        <button type="submit" className="h-10 px-4 rounded-lg border bg-primary text-primary-foreground text-sm font-medium">
          Ver
        </button>
      </form>

      {/* Facturación */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Facturación</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Mercado Pago" value={formatPesos(totalMp)} />
          <Stat label="Efectivo" value={formatPesos(totalEfectivo)} />
          <Stat label="Ingresos totales" value={formatPesos(totalIngresos)} highlight />
          <Stat label="Egresos" value={formatPesos(totalEgresos)} />
        </div>
        <div className="pt-2 border-t flex items-baseline justify-between">
          <span className="text-sm font-medium">Neto del mes</span>
          <span className={`text-xl font-semibold ${neto >= 0 ? 'text-green-700' : 'text-destructive'}`}>
            {formatPesos(neto)}
          </span>
        </div>
      </section>

      {/* Asistencia */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Asistencia por curso</h2>
        {filasAsistencia.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pedidos en este mes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 font-medium">Curso</th>
                <th className="py-2 font-medium text-right">Pedidos</th>
                <th className="py-2 font-medium text-right">Asistidos</th>
                <th className="py-2 font-medium text-right">Ausentes</th>
                <th className="py-2 font-medium text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {filasAsistencia.map((f) => (
                <tr key={f.curso} className="border-b last:border-0">
                  <td className="py-2">{f.curso}</td>
                  <td className="py-2 text-right">{f.total}</td>
                  <td className="py-2 text-right">{f.asistidos}</td>
                  <td className="py-2 text-right">{f.ausentes}</td>
                  <td className="py-2 text-right font-medium">{f.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Top consumo */}
      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Top alumnos por consumo</h2>
        {topConsumo.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 font-medium">Alumno</th>
                <th className="py-2 font-medium">Curso</th>
                <th className="py-2 font-medium text-right">Viandas</th>
                <th className="py-2 font-medium text-right">Ausentes</th>
              </tr>
            </thead>
            <tbody>
              {topConsumo.map((a, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{a.nombre}</td>
                  <td className="py-2">{a.curso}</td>
                  <td className="py-2 text-right font-medium">{a.total}</td>
                  <td className="py-2 text-right">{a.ausentes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ReportesExport
        mes={mes}
        facturacion={{ totalMp, totalEfectivo, totalIngresos, totalEgresos, neto }}
        asistencia={filasAsistencia}
        topConsumo={topConsumo}
      />
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg ${highlight ? 'font-semibold' : 'font-medium'}`}>{value}</p>
    </div>
  )
}
