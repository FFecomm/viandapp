'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { desvincularAlumno } from './actions'

export function EliminarHijoDialog({
  alumnoId,
  nombre,
}: {
  alumnoId: string
  nombre: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirmar() {
    startTransition(async () => {
      const res = await desvincularAlumno(alumnoId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`${nombre.split(' ')[0]} fue eliminado de tu cuenta`)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="text-destructive h-8 text-xs">
            <Trash2 className="size-3.5" />
            Eliminar hijo
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar a {nombre}?</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Vas a desvincularte de este hijo. Esto incluye:
            </span>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Cancelamos todos sus pedidos futuros (si los tiene).</li>
              <li>No vas a poder pedirle viandas desde tu cuenta.</li>
              <li>Si era el único padre vinculado, el alumno se da de baja.</li>
              <li>Los pedidos pasados quedan guardados para el colegio.</li>
            </ul>
            <span className="block pt-1">¿Confirmás?</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={pending}>
            {pending ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
