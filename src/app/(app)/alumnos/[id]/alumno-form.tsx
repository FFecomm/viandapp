'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { actualizarAlumno } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Alumno = {
  id: string
  nombre_completo: string
  grado: string
  division: string
}

export function AlumnoForm({ alumno }: { alumno: Alumno }) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await actualizarAlumno(data)
      if (result?.error) toast.error(result.error)
      else if (result?.ok) toast.success('Cambios guardados')
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={alumno.id} />
      <div className="space-y-2">
        <Label htmlFor="nombre_completo">Nombre completo</Label>
        <Input id="nombre_completo" name="nombre_completo" required defaultValue={alumno.nombre_completo} className="h-12 text-base" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="grado">Grado</Label>
          <Input id="grado" name="grado" required defaultValue={alumno.grado} inputMode="numeric" className="h-12 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="division">División</Label>
          <Input id="division" name="division" required defaultValue={alumno.division} className="h-12 text-base uppercase" />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full h-11">
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
