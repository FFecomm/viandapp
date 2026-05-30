'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { vincularHijos } from './actions'

type Hijo = {
  nombre_completo: string
  grado: string
  division: string
  relacion: 'madre' | 'padre' | 'tutor' | 'otro'
}

const VACIO: Hijo = { nombre_completo: '', grado: '', division: '', relacion: 'tutor' }

export function OnboardingForm() {
  const [hijos, setHijos] = useState<Hijo[]>([{ ...VACIO }])
  const [pending, startTransition] = useTransition()

  function setHijo(i: number, patch: Partial<Hijo>) {
    setHijos((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)))
  }
  function agregar() {
    setHijos((prev) => [...prev, { ...VACIO }])
  }
  function quitar(i: number) {
    setHijos((prev) => prev.filter((_, idx) => idx !== i))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const result = await vincularHijos(hijos)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <ul className="space-y-4">
        {hijos.map((h, i) => (
          <li key={i} className="rounded-2xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Hijo {i + 1}</p>
              {hijos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  className="text-destructive text-sm inline-flex items-center gap-1"
                >
                  <Trash2 className="size-4" /> Quitar
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`nombre_${i}`}>Nombre y apellido</Label>
              <Input
                id={`nombre_${i}`}
                value={h.nombre_completo}
                onChange={(e) => setHijo(i, { nombre_completo: e.target.value })}
                required
                className="h-12 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor={`grado_${i}`}>Grado</Label>
                <Input
                  id={`grado_${i}`}
                  value={h.grado}
                  onChange={(e) => setHijo(i, { grado: e.target.value })}
                  placeholder="Ej: 3"
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`division_${i}`}>División</Label>
                <Input
                  id={`division_${i}`}
                  value={h.division}
                  onChange={(e) => setHijo(i, { division: e.target.value })}
                  placeholder="Ej: A"
                  required
                  className="h-12 text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Relación</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['madre', 'padre', 'tutor', 'otro'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setHijo(i, { relacion: r })}
                    className={`h-10 rounded-lg border text-sm capitalize transition-colors ${
                      h.relacion === r ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button type="button" variant="outline" onClick={agregar} className="w-full h-11">
        <Plus className="size-4" /> Agregar otro hijo
      </Button>

      <Button type="submit" disabled={pending} className="w-full h-12 text-base">
        {pending ? 'Guardando…' : 'Continuar'}
      </Button>
    </form>
  )
}
