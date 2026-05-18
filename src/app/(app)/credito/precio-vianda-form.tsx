'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarPrecioVianda } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPesos } from '@/lib/format'

export function PrecioViandaForm({ precio }: { precio: number }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await actualizarPrecioVianda(data)
      if (result?.error) toast.error(result.error)
      else if (result?.ok) {
        toast.success('Precio actualizado')
        setEditing(false)
      }
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
        <div>
          <span className="text-muted-foreground">Precio actual de vianda: </span>
          <span className="font-medium">{formatPesos(precio)}</span>
        </div>
        <Button onClick={() => setEditing(true)} variant="ghost" size="sm" className="h-8">
          <Pencil className="size-3.5" /> Cambiar
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-lg border p-3">
      <span className="text-sm text-muted-foreground shrink-0">Nuevo precio:</span>
      <Input
        name="precio"
        type="number"
        inputMode="numeric"
        min="0"
        step="100"
        defaultValue={precio}
        required
        className="h-9 flex-1 text-right"
        autoFocus
      />
      <Button type="submit" disabled={pending} size="sm" className="h-9">
        <Check className="size-4" />
      </Button>
      <Button type="button" onClick={() => setEditing(false)} variant="ghost" size="sm" className="h-9">
        <X className="size-4" />
      </Button>
    </form>
  )
}
