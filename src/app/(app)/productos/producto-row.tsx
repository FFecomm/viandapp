'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { actualizarProducto } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Producto = {
  id: string
  nombre: string
  precio: number
  categoria: 'bebida' | 'extra'
  activo: boolean
}

export function ProductoRow({ producto }: { producto: Producto }) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await actualizarProducto(data)
      if (result?.error) toast.error(result.error)
      else if (result?.ok) toast.success('Guardado')
    })
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border p-3 space-y-3 bg-card">
      <input type="hidden" name="id" value={producto.id} />

      <div className="grid grid-cols-[1fr_100px] gap-2">
        <Input name="nombre" defaultValue={producto.nombre} required className="h-11" />
        <Input
          name="precio"
          type="number"
          inputMode="numeric"
          min="0"
          step="50"
          defaultValue={producto.precio}
          required
          className="h-11 text-right"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select name="categoria" defaultValue={producto.categoria} className="h-9 px-2 rounded-lg border bg-background text-sm">
            <option value="bebida">Bebida</option>
            <option value="extra">Extra</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="activo" defaultChecked={producto.activo} className="size-4 rounded" />
            <span>Activo</span>
          </label>
        </div>

        <Button type="submit" disabled={pending} variant="outline" className="h-9">
          <Check className="size-4" />
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
