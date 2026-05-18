'use client'

import { useRef, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { agregarContacto } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AgregarContactoForm({ alumnoId }: { alumnoId: string }) {
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await agregarContacto(data)
      if (result?.error) toast.error(result.error)
      else if (result?.ok) {
        toast.success('Contacto agregado')
        ref.current?.reset()
      }
    })
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3 rounded-xl border p-4">
      <p className="font-medium text-sm">Agregar otro contacto</p>
      <input type="hidden" name="alumno_id" value={alumnoId} />
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" required className="h-11" />
      </div>
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <div className="space-y-2">
          <Label htmlFor="telefono">WhatsApp</Label>
          <Input id="telefono" name="telefono" type="tel" inputMode="tel" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="relacion">Relación</Label>
          <select id="relacion" name="relacion" defaultValue="madre" className="w-full h-11 px-3 rounded-lg border bg-background text-sm">
            <option value="madre">Madre</option>
            <option value="padre">Padre</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full h-10">
        <Plus className="size-4" />
        {pending ? 'Agregando…' : 'Agregar contacto'}
      </Button>
    </form>
  )
}
