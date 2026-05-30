'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cargarPedidoFamilia } from '../actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { diaCicloDe, fechaHoyAR } from '@/lib/format'
import type { TipoMenu } from '@/lib/supabase/types'

type MiAlumno = {
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

function proximosDiasHabiles(n: number): string[] {
  const dias: string[] = []
  const hoyStr = fechaHoyAR()
  const [y, m, d] = hoyStr.split('-').map(Number)
  const cursor = new Date(Date.UTC(y, m - 1, d))
  cursor.setUTCDate(cursor.getUTCDate() + 1)
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

type Step = 1 | 2 | 3

export function WizardFamilia({
  alumnos,
  alumnoPreseleccionado,
  menus,
  precioVianda,
  fechasYaPedidas,
}: {
  alumnos: MiAlumno[]
  alumnoPreseleccionado: string | null
  menus: MenuRow[]
  precioVianda: number
  fechasYaPedidas: string[]
}) {
  const alumno = useMemo<MiAlumno | null>(() => {
    if (alumnoPreseleccionado) return alumnos.find((a) => a.id === alumnoPreseleccionado) ?? null
    if (alumnos.length === 1) return alumnos[0]
    return null
  }, [alumnos, alumnoPreseleccionado])

  if (!alumno) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Elegí para qué hijo querés pedir.</p>
        <ul className="space-y-2">
          {alumnos.map((a) => (
            <li key={a.id}>
              <Link
                href={`/familia/pedir?alumno=${a.id}`}
                className="block rounded-xl border p-4 hover:bg-muted"
              >
                <p className="font-medium">{a.nombre_completo}</p>
                <p className="text-xs text-muted-foreground">{a.grado}° {a.division}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return <WizardConAlumno alumno={alumno} menus={menus} precioVianda={precioVianda} fechasYaPedidas={fechasYaPedidas} />
}

function WizardConAlumno({
  alumno,
  menus,
  precioVianda,
  fechasYaPedidas,
}: {
  alumno: MiAlumno
  menus: MenuRow[]
  precioVianda: number
  fechasYaPedidas: string[]
}) {
  const diasDisponibles = useMemo(() => proximosDiasHabiles(10), [])
  const fechasYaPedidasSet = useMemo(() => new Set(fechasYaPedidas), [fechasYaPedidas])

  const [step, setStep] = useState<Step>(1)
  const [seleccionados, setSeleccionados] = useState<DiaSeleccionado[]>([])
  const [pending, startTransition] = useTransition()

  const viandasDisponibles = alumno.viandas_credito
  const viandasUsar = seleccionados.length
  const saldoDespues = viandasDisponibles - viandasUsar
  const saldoSuficiente = saldoDespues >= 0
  const todosTienenMenu = seleccionados.length > 0 && seleccionados.every((s) => s.menu !== null)

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
    if (!todosTienenMenu || !saldoSuficiente) return
    startTransition(async () => {
      const result = await cargarPedidoFamilia({
        alumno_id: alumno.id,
        precio_vianda: precioVianda,
        dias: seleccionados.map((s) => ({
          fecha: s.fecha,
          menu: s.menu!,
          observaciones: s.observaciones.trim() || null,
        })),
      })
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="space-y-5">
      <Indicador paso={step} />

      {step > 1 ? (
        <Button
          onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          variant="ghost"
          size="sm"
          className="-ml-2 h-9"
        >
          <ChevronLeft className="size-4" /> Atrás
        </Button>
      ) : null}

      {step === 1 && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para <span className="font-medium text-foreground">{alumno.nombre_completo}</span>
          </p>
          <h2 className="text-xl font-medium">¿Qué días?</h2>
          <p className="text-sm text-muted-foreground">
            Elegí uno o más días. Los días donde ya tenés pedido aparecen deshabilitados.
          </p>
          <ul className="space-y-2">
            {diasDisponibles.map((fecha) => {
              const yaPedido = fechasYaPedidasSet.has(fecha)
              const elegido = !!seleccionados.find((s) => s.fecha === fecha)
              return (
                <li key={fecha}>
                  <button
                    type="button"
                    disabled={yaPedido}
                    onClick={() => toggleDia(fecha)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl border p-4 text-left transition-colors',
                      yaPedido && 'opacity-50 cursor-not-allowed',
                      elegido && 'border-primary bg-primary/10',
                      !yaPedido && !elegido && 'hover:bg-muted',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'size-6 rounded-md border flex items-center justify-center',
                          elegido && 'bg-primary border-primary',
                        )}
                      >
                        {elegido && <Check className="size-4 text-primary-foreground" />}
                      </div>
                      <p className="font-medium">{formatDiaLargo(fecha)}</p>
                    </div>
                    {yaPedido ? <Badge variant="secondary">Ya pediste</Badge> : null}
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
                        <Badge variant="secondary" className="w-fit text-xs">
                          {o.titulo}
                        </Badge>
                        <p className="text-xs leading-tight">{o.descripcion}</p>
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={s.observaciones}
                    onChange={(e) => setObsDia(s.fecha, e.target.value)}
                    placeholder="Observaciones (opcional, ej: «sin queso»)"
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

      {step === 3 && (
        <section className="space-y-5">
          <h2 className="text-xl font-medium">Confirmar pedido</h2>

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
            <Fila label="Saldo actual" valor={`${viandasDisponibles} ${viandasDisponibles === 1 ? 'vianda' : 'viandas'}`} />
            <Fila label="Viandas a usar" valor={`${viandasUsar}`} />
            <div className="border-t pt-2">
              <Fila
                label="Saldo que queda"
                valor={`${saldoDespues} ${Math.abs(saldoDespues) === 1 ? 'vianda' : 'viandas'}`}
                bold
                negativo={!saldoSuficiente}
              />
            </div>
          </div>

          {!saldoSuficiente ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm">
                <p className="font-medium">No tenés saldo suficiente</p>
                <p className="text-muted-foreground mt-1">
                  Te faltan {Math.abs(saldoDespues)}{' '}
                  {Math.abs(saldoDespues) === 1 ? 'vianda' : 'viandas'}.
                </p>
              </div>
              <Link href="/familia/credito" className={cn(buttonVariants(), 'w-full h-12 text-base')}>
                Cargar saldo primero
              </Link>
            </div>
          ) : (
            <Button onClick={confirmar} disabled={pending} className="w-full h-12 text-base">
              {pending ? 'Guardando…' : 'Confirmar pedido'}
            </Button>
          )}
        </section>
      )}
    </div>
  )
}

function Indicador({ paso }: { paso: Step }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>
        <span className="font-semibold text-foreground">{paso}</span> / 3
      </span>
      <div className="flex-1 flex gap-1">
        {[1, 2, 3].map((n) => (
          <div key={n} className={cn('flex-1 h-1 rounded-full', paso >= n ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>
    </div>
  )
}

function Fila({
  label,
  valor,
  bold,
  negativo,
}: {
  label: string
  valor: string
  bold?: boolean
  negativo?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && 'font-semibold', negativo && 'text-destructive')}>{valor}</span>
    </div>
  )
}
