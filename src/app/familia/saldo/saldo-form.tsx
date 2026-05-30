'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatPesos } from '@/lib/format'
import { cn } from '@/lib/utils'

type Alumno = {
  id: string
  nombre_completo: string
  grado: string
  division: string
  viandas_credito: number
}

export function SaldoForm({
  alumnos,
  precioVianda,
  mpDisponible,
}: {
  alumnos: Alumno[]
  precioVianda: number
  mpDisponible: boolean
}) {
  const [alumnoId, setAlumnoId] = useState<string>(alumnos[0]?.id ?? '')
  const [viandas, setViandas] = useState<number>(5)
  const [pending, startTransition] = useTransition()

  const alumno = useMemo(() => alumnos.find((a) => a.id === alumnoId) ?? null, [alumnos, alumnoId])
  const total = viandas > 0 ? viandas * precioVianda : 0

  function pagar() {
    if (!alumno) return toast.error('Elegí un hijo')
    if (viandas < 1) return toast.error('Cargá al menos 1 vianda')
    if (!mpDisponible) return toast.error('Mercado Pago no está configurado')

    startTransition(async () => {
      const res = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno_id: alumno.id, viandas }),
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
      {!mpDisponible ? (
        <div className="rounded-xl border bg-orange-50 border-orange-200 p-4 text-sm">
          <p className="font-medium">Mercado Pago no está configurado todavía</p>
          <p className="text-muted-foreground mt-1">
            Pediles a la administradora que complete las claves de MP en las variables de entorno
            del servidor para habilitar las cargas.
          </p>
        </div>
      ) : null}

      {alumnos.length > 1 ? (
        <div className="space-y-2">
          <Label>¿Para qué hijo?</Label>
          <div className="grid grid-cols-1 gap-2">
            {alumnos.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAlumnoId(a.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors flex items-center justify-between',
                  alumnoId === a.id ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <div>
                  <p className="font-medium">{a.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.grado}° {a.division}
                  </p>
                </div>
                <Badge variant="secondary">{a.viandas_credito} viandas</Badge>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="viandas">¿Cuántas viandas querés cargar?</Label>
        <Input
          id="viandas"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={viandas || ''}
          onChange={(e) => setViandas(Number(e.target.value))}
          className="h-12 text-right text-lg"
        />
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 20, 40].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setViandas(n)}
              className={cn(
                'h-10 rounded-lg border text-sm transition-colors',
                viandas === n ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Precio por vianda</span>
          <span>{formatPesos(precioVianda)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cantidad</span>
          <span>{viandas}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-base">
          <span className="text-muted-foreground">Total a pagar</span>
          <span className="font-semibold">{formatPesos(total)}</span>
        </div>
      </div>

      <Button
        onClick={pagar}
        disabled={pending || !mpDisponible || viandas < 1}
        className="w-full h-12 text-base"
      >
        {pending ? 'Redirigiendo a Mercado Pago…' : 'Pagar con Mercado Pago'}
      </Button>
    </div>
  )
}
