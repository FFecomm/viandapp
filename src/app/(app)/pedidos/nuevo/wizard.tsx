'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Banknote, Check, ChevronLeft, ChevronRight, CreditCard, Hourglass, Search, User, Wallet } from 'lucide-react'
import { cargarPedidoOperadora } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { diaCicloDe, fechaHoyAR, formatPesos } from '@/lib/format'
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

type DiaSeleccionado = { fecha: string; menu: TipoMenu | null; observaciones: string }

const FIJOS: { menu: TipoMenu; descripcion: string }[] = [
  { menu: 'Hamburguesa', descripcion: 'Hamburguesa con papas' },
  { menu: 'Fideos', descripcion: 'Fideos con queso' },
  { menu: 'Sandwich', descripcion: 'Sándwich de suprema' },
]

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function proximosDiasHabiles(n: number, incluirHoy = true): string[] {
  const dias: string[] = []
  const hoyStr = fechaHoyAR()
  const [y, m, d] = hoyStr.split('-').map(Number)
  const cursor = new Date(Date.UTC(y, m - 1, d))
  if (!incluirHoy) cursor.setUTCDate(cursor.getUTCDate() + 1)
  while (dias.length < n) {
    const dow = cursor.getUTCDay()
    if (dow !== 0 && dow !== 6) {
      const yy = cursor.getUTCFullYear()
      const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(cursor.getUTCDate()).padStart(2, '0')
      dias.push(`${yy}-${mm}-${dd}`)
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dias
}

function formatDiaLargo(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return `${DIAS_SEMANA[date.getUTCDay()]} ${d} de ${MESES[m - 1]}`
}

function etiquetaMenu(menu: TipoMenu): string {
  return menu === 'A' || menu === 'B' || menu === 'C' ? `Menú ${menu}` : menu
}

type Step = 0 | 1 | 2 | 3

export function NuevoPedidoWizard({
  alumnos,
  menus,
  precioVianda,
  volverHref = '/pedidos',
}: {
  alumnos: Alumno[]
  menus: MenuRow[]
  precioVianda: number
  volverHref?: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [query, setQuery] = useState('')
  const [seleccionados, setSeleccionados] = useState<DiaSeleccionado[]>([])
  const [formaPago, setFormaPago] = useState<FormaPago>('credito')
  const [pending, startTransition] = useTransition()

  const matches = useMemo(() => {
    if (alumno) return []
    if (!query.trim()) return alumnos.slice(0, 10)
    const q = query.trim().toLowerCase()
    return alumnos.filter((a) => a.nombre_completo.toLowerCase().includes(q)).slice(0, 12)
  }, [alumnos, query, alumno])

  const diasDisponibles = useMemo(() => proximosDiasHabiles(10, true), [])

  const viandasDisponibles = alumno?.viandas_credito ?? 0
  const viandasUsar = seleccionados.length
  const saldoDespues = viandasDisponibles - viandasUsar
  const saldoSuficiente = saldoDespues >= 0
  const todosTienenMenu = seleccionados.length > 0 && seleccionados.every((s) => s.menu !== null)
  const totalPesos = viandasUsar * precioVianda
  const requierePago = formaPago === 'credito'
  const puedeConfirmar = todosTienenMenu && (!requierePago || saldoSuficiente)

  function toggleDia(fecha: string) {
    setSeleccionados((prev) => {
      if (prev.find((s) => s.fecha === fecha)) return prev.filter((s) => s.fecha !== fecha)
      return [...prev, { fecha, menu: null, observaciones: '' }].sort((a, b) => a.fecha.localeCompare(b.fecha))
    })
  }
  function setMenuDia(fecha: string, menu: TipoMenu) {
    setSeleccionados((prev) => prev.map((s) => (s.fecha === fecha ? { ...s, menu } : s)))
  }
  function setObsDia(fecha: string, obs: string) {
    setSeleccionados((prev) => prev.map((s) => (s.fecha === fecha ? { ...s, observaciones: obs } : s)))
  }

  function confirmar() {
    if (!alumno || !puedeConfirmar) return
    startTransition(async () => {
      const result = await cargarPedidoOperadora({
        alumno_id: alumno.id,
        precio_vianda: precioVianda,
        forma_pago_vianda: formaPago,
        dias: seleccionados.map((s) => ({
          fecha: s.fecha,
          menu: s.menu!,
          observaciones: s.observaciones.trim() || null,
        })),
      })
      if (result?.error) toast.error(result.error)
      else {
        toast.success(`Pedido cargado para ${alumno.nombre_completo.split(' ')[0]}`)
        const dest = volverHref === '/encargada' ? '/encargada' : `/pedidos?fecha=${seleccionados[0].fecha}`
        router.push(dest)
      }
    })
  }

  return (
    <div className="space-y-5">
      <Indicador paso={step} />

      {step > 0 ? (
        <Button
          onClick={() => {
            if (step === 1) {
              setAlumno(null)
              setSeleccionados([])
            }
            setStep((s) => Math.max(0, s - 1) as Step)
          }}
          variant="ghost"
          size="sm"
          className="-ml-2 h-9"
        >
          <ChevronLeft className="size-4" /> Atrás
        </Button>
      ) : null}

      {step === 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">¿Para qué alumno?</h2>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre"
              className="pl-9 h-11 text-base"
              autoFocus
            />
          </div>
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {matches.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setAlumno(a)
                    setStep(1)
                  }}
                  className="w-full rounded-xl border p-3 text-left hover:bg-muted flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <User className="size-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.grado}° {a.division}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {a.viandas_credito} viandas
                  </Badge>
                </button>
              </li>
            ))}
            {matches.length === 0 ? (
              <li className="text-sm text-muted-foreground text-center py-4">Sin resultados</li>
            ) : null}
          </ul>
        </section>
      )}

      {step === 1 && alumno && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para <span className="font-medium text-foreground">{alumno.nombre_completo}</span> · {alumno.viandas_credito} viandas disponibles
          </p>
          <h2 className="text-xl font-medium">¿Qué días?</h2>
          <p className="text-sm text-muted-foreground">Elegí uno o más días hábiles.</p>
          <ul className="space-y-2">
            {diasDisponibles.map((fecha) => {
              const elegido = !!seleccionados.find((s) => s.fecha === fecha)
              return (
                <li key={fecha}>
                  <button
                    type="button"
                    onClick={() => toggleDia(fecha)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl border p-4 text-left transition-colors',
                      elegido ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'size-6 rounded-md border flex items-center justify-center',
                        elegido && 'bg-primary border-primary',
                      )}>
                        {elegido && <Check className="size-4 text-primary-foreground" />}
                      </div>
                      <p className="font-medium">{formatDiaLargo(fecha)}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          <Button
            onClick={() => setStep(2)}
            disabled={seleccionados.length === 0}
            className="w-full h-12 text-base"
          >
            Siguiente <ChevronRight className="size-4" />
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <h2 className="text-xl font-medium">Elegí el menú de cada día</h2>
          <ul className="space-y-5">
            {seleccionados.map((s) => {
              const dia = diaCicloDe(s.fecha)
              const menusDelDia = menus.filter((m) => m.dia_ciclo === dia)
              const opciones: { value: TipoMenu; titulo: string; descripcion: string }[] = [
                ...menusDelDia.map((m) => ({
                  value: m.tipo_menu as TipoMenu,
                  titulo: `Menú ${m.tipo_menu}`,
                  descripcion: m.descripcion,
                })),
                ...FIJOS.map((f) => ({ value: f.menu, titulo: f.menu, descripcion: f.descripcion })),
              ]
              return (
                <li key={s.fecha} className="space-y-3 rounded-2xl border p-4">
                  <p className="text-base font-medium">{formatDiaLargo(s.fecha)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {opciones.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setMenuDia(s.fecha, o.value)}
                        className={cn(
                          'h-24 rounded-xl border p-3 text-left transition-colors flex flex-col justify-between',
                          s.menu === o.value ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                        )}
                      >
                        <Badge variant="secondary" className="w-fit text-xs">{o.titulo}</Badge>
                        <p className="text-xs leading-tight">{o.descripcion}</p>
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={s.observaciones}
                    onChange={(e) => setObsDia(s.fecha, e.target.value)}
                    placeholder="Observaciones (opcional)"
                    className="min-h-16 text-sm"
                  />
                </li>
              )
            })}
          </ul>
          <Button
            onClick={() => setStep(3)}
            disabled={!todosTienenMenu}
            className="w-full h-12 text-base"
          >
            Siguiente <ChevronRight className="size-4" />
          </Button>
        </section>
      )}

      {step === 3 && alumno && (
        <section className="space-y-5">
          <h2 className="text-xl font-medium">¿Cómo lo paga?</h2>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Día</th>
                  <th className="text-left p-3 font-medium">Menú</th>
                </tr>
              </thead>
              <tbody>
                {seleccionados.map((s) => (
                  <tr key={s.fecha} className="border-t">
                    <td className="p-3">
                      <p>{formatDiaLargo(s.fecha)}</p>
                      {s.observaciones ? (
                        <p className="text-xs text-muted-foreground mt-0.5">{s.observaciones}</p>
                      ) : null}
                    </td>
                    <td className="p-3">{s.menu ? etiquetaMenu(s.menu) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alumno</span>
              <span className="font-medium">{alumno.nombre_completo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cantidad</span>
              <span>{viandasUsar} {viandasUsar === 1 ? 'vianda' : 'viandas'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{formatPesos(totalPesos)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Forma de pago</p>
            <div className="grid grid-cols-2 gap-2">
              <OpcionPago
                icon={Wallet}
                label="Saldo a favor"
                hint={`${viandasDisponibles} ${viandasDisponibles === 1 ? 'vianda' : 'viandas'}`}
                value="credito"
                activa={formaPago}
                onSelect={setFormaPago}
              />
              <OpcionPago
                icon={Banknote}
                label="Efectivo"
                hint="cobrado en mano"
                value="efectivo"
                activa={formaPago}
                onSelect={setFormaPago}
              />
              <OpcionPago
                icon={CreditCard}
                label="Transferencia"
                hint="ya recibida"
                value="transferencia"
                activa={formaPago}
                onSelect={setFormaPago}
              />
              <OpcionPago
                icon={Hourglass}
                label="A deber"
                hint="paga después"
                value="a_deber"
                activa={formaPago}
                onSelect={setFormaPago}
              />
            </div>
          </div>

          {requierePago && !saldoSuficiente ? (
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm">
              <p className="font-medium">Saldo insuficiente</p>
              <p className="text-muted-foreground mt-1">
                Faltan {Math.abs(saldoDespues)} {Math.abs(saldoDespues) === 1 ? 'vianda' : 'viandas'}.
                Elegí otra forma de pago o cargá saldo desde Crédito.
              </p>
            </div>
          ) : null}

          <Button onClick={confirmar} disabled={pending || !puedeConfirmar} className="w-full h-12 text-base">
            {pending ? 'Guardando…' : 'Confirmar pedido'}
          </Button>
        </section>
      )}
    </div>
  )
}

function Indicador({ paso }: { paso: Step }) {
  const labels = ['Alumno', 'Días', 'Menús', 'Confirmar']
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>
        <span className="font-semibold text-foreground">{Math.min(paso + 1, 4)}</span> / 4
      </span>
      <div className="flex-1 flex gap-1">
        {labels.map((_, n) => (
          <div key={n} className={cn('flex-1 h-1 rounded-full', paso >= n ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>
    </div>
  )
}

function OpcionPago({
  icon: Icon,
  label,
  hint,
  value,
  activa,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
  value: FormaPago
  activa: FormaPago
  onSelect: (v: FormaPago) => void
}) {
  const selected = activa === value
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'rounded-xl border p-3 text-left transition-colors flex flex-col gap-1',
        selected ? 'border-primary bg-primary/10' : 'hover:bg-muted',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  )
}
