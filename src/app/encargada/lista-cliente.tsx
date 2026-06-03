'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Plus, Printer, Search, UserX, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { marcarAusencia, darViandaExtra } from './actions'
import type { TipoMenu } from '@/lib/supabase/types'

export type PedidoFila = {
  id: string
  alumno_id: string
  nombre_completo: string
  grado: string
  division: string
  menu: TipoMenu
  observaciones: string | null
  estado: 'confirmado' | 'cancelado' | 'entregado' | 'ausente_acreditado'
}

export type AlumnoBusqueda = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number
  viandas_credito: number
}

const MENUS: TipoMenu[] = ['A', 'B', 'C', 'Hamburguesa', 'Fideos', 'Sandwich']

export function ListaDelDia({
  pedidos,
  alumnos,
  precioVianda,
}: {
  pedidos: PedidoFila[]
  alumnos: AlumnoBusqueda[]
  precioVianda: number
}) {
  const router = useRouter()
  const [filtroGrado, setFiltroGrado] = useState<string>('')
  const [filtroDivision, setFiltroDivision] = useState<string>('')

  const grados = useMemo(
    () => Array.from(new Set(pedidos.map((p) => p.grado))).sort(),
    [pedidos],
  )
  const divisiones = useMemo(
    () =>
      Array.from(
        new Set(
          pedidos.filter((p) => (filtroGrado ? p.grado === filtroGrado : true)).map((p) => p.division),
        ),
      ).sort(),
    [pedidos, filtroGrado],
  )

  const pedidosFiltrados = useMemo(
    () =>
      pedidos.filter(
        (p) =>
          (!filtroGrado || p.grado === filtroGrado) && (!filtroDivision || p.division === filtroDivision),
      ),
    [pedidos, filtroGrado, filtroDivision],
  )

  const totalActivos = pedidosFiltrados.filter((p) => p.estado === 'confirmado').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalActivos}</span> viandas confirmadas
          {pedidosFiltrados.length !== pedidos.length ? ` (${pedidos.length} en total)` : ''}
        </p>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" className="h-9" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimir / PDF
          </Button>
          <ViandaExtraDialog alumnos={alumnos} precioVianda={precioVianda} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <FiltroChips
          label="Grado"
          opciones={grados}
          value={filtroGrado}
          onChange={(v) => {
            setFiltroGrado(v)
            setFiltroDivision('')
          }}
        />
        {grados.length > 0 ? (
          <FiltroChips label="División" opciones={divisiones} value={filtroDivision} onChange={setFiltroDivision} />
        ) : null}
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No hay viandas para mostrar.
        </div>
      ) : (
        <ul className="space-y-2">
          {pedidosFiltrados.map((p) => (
            <FilaPedido key={p.id} pedido={p} onCobro={() => router.push(`/encargada/cobro?alumno=${p.alumno_id}`)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FiltroChips({
  label,
  opciones,
  value,
  onChange,
}: {
  label: string
  opciones: string[]
  value: string
  onChange: (v: string) => void
}) {
  if (opciones.length <= 1) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">{label}:</span>
      <button
        type="button"
        onClick={() => onChange('')}
        className={cn(
          'min-h-10 rounded-full border px-3 py-1.5 text-xs',
          value === '' ? 'border-primary bg-primary/10' : 'hover:bg-muted',
        )}
      >
        Todos
      </button>
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            'min-h-10 rounded-full border px-3 py-1.5 text-xs',
            value === o ? 'border-primary bg-primary/10' : 'hover:bg-muted',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function etiquetaMenu(menu: TipoMenu): string {
  return menu === 'A' || menu === 'B' || menu === 'C' ? `Menú ${menu}` : menu
}

function FilaPedido({ pedido, onCobro }: { pedido: PedidoFila; onCobro: () => void }) {
  const [confirmAusencia, setConfirmAusencia] = useState(false)
  const [pending, startTransition] = useTransition()

  function ejecutarAusencia() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('pedido_id', pedido.id)
      const result = await marcarAusencia(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Ausencia marcada. Pedido reprogramado.')
        setConfirmAusencia(false)
      }
    })
  }

  const ausente = pedido.estado === 'ausente_acreditado'

  return (
    <li className={cn('rounded-xl border p-4 space-y-2', ausente && 'opacity-60')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{pedido.nombre_completo}</p>
          <p className="text-xs text-muted-foreground">
            {pedido.grado}° {pedido.division} · {etiquetaMenu(pedido.menu)}
          </p>
          {pedido.observaciones ? (
            <p className="text-xs italic mt-1">{pedido.observaciones}</p>
          ) : null}
        </div>
        {ausente ? (
          <Badge variant="secondary">Ausente</Badge>
        ) : (
          <Badge variant="outline">
            <CheckCircle2 className="size-3 mr-1" /> Confirmado
          </Badge>
        )}
      </div>

      {!ausente && (
        <div className="flex gap-2 pt-1 print:hidden">
          <Dialog open={confirmAusencia} onOpenChange={setConfirmAusencia}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="h-9">
                  <UserX className="size-4" /> Ausente
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Marcar ausencia</DialogTitle>
              </DialogHeader>
              <p className="text-sm">
                ¿Seguro que {pedido.nombre_completo} no vino? La vianda se reprogramará para el próximo día hábil.
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={() => setConfirmAusencia(false)}>
                  Cancelar
                </Button>
                <Button onClick={ejecutarAusencia} disabled={pending}>
                  {pending ? 'Marcando…' : 'Confirmar ausencia'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={onCobro} variant="ghost" size="sm" className="h-9">
            <Wallet className="size-4" /> Cobrar
          </Button>
        </div>
      )}
    </li>
  )
}

function ViandaExtraDialog({
  alumnos,
  precioVianda,
}: {
  alumnos: AlumnoBusqueda[]
  precioVianda: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [alumnoElegido, setAlumnoElegido] = useState<AlumnoBusqueda | null>(null)
  const [menuElegido, setMenuElegido] = useState<TipoMenu | null>(null)
  const [pending, startTransition] = useTransition()

  const resultados = useMemo(() => {
    if (!query.trim()) return [] as AlumnoBusqueda[]
    const q = query.trim().toLowerCase()
    return alumnos.filter((a) => a.nombre_completo.toLowerCase().includes(q)).slice(0, 10)
  }, [alumnos, query])

  function reset() {
    setQuery('')
    setAlumnoElegido(null)
    setMenuElegido(null)
  }

  function confirmar() {
    if (!alumnoElegido || !menuElegido) return
    startTransition(async () => {
      const result = await darViandaExtra({
        alumno_id: alumnoElegido.id,
        menu: menuElegido,
        precio_vianda: precioVianda,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.sin_credito) {
        toast.warning(`${alumnoElegido.nombre_completo} no tiene saldo. Cobralo en efectivo.`)
        setOpen(false)
        router.push(`/encargada/cobro?alumno=${alumnoElegido.id}&menu=${menuElegido}`)
        reset()
        return
      }
      toast.success('Vianda extra registrada')
      setOpen(false)
      reset()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className="h-9">
            <Plus className="size-4" /> Vianda extra
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar vianda sin pedido</DialogTitle>
        </DialogHeader>

        {!alumnoElegido ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar alumno por nombre"
                className="pl-9"
                autoFocus
              />
            </div>
            <ul className="space-y-1 max-h-72 overflow-y-auto">
              {resultados.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setAlumnoElegido(a)}
                    className="w-full rounded-lg border p-3 text-left hover:bg-muted"
                  >
                    <p className="font-medium text-sm">{a.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.grado}° {a.division} · {a.viandas_credito} viandas
                    </p>
                  </button>
                </li>
              ))}
              {query && resultados.length === 0 ? (
                <li className="text-sm text-muted-foreground text-center py-4">Sin resultados</li>
              ) : null}
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{alumnoElegido.nombre_completo}</p>
              <p className="text-xs text-muted-foreground">
                {alumnoElegido.grado}° {alumnoElegido.division} · {alumnoElegido.viandas_credito} viandas disponibles
              </p>
              <button
                type="button"
                onClick={() => setAlumnoElegido(null)}
                className="text-xs text-primary mt-2"
              >
                Cambiar alumno
              </button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Menú</p>
              <div className="grid grid-cols-3 gap-2">
                {MENUS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMenuElegido(m)}
                    className={cn(
                      'h-10 rounded-lg border text-sm transition-colors',
                      menuElegido === m ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                    )}
                  >
                    {etiquetaMenu(m)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmar} disabled={!menuElegido || pending}>
                {pending ? 'Registrando…' : 'Confirmar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
