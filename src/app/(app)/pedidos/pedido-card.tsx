'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FORMAS_PAGO_LABEL_CORTO } from '@/lib/format'
import { borrarPedido } from './actions'
import type { FormaPago } from '@/lib/supabase/types'

export type PedidoCard = {
  id: string
  menu: string
  observaciones: string | null
  forma_pago_vianda: FormaPago
  es_agregado: boolean
  alumno: { nombre_completo: string; grado: string; division: string } | null
  productos: { nombre: string; cantidad: number; forma_pago: FormaPago }[]
}

export function PedidoCardItem({ pedido, puedeBorrar }: { pedido: PedidoCard; puedeBorrar: boolean }) {
  const [pending, startTransition] = useTransition()

  function onBorrar() {
    if (!confirm('¿Borrar este pedido? Si se pagó con crédito, las viandas vuelven al saldo.')) return
    const fd = new FormData()
    fd.set('id', pedido.id)
    startTransition(async () => {
      const result = await borrarPedido(fd)
      if (result?.error) toast.error(result.error)
      else toast.success('Pedido borrado')
    })
  }

  const colorByFormaPago: Record<FormaPago, string> = {
    credito: 'bg-violet-100 text-violet-900 hover:bg-violet-100',
    transferencia: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100',
    efectivo: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100',
    a_deber: 'bg-red-100 text-red-900 hover:bg-red-100',
  }

  return (
    <article
      className={cn(
        'rounded-xl border p-4 space-y-2 transition-colors',
        pedido.es_agregado && 'bg-yellow-50 border-yellow-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{pedido.alumno?.nombre_completo ?? '—'}</p>
          <p className="text-sm text-muted-foreground">
            {pedido.alumno?.grado}° {pedido.alumno?.division}
          </p>
        </div>
        <Badge className={cn('shrink-0', colorByFormaPago[pedido.forma_pago_vianda])}>
          {FORMAS_PAGO_LABEL_CORTO[pedido.forma_pago_vianda]}
        </Badge>
      </div>

      <p className="text-sm">
        <span className="font-medium">Menú:</span>{' '}
        {pedido.menu.length === 1 ? `Menú ${pedido.menu}` : pedido.menu}
      </p>

      {pedido.observaciones ? (
        <p className="text-sm text-muted-foreground italic">«{pedido.observaciones}»</p>
      ) : null}

      {pedido.productos.length > 0 ? (
        <ul className="text-sm text-muted-foreground">
          {pedido.productos.map((p, i) => (
            <li key={i}>+ {p.cantidad > 1 ? `${p.cantidad}× ` : ''}{p.nombre}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        {pedido.es_agregado ? (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-900 border-yellow-300">
            Agregado
          </Badge>
        ) : <span />}
        {puedeBorrar ? (
          <Button
            onClick={onBorrar}
            disabled={pending}
            variant="ghost"
            size="sm"
            className="h-8 text-destructive"
          >
            <Trash2 className="size-4" />
            {pending ? 'Borrando…' : 'Borrar'}
          </Button>
        ) : null}
      </div>
    </article>
  )
}
