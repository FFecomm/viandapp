import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Phone, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { puedeEscribirAlumnos } from '@/lib/auth/roles'
import { describirCredito } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlumnoForm } from './alumno-form'
import { AgregarContactoForm } from './agregar-contacto-form'
import { borrarContacto } from '../actions'

export default async function AlumnoDetallePage({ params }: { params: { id: string } }) {
  const profile = await getProfile()
  const supabase = createClient()

  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id, nombre_completo, grado, division, credito_pesos, viandas_credito')
    .eq('id', params.id)
    .maybeSingle()
  if (!alumno) notFound()

  const { data: contactos } = await supabase
    .from('contactos')
    .select('id, nombre, telefono, relacion')
    .eq('alumno_id', params.id)
    .order('created_at')

  const puedeEscribir = profile && puedeEscribirAlumnos(profile.rol)
  const credito = describirCredito(alumno.viandas_credito ?? 0, Number(alumno.credito_pesos ?? 0))
  const debe = (alumno.credito_pesos ?? 0) < 0

  return (
    <div className="p-5 space-y-6">
      <Link href="/alumnos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{alumno.nombre_completo}</h1>
          <p className="text-sm text-muted-foreground">{alumno.grado}° {alumno.division}</p>
        </div>
        <Badge variant={debe ? 'destructive' : 'secondary'}>{credito}</Badge>
      </div>

      <Separator />

      {puedeEscribir ? <AlumnoForm alumno={alumno} /> : null}

      <Separator />

      <section className="space-y-3">
        <h2 className="font-medium">Contactos</h2>
        {!contactos?.length ? (
          <p className="text-sm text-muted-foreground">No hay contactos cargados.</p>
        ) : (
          <ul className="space-y-2">
            {contactos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.nombre}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3.5" />
                    <a href={`tel:${c.telefono}`} className="hover:underline">{c.telefono}</a>
                    <span className="text-xs">· {c.relacion}</span>
                  </p>
                </div>
                {puedeEscribir ? (
                  <form action={borrarContacto}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="alumno_id" value={alumno.id} />
                    <Button type="submit" variant="ghost" size="icon" className="h-9 w-9">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {puedeEscribir ? <AgregarContactoForm alumnoId={alumno.id} /> : null}
      </section>
    </div>
  )
}
