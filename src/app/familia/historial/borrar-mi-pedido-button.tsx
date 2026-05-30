'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { borrarMiPedido } from '../actions'

export function BorrarMiPedidoButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!confirm('¿Cancelar este pedido?')) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      const result = await borrarMiPedido(fd)
      if (result?.error) toast.error(result.error)
      else toast.success('Pedido cancelado')
    })
  }

  return (
    <Button onClick={onClick} disabled={pending} variant="ghost" size="sm" className="h-8 text-destructive">
      <Trash2 className="size-4" />
      {pending ? 'Cancelando…' : 'Cancelar'}
    </Button>
  )
}
