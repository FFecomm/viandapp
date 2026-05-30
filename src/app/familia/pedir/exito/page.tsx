import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { requireRole } from '@/lib/auth/roles'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SearchParams = { n?: string; alumno?: string }

export default async function PedidoExitoPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['padre'])
  const n = Math.max(1, Number(searchParams.n ?? '1'))
  const palabra = n === 1 ? 'vianda' : 'viandas'

  return (
    <div className="p-5 max-w-md mx-auto min-h-[80vh] flex flex-col justify-center space-y-6">
      <div className="text-center space-y-3">
        <CheckCircle2 className="size-20 text-green-600 mx-auto" />
        <h1 className="text-2xl font-semibold">¡Pedido confirmado!</h1>
        <p className="text-muted-foreground">
          Reservamos {n} {palabra}. Te avisamos cualquier novedad por notificación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Link href="/familia/historial" className={cn(buttonVariants(), 'h-12 text-base')}>
          Ver mis pedidos
        </Link>
        <Link
          href="/familia"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-12 text-base')}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
