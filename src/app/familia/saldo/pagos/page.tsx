import Link from 'next/link'
import { ChevronLeft, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'

type PagoFila = {
  id: string
  alumno_id: string
  viandas_compradas: number
  monto_total: number | string
  mp_status: string
  creado_en: string
}

const ESTADOS: Record<
  string,
  { label: string; icon: typeof CheckCircle2; color: string; descripcion: string }
> = {
  approved: {
    label: 'Acreditado',
    icon: CheckCircle2,
    color: 'text-green-600',
    descripcion: 'El pago se acreditó y el saldo está disponible.',
  },
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-orange-600',
    descripcion: 'Estamos esperando la confirmación de Mercado Pago.',
  },
  in_process: {
    label: 'En revisión',
    icon: Clock,
    color: 'text-orange-600',
    descripcion: 'Mercado Pago está revisando el pago.',
  },
  rejected: {
    label: 'Rechazado',
    icon: XCircle,
    color: 'text-destructive',
    descripcion: 'El pago fue rechazado por Mercado Pago.',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-muted-foreground',
    descripcion: 'El pago fue cancelado antes de acreditarse.',
  },
  refunded: {
    label: 'Devuelto',
    icon: RotateCcw,
    color: 'text-muted-foreground',
    descripcion: 'El dinero se devolvió a la tarjeta. El saldo no consumido se revirtió.',
  },
  charged_back: {
    label: 'Contracargo',
    icon: RotateCcw,
    color: 'text-destructive',
    descripcion: 'Se realizó un contracargo. El saldo no consumido se revirtió.',
  },
}

function formatFecha(s: string): string {
  const d = new Date(s)
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatPesos(n: number | string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n))
}

export default async function PagosPage() {
  await requireRole(['padre'])

  const supabase = createClient()
  const { data, error } = await supabase
    .from('pagos')
    .select('id, alumno_id, viandas_compradas, monto_total, mp_status, creado_en')
    .order('creado_en', { ascending: false })
    .limit(50)

  const pagos = (data ?? []) as PagoFila[]

  // Traer los nombres de los alumnos en una sola query separada (evita problemas
  // con la generación de tipos del join).
  const alumnoIds = Array.from(new Set(pagos.map((p) => p.alumno_id)))
  const alumnosPorId = new Map<string, string>()
  if (alumnoIds.length > 0) {
    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('id, nombre_completo')
      .in('id', alumnoIds)
    for (const a of (alumnosData ?? []) as { id: string; nombre_completo: string }[]) {
      alumnosPorId.set(a.id, a.nombre_completo)
    }
  }

  return (
    <div className="p-5 space-y-5 max-w-md mx-auto">
      <Link href="/familia/saldo" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <PageHeader title="Mis pagos" subtitle="Historial de cargas de saldo." />

      {error ? (
        <p className="text-sm text-destructive">No pudimos cargar tus pagos.</p>
      ) : pagos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hiciste ninguna carga de saldo.</p>
      ) : (
        <ul className="space-y-2">
          {pagos.map((p) => {
            const estado = ESTADOS[p.mp_status] ?? {
              label: p.mp_status,
              icon: Clock,
              color: 'text-muted-foreground',
              descripcion: '',
            }
            const Icon = estado.icon
            const nombre = alumnosPorId.get(p.alumno_id) ?? '—'
            return (
              <li key={p.id} className="rounded-xl border bg-card p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {p.viandas_compradas} {p.viandas_compradas === 1 ? 'vianda' : 'viandas'} · {formatPesos(p.monto_total)}
                    </p>
                    <p className="text-xs text-muted-foreground">{nombre} · {formatFecha(p.creado_en)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${estado.color}`}>
                    <Icon className="size-4" /> {estado.label}
                  </span>
                </div>
                {estado.descripcion ? (
                  <p className="text-xs text-muted-foreground">{estado.descripcion}</p>
                ) : null}
                {p.mp_status === 'approved' ? (
                  <Link
                    href={`/familia/saldo/recibo/${p.id}`}
                    className="text-xs text-primary underline inline-block"
                  >
                    Ver recibo
                  </Link>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
