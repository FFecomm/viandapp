'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, ChevronLeft, Search, User } from 'lucide-react'
import { cargarPedidoYVolver } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  describirCredito,
  diaCicloDe,
  fechaHoyAR,
  fechaMananaAR,
  formatFecha,
  formatPesos,
  FORMAS_PAGO_LABEL,
} from '@/lib/format'
import type { FormaPago, TipoMenu } from '@/lib/supabase/types'

type Alumno = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  credito_pesos: number | string
  viandas_credito: number
}
type MenuRow = { dia_ciclo: number; tipo_menu: 'A' | 'B' | 'C'; descripcion: string }
type Producto = { id: string; nombre: string; precio: number; categoria: 'bebida' | 'extra' }

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

const FIJOS: { menu: TipoMenu; label: string }[] = [
  { menu: 'Hamburguesa', label: 'Hamburguesa con papas' },
  { menu: 'Fideos', label: 'Fideos con queso' },
  { menu: 'Sandwich', label: 'Sándwich de suprema' },
]

export function NuevoPedidoWizard({
  alumnos,
  menus,
  productos,
  precioVianda,
}: {
  alumnos: Alumno[]
  menus: MenuRow[]
  productos: Producto[]
  precioVianda: number
}) {
  const [step, setStep] = useState<Step>(1)
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [query, setQuery] = useState('')
  const [fecha, setFecha] = useState<string>(fechaHoyAR())
  const [menu, setMenu] = useState<TipoMenu | null>(null)
  const [obs, setObs] = useState<string>('')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [forma, setForma] = useState<FormaPago | null>(null)
  const [pending, startTransition] = useTransition()

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return alumnos.filter((a) => a.nombre_completo.toLowerCase().includes(q)).slice(0, 8)
  }, [query, alumnos])

  const menusDelDia = useMemo(() => {
    const dia = diaCicloDe(fecha)
    return menus.filter((m) => m.dia_ciclo === dia)
  }, [menus, fecha])

  const productosElegidos = useMemo(
    () => productos.filter((p) => seleccionados.has(p.id)),
    [productos, seleccionados],
  )

  const totalExtras = productosElegidos.reduce((s, p) => s + p.precio, 0)
  const totalPedido = precioVianda + totalExtras

  const creditoPesos = alumno ? Number(alumno.credito_pesos) : 0
  const viandasDisponibles = alumno?.viandas_credito ?? 0
  const tieneCredito = viandasDisponibles > 0 || creditoPesos > 0

  const previewCredito = useMemo(() => {
    if (!alumno || forma !== 'credito') return null
    const nuevoSaldo = creditoPesos - totalPedido
    const nuevasViandas = Math.max(0, viandasDisponibles - 1)
    return { nuevoSaldo, nuevasViandas }
  }, [alumno, forma, creditoPesos, totalPedido, viandasDisponibles])

  function next() {
    setStep((s) => Math.min(7, s + 1) as Step)
  }
  function back() {
    setStep((s) => Math.max(1, s - 1) as Step)
  }

  function toggleProducto(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function confirmar() {
    if (!alumno || !menu || !forma) return
    startTransition(async () => {
      const result = await cargarPedidoYVolver({
        alumno_id: alumno.id,
        fecha,
        menu,
        observaciones: obs.trim() || null,
        forma_pago_vianda: forma,
        precio_vianda: precioVianda,
        productos: productosElegidos.map((p) => ({ producto_id: p.id, cantidad: 1 })),
      })
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="space-y-5">
      <Pasos paso={step} />

      {step > 1 ? (
        <Button onClick={back} variant="ghost" size="sm" className="-ml-2 h-9">
          <ChevronLeft className="size-4" /> Atrás
        </Button>
      ) : null}

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">¿Para quién es el pedido?</h2>
          {alumno ? (
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <User className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{alumno.nombre_completo}</p>
                  <p className="text-sm text-muted-foreground">{alumno.grado}° {alumno.division}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setAlumno(null); setQuery('') }}>
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre"
                  className="h-12 pl-9 text-base"
                  autoFocus
                />
              </div>
              {matches.length > 0 && (
                <ul className="rounded-xl border divide-y bg-card max-h-72 overflow-auto">
                  {matches.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => { setAlumno(a); next() }}
                        className="w-full text-left p-3 hover:bg-muted"
                      >
                        <p className="font-medium">{a.nombre_completo}</p>
                        <p className="text-xs text-muted-foreground">{a.grado}° {a.division}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {alumno && (
            <Button onClick={next} className="w-full h-12 text-base">Continuar</Button>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">¿Qué día?</h2>
          <div className="grid grid-cols-2 gap-2">
            <BotonAccesoFecha onClick={() => { setFecha(fechaHoyAR()); next() }} active={fecha === fechaHoyAR()} label="Hoy" />
            <BotonAccesoFecha onClick={() => { setFecha(fechaMananaAR()); next() }} active={fecha === fechaMananaAR()} label="Mañana" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Otra fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              min={fechaHoyAR()}
              onChange={(e) => setFecha(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <Button onClick={next} className="w-full h-12 text-base">Continuar con {formatFecha(fecha)}</Button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">¿Qué menú?</h2>
          <p className="text-sm text-muted-foreground">Para el {formatFecha(fecha)}</p>
          <div className="grid grid-cols-2 gap-2">
            {menusDelDia.map((m) => (
              <BotonMenu
                key={m.tipo_menu}
                titulo={`Menú ${m.tipo_menu}`}
                descripcion={m.descripcion}
                active={menu === m.tipo_menu}
                onClick={() => { setMenu(m.tipo_menu as TipoMenu); next() }}
              />
            ))}
            {FIJOS.map((f) => (
              <BotonMenu
                key={f.menu}
                titulo={f.menu}
                descripcion={f.label}
                active={menu === f.menu}
                onClick={() => { setMenu(f.menu); next() }}
              />
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">¿Alguna observación?</h2>
          <p className="text-sm text-muted-foreground">Ej: «sin cebolla», «con poco condimento». Opcional.</p>
          <Textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Escribí acá si hace falta…"
            className="min-h-24 text-base"
          />
          <div className="flex gap-2">
            <Button onClick={next} variant="outline" className="flex-1 h-12 text-base">Saltar</Button>
            <Button onClick={next} className="flex-1 h-12 text-base">Continuar</Button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">¿Productos adicionales?</h2>
          {productos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay productos cargados en el catálogo.</p>
          ) : (
            <ul className="space-y-2">
              {productos.map((p) => {
                const sel = seleccionados.has(p.id)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggleProducto(p.id)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 rounded-xl border p-4 text-left transition-colors',
                        sel && 'border-primary bg-primary/5',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'size-6 rounded-md border flex items-center justify-center',
                          sel && 'bg-primary border-primary',
                        )}>
                          {sel && <Check className="size-4 text-primary-foreground" />}
                        </div>
                        <div>
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.categoria}</p>
                        </div>
                      </div>
                      <span className="font-medium">{formatPesos(p.precio)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <Button onClick={next} className="w-full h-12 text-base">
            Continuar {seleccionados.size > 0 ? `(${seleccionados.size} extra${seleccionados.size === 1 ? '' : 's'})` : ''}
          </Button>
        </section>
      )}

      {step === 6 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">¿Cómo paga?</h2>
          <p className="text-sm">
            Total: <span className="font-semibold">{formatPesos(totalPedido)}</span>
            {totalExtras > 0 ? ` (vianda ${formatPesos(precioVianda)} + extras ${formatPesos(totalExtras)})` : null}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(['credito', 'transferencia', 'efectivo', 'a_deber'] as const).map((opt) => {
              const deshab = opt === 'credito' && !tieneCredito
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={deshab}
                  onClick={() => { setForma(opt); next() }}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors',
                    forma === opt ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                    deshab && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <p className="font-medium">{FORMAS_PAGO_LABEL[opt]}</p>
                  {opt === 'credito' && alumno && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {tieneCredito ? describirCredito(viandasDisponibles, creditoPesos) : 'Sin saldo'}
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {previewCredito && alumno && (
            <div className="rounded-xl border bg-violet-50 p-4 text-sm">
              <p className="text-muted-foreground">Después del pedido quedan:</p>
              <p className="font-medium mt-1">
                {previewCredito.nuevasViandas} viandas y {formatPesos(previewCredito.nuevoSaldo)} en saldo.
              </p>
            </div>
          )}
        </section>
      )}

      {step === 7 && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium">Confirmar pedido</h2>
          <ul className="space-y-2 rounded-xl border p-4 text-sm">
            <Row label="Alumno" value={`${alumno?.nombre_completo} (${alumno?.grado}° ${alumno?.division})`} />
            <Row label="Fecha" value={formatFecha(fecha)} />
            <Row label="Menú" value={menu === 'A' || menu === 'B' || menu === 'C' ? `Menú ${menu}` : (menu ?? '')} />
            {obs ? <Row label="Observaciones" value={obs} /> : null}
            {productosElegidos.length > 0 && (
              <Row label="Extras" value={productosElegidos.map((p) => p.nombre).join(', ')} />
            )}
            <Row label="Forma de pago" value={forma ? FORMAS_PAGO_LABEL[forma] : ''} />
            <Row label="Total" value={formatPesos(totalPedido)} bold />
          </ul>

          <Button onClick={confirmar} disabled={pending} className="w-full h-12 text-base">
            {pending ? 'Guardando…' : 'Confirmar pedido'}
          </Button>
        </section>
      )}
    </div>
  )
}

function Pasos({ paso }: { paso: Step }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <div
          key={n}
          className={cn(
            'flex-1 h-1 rounded-full',
            paso >= n ? 'bg-primary' : 'bg-muted',
          )}
        />
      ))}
    </div>
  )
}

function BotonAccesoFecha({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-14 rounded-xl border font-medium transition-colors',
        active ? 'border-primary bg-primary/10' : 'hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}

function BotonMenu({ titulo, descripcion, active, onClick }: { titulo: string; descripcion: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-28 rounded-xl border p-3 text-left transition-colors flex flex-col justify-between',
        active ? 'border-primary bg-primary/10' : 'hover:bg-muted',
      )}
    >
      <Badge variant="secondary" className="w-fit">{titulo}</Badge>
      <p className="text-sm leading-tight">{descripcion}</p>
    </button>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-right', bold && 'font-semibold')}>{value}</span>
    </li>
  )
}
