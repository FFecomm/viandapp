'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { diaCicloDe, fechaHoyAR, formatPesos } from '@/lib/format'
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
type OpcionRow = { id: string; menu: string; texto: string; orden: number }

type DiaSeleccionado = { fecha: string; menu: TipoMenu | null; opcionesIds: string[] }

const FIJOS: { menu: TipoMenu; descripcion: string }[] = [
  { menu: 'Hamburguesa', descripcion: 'Hamburguesa con papas' },
  { menu: 'Fideos', descripcion: 'Fideos con queso' },
  { menu: 'Sandwich', descripcion: 'Sándwich de suprema' },
]

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Feriados nacionales no laborables de Argentina (fechas con día fijo).
// Los feriados con fecha móvil (Carnaval, Semana Santa) se agregan año a año.
const FERIADOS_AR: Set<string> = new Set([
  '2026-01-01',
  '2026-02-16', '2026-02-17',
  '2026-03-23', '2026-03-24',
  '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-25',
  '2026-06-15', '2026-06-20',
  '2026-07-09', '2026-08-17',
  '2026-10-12', '2026-11-23',
  '2026-12-08', '2026-12-25',
  '2027-01-01',
  '2027-02-08', '2027-02-09',
  '2027-03-24', '2027-03-25', '2027-03-26',
  '2027-04-02', '2027-05-01', '2027-05-25',
  '2027-06-17', '2027-06-20',
  '2027-07-09', '2027-08-16',
  '2027-10-11', '2027-11-22',
  '2027-12-08', '2027-12-25',
])

