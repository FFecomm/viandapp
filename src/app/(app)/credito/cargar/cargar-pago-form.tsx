'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, User } from 'lucide-react'
import { cargarPago } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPesos } from '@/lib/format'
import { cn } from '@/lib/utils'

type Alumno = { id: string; nombre_completo: string; grado: string; division: string }

export function CargarPagoForm({ alumnos, precioVianda }: { alumnos: Alumno[]; precioVianda: number }) {
  const [query, setQuery] = useState('')
  const [seleccionado, setSeleccionado] = useState<Alumno | null>(null)
  const [monto, setMonto] = useState<number>(0)
  const [precio, setPrecio] = useState<number>(precioVianda)
  const [forma, setForma] = useState<'transferencia' | 'efectivo'>('transferencia')
  const [pending, startTransition] = useTransition()

  const matches = useMemo(() => {
    if (!query.trim() || seleccionado) return []
    const q = query.toLowerCase()
    return alumnos.filter((a) => a.nombre_completo.toLowerCase().includes(q)).slice(0, 6)
  }, [query, alumnos, seleccionado])

  const viandas = monto > 0 && precio > 0 ? Math.floor(monto / precio) : 0
  const sobra = monto > 0 && precio > 0 ? monto - viandas * precio : 0

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!seleccionado) return toast.error('Elegí un alumno')
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await cargarPago(data)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-2">
        <Label>Alumno</Label>
        {seleccionado ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{seleccionado.nombre_completo}</p>
                <p className="text-xs text-muted-foreground">{seleccionado.grado}° {seleccionado.division}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSeleccionado(null); setQuery('') }}>
              Cambiar
            </Button>
            <input type="hidden" name="alumno_id" value={seleccionado.id} />
          </div>
        ) : (
          <div className="space-y-1">
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
            {matches.length > 0 ? (
              <ul className="rounded-lg border divide-y bg-card max-h-64 overflow-auto">
                {matches.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSeleccionado(a)}
                      className="w-full text-left p-3 hover:bg-muted"
                    >
                      <p className="font-medium">{a.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">{a.grado}° {a.division}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="monto">Monto pagado</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            inputMode="numeric"
            min="0"
            step="500"
            value={monto || ''}
            onChange={(e) => setMonto(Number(e.target.value))}
            required
            className="h-12 text-right text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="precio_vianda">Precio de vianda hoy</Label>
          <Input
            id="precio_vianda"
            name="precio_vianda"
            type="number"
            inputMode="numeric"
            min="0"
            step="50"
            value={precio || ''}
            onChange={(e) => setPrecio(Number(e.target.value))}
            required
            className="h-12 text-right text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label>Forma de pago</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['transferencia', 'efectivo'] as const).map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => setForma(opt)}
                className={cn(
                  'h-12 rounded-lg border text-base capitalize transition-colors',
                  forma === opt ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <input type="hidden" name="forma_pago" value={forma} />
        </div>
      </section>

      {monto > 0 && precio > 0 ? (
        <div className="rounded-xl border bg-violet-50 p-4 text-sm">
          <p>
            Esto equivale a <span className="font-semibold">{viandas} {viandas === 1 ? 'vianda' : 'viandas'}</span> a {formatPesos(precio)}.
          </p>
          {sobra > 0 ? (
            <p className="text-muted-foreground mt-1">Sobran {formatPesos(sobra)} como saldo parcial.</p>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" disabled={pending || !seleccionado || monto <= 0} className="w-full h-12 text-base">
        {pending ? 'Guardando…' : 'Confirmar pago'}
      </Button>
    </form>
  )
}
