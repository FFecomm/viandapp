import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPesos } from '@/lib/format'
import { BotonImprimir } from './boton-imprimir'

type PagoRecibo = {
  id: string
  viandas_compradas: number
  monto_total: number | string
  precio_unitario: number | string
  mp_status: string
  mp_payment_id: string | null
  acreditado_en: string | null
  creado_en: string
  alumno: { nombre_completo: string; grado: string; division: string } | null
}

export default async function ReciboPage({ params }: { params: { id: string } }) {
  await requireRole(['padre'])
  const supabase = createClient()

  const { data } = await supabase
    .from('pagos')
    .select(`
      id,
      viandas_compradas,
      monto_total,
      precio_unitario,
      mp_status,
      mp_payment_id,
      acreditado_en,
      creado_en,
      alumno:alumnos!pagos_alumno_id_fkey ( nombre_completo, grado, division )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!data) notFound()
  const p = data as unknown as PagoRecibo
  if (p.mp_status !== 'approved') notFound()

  const fecha = new Date(p.acreditado_en ?? p.creado_en).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <main className="min-h-screen bg-muted/30 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-md mx-auto bg-white rounded-xl border print:border-0 print:rounded-none p-6 space-y-5">
        <header className="border-b pb-4 text-center">
          <h1 className="text-xl font-semibold text-[#1A3A6B]">ViandApp</h1>
          <p className="text-xs text-muted-foreground mt-1">Comprobante de pago</p>
        </header>

        <section className="space-y-2 text-sm">
          <Linea label="Comprobante N°" value={p.id.slice(0, 8).toUpperCase()} />
          <Linea label="Fecha" value={fecha} />
          {p.mp_payment_id ? (
            <Linea label="Operación MP" value={p.mp_payment_id} mono />
          ) : null}
        </section>

        <section className="border-t pt-4 space-y-2 text-sm">
          <Linea label="Alumno" value={p.alumno?.nombre_completo ?? '—'} />
          {p.alumno ? (
            <Linea label="Curso" value={`${p.alumno.grado}° ${p.alumno.division}`} />
          ) : null}
          <Linea label="Cantidad" value={`${p.viandas_compradas} ${p.viandas_compradas === 1 ? 'vianda' : 'viandas'}`} />
          <Linea label="Precio unitario" value={formatPesos(Number(p.precio_unitario))} />
        </section>

        <section className="border-t pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Total pagado</span>
            <span className="text-2xl font-semibold text-green-700">
              {formatPesos(Number(p.monto_total))}
            </span>
          </div>
        </section>

        <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
          <p>Pago procesado por Mercado Pago.</p>
          <p>El saldo fue acreditado al alumno y está disponible para pedir viandas.</p>
        </footer>

        <div className="flex gap-2 print:hidden">
          <BotonImprimir />
          <Link
            href="/familia"
            className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 h-11')}
          >
            Cerrar
          </Link>
        </div>
      </div>
    </main>
  )
}

function Linea({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium text-right', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}