function proximosDiasHabiles(n: number): string[] {
  const dias: string[] = []
  const hoyStr = fechaHoyAR()
  const [y, m, d] = hoyStr.split('-').map(Number)
  const cursor = new Date(Date.UTC(y, m - 1, d))
  cursor.setUTCDate(cursor.getUTCDate() + 1)
  let intentos = 0
  while (dias.length < n && intentos < 60) {
    intentos++
    const dow = cursor.getUTCDay()
    const yy = cursor.getUTCFullYear()
    const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(cursor.getUTCDate()).padStart(2, '0')
    const fechaStr = `${yy}-${mm}-${dd}`
    const esFinde = dow === 0 || dow === 6
    const esFeriado = FERIADOS_AR.has(fechaStr)
    if (!esFinde && !esFeriado) dias.push(fechaStr)
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
  opciones,
  fechasYaPedidas,
  precioVianda,
  mpDisponible,
}: {
  alumnos: MiAlumno[]
  alumnoPreseleccionado: string | null
  menus: MenuRow[]
  opciones: OpcionRow[]
  fechasYaPedidas: string[]
  precioVianda: number
  mpDisponible: boolean
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

  return (
    <WizardConAlumno
      alumno={alumno}
      menus={menus}
      opciones={opciones}
      fechasYaPedidas={fechasYaPedidas}
      precioVianda={precioVianda}
      mpDisponible={mpDisponible}
    />
  )
}

function WizardConAlumno({
  alumno,
  menus,
  opciones,
  fechasYaPedidas,
  precioVianda,
  mpDisponible,
}: {
  alumno: MiAlumno
  menus: MenuRow[]
  opciones: OpcionRow[]
  fechasYaPedidas: string[]
  precioVianda: number
  mpDisponible: boolean
}) {
  const diasDisponibles = useMemo(() => proximosDiasHabiles(10), [])
  const fechasYaPedidasSet = useMemo(() => new Set(fechasYaPedidas), [fechasYaPedidas])

  const [step, setStep] = useState<Step>(1)
  const [seleccionados, setSeleccionados] = useState<DiaSeleccionado[]>([])
  const [pending, startTransition] = useTransition()

  const cantidad = seleccionados.length
  const totalPesos = cantidad * precioVianda
  const todosTienenMenu = cantidad > 0 && seleccionados.every((s) => s.menu !== null)

  function toggleDia(fecha: string) {
    setSeleccionados((prev) => {
      if (prev.find((s) => s.fecha === fecha)) return prev.filter((s) => s.fecha !== fecha)
      return [...prev, { fecha, menu: null, opcionesIds: [] }].sort((a, b) => a.fecha.localeCompare(b.fecha))
    })
  }

  function setMenuDia(fecha: string, menu: TipoMenu) {
    setSeleccionados((prev) => prev.map((s) => (s.fecha === fecha ? { ...s, menu, opcionesIds: [] } : s)))
  }

  function toggleOpcionDia(fecha: string, opcionId: string) {
    setSeleccionados((prev) =>
      prev.map((s) => {
        if (s.fecha !== fecha) return s
        const yaEsta = s.opcionesIds.includes(opcionId)
        const opcionesIds = yaEsta
          ? s.opcionesIds.filter((id) => id !== opcionId)
          : [...s.opcionesIds, opcionId]
        return { ...s, opcionesIds }
      }),
    )
  }

  function textoOpciones(opcionesIds: string[]): string {
    const textos = opcionesIds
      .map((id) => opciones.find((o) => o.id === id)?.texto)
      .filter((t): t is string => !!t)
    return textos.join(', ')
  }

  function pagarYConfirmar() {
    if (!todosTienenMenu) return
    if (!mpDisponible) {
      toast.error('Mercado Pago no está configurado todavía')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/pagos/crear-preferencia-pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id: alumno.id,
          pedidos: seleccionados.map((s) => ({
            fecha: s.fecha,
            menu: s.menu,
            observaciones: textoOpciones(s.opcionesIds) || undefined,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'No se pudo iniciar el pago')
        return
      }
      const url = json.init_point ?? json.sandbox_init_point
      if (!url) {
        toast.error('Mercado Pago no devolvió el link de pago')
        return
      }
      window.location.href = url
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const proximos5 = diasDisponibles
                .filter((f) => !fechasYaPedidasSet.has(f))
                .slice(0, 5)
              setSeleccionados(
                proximos5.map((f) => ({ fecha: f, menu: null, opcionesIds: [] })),
              )
            }}
            className="w-full h-11"
          >
            Pedir los próximos 5 días hábiles
          </Button>
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
            disabled={cantidad === 0}
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
              const menusDisponibles: { value: TipoMenu; titulo: string; descripcion: string }[] = [
                ...menusDelDia.map((m) => ({
                  value: m.tipo_menu as TipoMenu,
                  titulo: `Menú ${m.tipo_menu}`,
                  descripcion: m.descripcion,
                })),
                ...FIJOS.map((f) => ({ value: f.menu, titulo: f.menu, descripcion: f.descripcion })),
              ]
              const opcionesDelMenu = s.menu
                ? opciones.filter((o) => o.menu === s.menu)
                : []
              return (
                <li key={s.fecha} className="space-y-3 rounded-2xl border p-4">
                  <p className="text-base font-medium">{formatDiaLargo(s.fecha)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {menusDisponibles.map((o) => (
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
                  {s.menu && opcionesDelMenu.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground">
                        Opciones (tildá las que quieras)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {opcionesDelMenu.map((op) => {
                          const tildada = s.opcionesIds.includes(op.id)
                          return (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => toggleOpcionDia(s.fecha, op.id)}
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
          <h2 className="text-xl font-medium">Revisá y pagá</h2>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Día</th>
                  <th className="text-left p-3 font-medium">Menú</th>
                </tr>
              </thead>
              <tbody>
                {seleccionados.map((s) => {
                  const obs = textoOpciones(s.opcionesIds)
                  return (
                    <tr key={s.fecha} className="border-t">
                      <td className="p-3">
                        <p>{formatDiaLargo(s.fecha)}</p>
                        {obs ? (
                          <p className="text-xs text-muted-foreground mt-0.5">{obs}</p>
                        ) : null}
                      </td>
                      <td className="p-3">{s.menu ? etiquetaMenu(s.menu) : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Precio por vianda</span>
              <span>{formatPesos(precioVianda)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cantidad</span>
              <span>
                {cantidad} {cantidad === 1 ? 'vianda' : 'viandas'}
              </span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between text-base">
              <span className="font-medium">Total a pagar</span>
              <span className="font-semibold">{formatPesos(totalPesos)}</span>
            </div>
          </div>

          {!mpDisponible ? (
            <div className="rounded-xl border bg-orange-50 border-orange-200 p-4 text-sm">
              <p className="font-medium">Mercado Pago no está disponible todavía</p>
              <p className="text-muted-foreground mt-1">
                El colegio aún no completó la conexión. Probá más tarde o avisales.
              </p>
            </div>
          ) : null}

          <Button
            onClick={pagarYConfirmar}
            disabled={pending || !mpDisponible}
            className="w-full h-12 text-base"
          >
            {pending ? 'Redirigiendo a Mercado Pago…' : `Pagar ${formatPesos(totalPesos)} con Mercado Pago`}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Los pedidos se confirman cuando Mercado Pago apruebe el pago.
          </p>
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
