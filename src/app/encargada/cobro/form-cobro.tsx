'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cobrarEfectivo } from '../actions'
import { formatPesos } from '@/lib/format'
import type { TipoMenu } from '@/lib/supabase/types'

export function FormCobro({
  alumnoId,
  menuPreseleccionado,
  precioVianda,
}: {
  alumnoId: string
  menuPreseleccionado: TipoMenu | null
  precioVianda: number
}) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await cobrarEfectivo(fd)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="alumno_id" value={alumnoId} />
      {menuPreseleccionado ? <input type="hidden" name="menu" value={menuPreseleccionado} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="monto">Monto</Label>
        <Input
          id="monto"
          name="monto"
          type="number"
          min={1}
          step="1"
          defaultValue={precioVianda}
          required
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">
          Sugerido: {formatPesos(precioVianda)} (precio de una vianda).
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-full h-12 text-base">
        {pending ? 'Registrando…' : 'Registrar cobro'}
      </Button>
    </form>
  )
}
