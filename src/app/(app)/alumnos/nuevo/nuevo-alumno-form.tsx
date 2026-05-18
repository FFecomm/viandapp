'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { crearAlumno } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NuevoAlumnoForm() {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await crearAlumno(data)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="font-medium">Datos del alumno</h2>
        <div className="space-y-2">
          <Label htmlFor="nombre_completo">Nombre completo</Label>
          <Input id="nombre_completo" name="nombre_completo" required className="h-12 text-base" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="grado">Grado</Label>
            <Input id="grado" name="grado" required placeholder="1, 2, 3…" inputMode="numeric" className="h-12 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="division">División</Label>
            <Input id="division" name="division" required placeholder="A, B, C" className="h-12 text-base uppercase" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-medium">Contacto (al menos uno)</h2>
        <div className="space-y-2">
          <Label htmlFor="contacto_nombre">Nombre</Label>
          <Input id="contacto_nombre" name="contacto_nombre" required className="h-12 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contacto_telefono">WhatsApp</Label>
          <Input id="contacto_telefono" name="contacto_telefono" type="tel" inputMode="tel" required className="h-12 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contacto_relacion">Relación</Label>
          <select id="contacto_relacion" name="contacto_relacion" defaultValue="madre" className="w-full h-12 px-3 rounded-lg border bg-background text-base">
            <option value="madre">Madre</option>
            <option value="padre">Padre</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </section>

      <Button type="submit" disabled={pending} className="w-full h-12 text-base">
        {pending ? 'Guardando…' : 'Guardar alumno'}
      </Button>
    </form>
  )
}
