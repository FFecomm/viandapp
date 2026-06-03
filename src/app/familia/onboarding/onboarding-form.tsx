'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronLeft, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { vincularAlumnoExistente, vincularHijos } from './actions'

type Relacion = 'madre' | 'padre' | 'tutor' | 'otro'

type Hijo = {
  nombre_completo: string
  grado: string
  division: string
  fecha_nacimiento: string
  relacion: Relacion
}

const HIJO_VACIO: Hijo = {
  nombre_completo: '',
  grado: '',
  division: '',
  fecha_nacimiento: '',
  relacion: 'tutor',
}

type Modo = 'eleccion' | 'nuevo' | 'existente'

export function OnboardingForm() {
  const [modo, setModo] = useState<Modo>('eleccion')

  if (modo === 'eleccion') {
    return <PantallaEleccion onElegir={setModo} />
  }
  if (modo === 'nuevo') {
    return <FormHijosNuevos onVolver={() => setModo('eleccion')} />
  }
  return <FormVincularExistente onVolver={() => setModo('eleccion')} />
}

function PantallaEleccion({ onElegir }: { onElegir: (m: Modo) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground pb-2">
        ¿Es la primera vez que cargás a tu hijo en ViandApp?
      </p>
      <button
        type="button"
        onClick={() => onElegir('nuevo')}
        className="w-full text-left rounded-2xl border p-4 hover:bg-muted transition-colors flex items-start gap-3"
      >
        <UserPlus className="size-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Sí, voy a cargarlo ahora</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Te pedimos nombre, grado, división y fecha de nacimiento.
          </p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onElegir('existente')}
        className="w-full text-left rounded-2xl border p-4 hover:bg-muted transition-colors flex items-start gap-3"
      >
        <Users className="size-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Mi hijo ya está cargado</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Por la otra mamá o papá. Te vinculamos si los datos coinciden.
          </p>
        </div>
      </button>
    </div>
  )
}

function FormHijosNuevos({ onVolver }: { onVolver: () => void }) {
  const [hijos, setHijos] = useState<Hijo[]>([{ ...HIJO_VACIO }])
  const [pending, startTransition] = useTransition()

  function setHijo(i: number, patch: Partial<Hijo>) {
    setHijos((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)))
  }
  function agregar() {
    setHijos((prev) => [...prev, { ...HIJO_VACIO }])
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
    <div className="space-y-3">
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" /> Volver
      </button>
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
                <Label htmlFor={`fnac_${i}`}>Fecha de nacimiento</Label>
                <Input
                  id={`fnac_${i}`}
                  type="date"
                  value={h.fecha_nacimiento}
                  onChange={(e) => setHijo(i, { fecha_nacimiento: e.target.value })}
                  required
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Sirve para que el otro padre/madre se vincule de forma segura.
                </p>
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
    </div>
  )
}

function FormVincularExistente({ onVolver }: { onVolver: () => void }) {
  const [datos, setDatos] = useState({
    nombre_completo: '',
    grado: '',
    division: '',
    fecha_nacimiento: '',
    relacion: 'tutor' as Relacion,
  })
  const [pending, startTransition] = useTransition()

  function setCampo<K extends keyof typeof datos>(k: K, v: (typeof datos)[K]) {
    setDatos((prev) => ({ ...prev, [k]: v }))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const res = await vincularAlumnoExistente(datos)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" /> Volver
      </button>
      <div className="rounded-xl border bg-muted/40 p-4 text-sm">
        Cargá los datos tal como están en la app del otro padre/madre. Si algo no
        coincide, no vas a poder vincularte. Pedile que verifique nombre, grado,
        división y fecha de nacimiento.
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre y apellido del alumno</Label>
          <Input
            id="nombre"
            value={datos.nombre_completo}
            onChange={(e) => setCampo('nombre_completo', e.target.value)}
            required
            className="h-12 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="grado">Grado</Label>
            <Input
              id="grado"
              value={datos.grado}
              onChange={(e) => setCampo('grado', e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="division">División</Label>
            <Input
              id="division"
              value={datos.division}
              onChange={(e) => setCampo('division', e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fnac">Fecha de nacimiento</Label>
          <Input
            id="fnac"
            type="date"
            value={datos.fecha_nacimiento}
            onChange={(e) => setCampo('fecha_nacimiento', e.target.value)}
            required
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label>Tu relación con el alumno</Label>
          <div className="grid grid-cols-4 gap-2">
            {(['madre', 'padre', 'tutor', 'otro'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setCampo('relacion', r)}
                className={`h-10 rounded-lg border text-sm capitalize transition-colors ${
                  datos.relacion === r ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={pending} className="w-full h-12 text-base">
          {pending ? 'Verificando…' : 'Vincularme'}
        </Button>
      </form>
    </div>
  )
}
