'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Pencil } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { editarMiPedido } from '../actions'
import type { TipoMenu } from '@/lib/supabase/types'

type Opcion = { id: string; menu: string; texto: string }

type MenuOptions = { value: TipoMenu; titulo: string; descripcion: string }

const FIJOS: MenuOptions[] = [
  { value: 'Hamburguesa', titulo: 'Hamburguesa', descripcion: 'Hamburguesa con papas' },
  { value: 'Fideos', titulo: 'Fideos', descripcion: 'Fideos con queso' },
  { value: 'Sandwich', titulo: 'Sandwich', descripcion: 'Sándwich de suprema' },
]

export function EditarPedidoDialog({
  pedidoId,
  menuActual,
  observacionesActuales,
  menusDelDia,
  opciones,
  fecha,
}: {
  pedidoId: string
  menuActual: string
  observacionesActuales: string
  menusDelDia: { tipo_menu: 'A' | 'B' | 'C'; descripcion: string }[]
  opciones: Opcion[]
  fecha: string
}) {
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState<TipoMenu>(menuActual as TipoMenu)
  const [textosTildados, setTextosTildados] = useState<Set<string>>(
    () => new Set(observacionesActuales.split(',').map((t) => t.trim()).filter(Boolean)),
  )
  const [pending, startTransition] = useTransition()

  const todasOpciones: MenuOptions[] = [
    ...menusDelDia.map((m) => ({
      value: m.tipo_menu as TipoMenu,
      titulo: `Menú ${m.tipo_menu}`,
      descripcion: m.descripcion,
    })),
    ...FIJOS,
  ]

  const opcionesDelMenu = opciones.filter((o) => o.menu === menu)

  function toggleOpcion(texto: string) {
    setTextosTildados((prev) => {
      const next = new Set(prev)
      if (next.has(texto)) next.delete(texto)
      else next.add(texto)
      return next
    })
  }

  function cambiarMenu(nuevo: TipoMenu) {
    setMenu(nuevo)
    // Limpiar opciones del menú anterior (las del nuevo menú son otras)
    setTextosTildados(new Set())
  }

  function guardar() {
    const observaciones = Array.from(textosTildados).join(', ').trim() || null
    startTransition(async () => {
      const res = await editarMiPedido({
        pedido_id: pedidoId,
        menu,
        observaciones,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Pedido actualizado')
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="h-8">
            <Pencil className="size-4" />
            Editar
          </Button>
        }
      />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar pedido</DialogTitle>
          <DialogDescription>{fecha}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Menú</p>
            <div className="grid grid-cols-2 gap-2">
              {todasOpciones.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => cambiarMenu(o.value)}
                  className={cn(
                    'h-20 rounded-xl border p-2 text-left transition-colors flex flex-col justify-between',
                    menu === o.value ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                  )}
                >
                  <Badge variant="secondary" className="w-fit text-xs">
                    {o.titulo}
                  </Badge>
                  <p className="text-xs leading-tight">{o.descripcion}</p>
                </button>
              ))}
            </div>
          </div>

          {opcionesDelMenu.length > 0 ? (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Opciones</p>
              <div className="flex flex-wrap gap-2">
                {opcionesDelMenu.map((op) => {
                  const tildada = textosTildados.has(op.texto)
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => toggleOpcion(op.texto)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5',
                        tildada
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'hover:bg-muted',
                      )}
                    >
                      {tildada ? <Check className="size-3.5" /> : null}
                      {op.texto}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
