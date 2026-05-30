import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPesos } from '@/lib/format'

type SearchParams = { pago?: string }

type PagoRow = {
  id: string
  viandas_compradas: number
  monto_total: number | string
  mp_status: string
  acreditado_en: string | null
}

export default async function ResultadoPagoPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['padre'])

  const pagoId = searchParams.pago ?? ''
  const supabase = createClient()
  const { data: pago } = pagoId
    ? await supabase
        .from('pagos')
        .select('id, viandas_compradas, monto_total, mp_status, acreditado_en')
        .eq('id', pagoId)
        .maybeSingle()
    : { data: null }

  const p = pago as PagoRow | null
  const aprobado = p?.mp_status === 'approved'
  const pendiente = p?.mp_status === 'pendiente' || p?.mp_status === 'in_process'

  return (
    <div className="p-5 space-y-5 max-w-md mx-auto">
      <PageHeader title="Resultado del pago" />

      {!p ? (
        <div className="rounded-xl border p-5 text-sm text-muted-foreground">
          No encontré el pago. Si recién pagaste, esperá unos segundos y refrescá.
        </div>
      ) : aprobado ? (
        <div className="rounded-2xl border bg-green-50 border-green-200 p-6 space-y-3 text-center">
          <CheckCircle2 className="size-12 text-green-600 mx-auto" />
          <h2 className="text-xl font-semibold">¡Pago acreditado!</h2>
          <p className="text-sm text-muted-foreground">
            Cargamos {p.viandas_compradas} {p.viandas_compradas === 1 ? 'vianda' : 'viandas'} por{' '}
            {formatPesos(Number(p.monto_total))}.
          </p>
        </div>
      ) : pendiente ? (
        <div className="rounded-2xl border bg-orange-50 border-orange-200 p-6 space-y-3 text-center">
          <Clock className="size-12 text-orange-600 mx-auto" />
          <h2 className="text-xl font-semibold">Pago en proceso</h2>
          <p className="text-sm text-muted-foreground">
            Mercado Pago todavía está procesando. En unos minutos vas a ver el saldo actualizado.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-destructive/5 border-destructive/30 p-6 space-y-3 text-center">
          <XCircle className="size-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">El pago no se completó</h2>
          <p className="text-sm text-muted-foreground">
            Estado: {p.mp_status}. Probá de nuevo desde la pantalla de saldo.
          </p>
        </div>
      )}

      <Link href="/familia" className={cn(buttonVariants(), 'w-full h-12 text-base')}>
        Volver al inicio
      </Link>
    </div>
  )
}
