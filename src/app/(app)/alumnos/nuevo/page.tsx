import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/roles'
import { NuevoAlumnoForm } from './nuevo-alumno-form'

export default async function NuevoAlumnoPage() {
  await requireRole(['operadora'])

  return (
    <div className="p-5 space-y-5">
      <Link href="/alumnos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo alumno</h1>
      <NuevoAlumnoForm />
    </div>
  )
}
