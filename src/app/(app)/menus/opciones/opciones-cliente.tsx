'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Check, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { alternarOpcion, borrarOpcion, crearOpcion, editarOpcion } from './actions'

export type OpcionRow = {
  id: string
  menu: string
  texto: string
  orden: number
  activa: boolean
}

const ETIQUETA: Record<string, string> = {
  A: 'Menú A',
  B: 'Menú B',
  C: 'Menú C',
  Hamburguesa: 'Hamburguesa',
  Fideos: 'Fideos',
  Sandwich: 'Sándwich',
}

export function OpcionesMenu({ menu, opciones }: { menu: string; opciones: OpcionRow[] }) {
  const [nueva, setNueva] = useState('')
  const [pending, startTransition] = useTransition()

  function agregar() {
    const texto = nueva.trim()
    if (!texto) return
    startTransition(async () => {
      const res = await crearOpcion({ menu, texto })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setNueva('')
      toast.success('Opción agregada')
    })
  }

  return (
    <section className="rounded-2xl border p-4 space-y-3">
      <h2 className="font-semibold">{ETIQUETA[menu] ?? menu}</h2>

      {opciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin opciones cargadas todavía.</p>
      ) : (
        <ul className="space-y-2">
          {opciones.map((o) => (
            <FilaOpcion key={o.id} opcion={o} />
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <Input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva opción (ej: sin queso)"
          className="h-10"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregar()
            }
          }}
          disabled={pending}
        />
        <Button onClick={agregar} disabled={pending || !nueva.trim()} size="sm" className="h-10">
          <Plus className="size-4" /> Agregar
        </Button>
      </div>
    </section>
  )
}

function FilaOpcion({ opcion }: { opcion: OpcionRow }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(opcion.texto)
  const [pending, startTransition] = useTransition()

  function guardar() {
    const nuevo = texto.trim()
    if (!nuevo) {
      toast.error('No puede estar vacío')
      return
    }
    if (nuevo === opcion.texto) {
      setEditando(false)
      return
    }
    startTransition(async () => {
      const res = await editarOpcion({ id: opcion.id, texto: nuevo })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setEditando(false)
      toast.success('Guardado')
    })
  }

  function toggle() {
    startTransition(async () => {
      const res = await alternarOpcion({ id: opcion.id, activa: !opcion.activa })
      if (res?.error) toast.error(res.error)
    })
  }

  function borrar() {
    if (!confirm('¿Borrar esta opción? Es permanente.')) return
    startTransition(async () => {
      const res = await borrarOpcion(opcion.id)
      if (res?.error) toast.error(res.error)
      else toast.success('Borrada')
    })
  }

  return (
    <li className={cn('flex items-center gap-2 p-2 rounded-lg border bg-card', !opcion.activa && 'opacity-50')}>
      {editando ? (
        <>
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-9 flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                guardar()
              } else if (e.key === 'Escape') {
                setEditando(false)
                setTexto(opcion.texto)
              }
            }}
          />
          <Button onClick={guardar} disabled={pending} size="sm" variant="ghost" className="h-9 w-9 p-0">
            <Check className="size-4" />
          </Button>
          <Button
            onClick={() => {
              setEditando(false)
              setTexto(opcion.texto)
            }}
            disabled={pending}
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0"
          >
            <X className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{opcion.texto}</span>
          <Button
            onClick={toggle}
            disabled={pending}
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0"
            title={opcion.activa ? 'Ocultar' : 'Mostrar'}
          >
            {opcion.activa ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </Button>
          <Button
            onClick={() => setEditando(true)}
            disabled={pending}
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            onClick={borrar}
            disabled={pending}
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      )}
    </li>
  )
}
