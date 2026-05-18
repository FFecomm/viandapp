'use client'

import { useRef, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { crearProducto } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NuevoProductoForm() {
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await crearProducto(data)
      if (result?.error) toast.error(result.error)
      else if (result?.ok) {
        toast.success('Producto agregado')
        ref.current?.reset()
      }
    })
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="rounded-xl border-2 border-dashed p-4 space-y-3">
      <p className="font-medium text-sm">Nuevo producto</p>
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="nombre" className="text-xs">Nombre</Label>
          <Input id="nombre" name="nombre" required className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="precio" className="text-xs">Precio</Label>
          <Input id="precio" name="precio" type="number" inputMode="numeric" min="0" step="50" required className="h-11 text-right" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <select name="categoria" defaultValue="bebida" className="h-9 px-2 rounded-lg border bg-background text-sm">
          <option value="bebida">Bebida</option>
          <option value="extra">Extra</option>
        </select>
        <Button type="submit" disabled={pending} className="h-10">
          <Plus className="size-4" />
          {pending ? 'Agregando…' : 'Agregar'}
        </Button>
      </div>
    </form>
  )
}
