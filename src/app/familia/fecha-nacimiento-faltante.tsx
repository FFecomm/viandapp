'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Calendar, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completarFechaNacimiento } from './onboarding/actions'

type AlumnoSinFecha = { id: string; nombre_completo: string }

export function FechaNacimientoFaltante({ alumnos }: { alumnos: AlumnoSinFecha[] }) {
  const [abierto, setAbierto] = useState<AlumnoSinFecha | null>(null)
  const [fecha, setFecha] = useState('')
  const [pending, startTransition] = useTransition()

  function onGuardar() {
    if (!abierto) return
    if (!fecha) {
      toast.error('Ingresá la fecha')
      return
    }
    startTransition(async () => {
      const res = await completarFechaNacimiento(abierto.id, fecha)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Fecha guardada')
      setAbierto(null)
      setFecha('')
    })
  }

  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Calendar className="size-5 text-orange-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-orange-900">
            Completá la fecha de nacimiento
          </p>
          <p className="text-sm text-orange-900/80">
            La necesitamos para que el otro padre o madre pueda vincularse a tu hijo de forma segura.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {alumnos.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => {
                setAbierto(a)
                setFecha('')
              }}
              className="w-full rounded-xl bg-white border p-3 text-left flex items-center justify-between hover:bg-orange-50/60"
            >
              <span className="font-medium">{a.nombre_completo}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      {abierto ? (
        <div className="rounded-xl bg-white border p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fnac">Fecha de nacimiento de {abierto.nombre_completo}</Label>
            <Input
              id="fnac"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAbierto(null)
                setFecha('')
              }}
              disabled={pending}
              className="flex-1 h-10"
            >
              Cancelar
            </Button>
            <Button onClick={onGuardar} disabled={pending} className="flex-1 h-10">
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
