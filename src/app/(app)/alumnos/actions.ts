'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

type Result = { error?: string; ok?: boolean }

const RELACIONES = ['madre', 'padre', 'otro'] as const

export async function crearAlumno(formData: FormData): Promise<Result | void> {
  await requireRole(['operadora'])

  const nombre = String(formData.get('nombre_completo') ?? '').trim()
  const grado = String(formData.get('grado') ?? '').trim()
  const division = String(formData.get('division') ?? '').trim()
  const contactoNombre = String(formData.get('contacto_nombre') ?? '').trim()
  const contactoTelefono = String(formData.get('contacto_telefono') ?? '').trim()
  const contactoRelacion = String(formData.get('contacto_relacion') ?? 'madre') as typeof RELACIONES[number]

  if (!nombre || !grado || !division) return { error: 'Completá nombre, grado y división' }
  if (!contactoNombre || !contactoTelefono) return { error: 'Cargá al menos un contacto con nombre y teléfono' }
  if (!RELACIONES.includes(contactoRelacion)) return { error: 'Relación inválida' }

  const supabase = createClient()
  const { data: alumno, error: errAl } = await supabase
    .from('alumnos')
    .insert({ nombre_completo: nombre, grado, division })
    .select('id')
    .single()
  if (errAl || !alumno) return { error: 'No se pudo guardar el alumno, intentá de nuevo' }

  const { error: errCt } = await supabase
    .from('contactos')
    .insert({ alumno_id: alumno.id, nombre: contactoNombre, telefono: contactoTelefono, relacion: contactoRelacion })
  if (errCt) return { error: 'Alumno guardado pero falló el contacto. Editalo desde la ficha del alumno.' }

  revalidatePath('/alumnos')
  redirect(`/alumnos/${alumno.id}`)
}

export async function actualizarAlumno(formData: FormData): Promise<Result | void> {
  await requireRole(['operadora'])
  const id = String(formData.get('id') ?? '')
  const nombre = String(formData.get('nombre_completo') ?? '').trim()
  const grado = String(formData.get('grado') ?? '').trim()
  const division = String(formData.get('division') ?? '').trim()
  if (!id || !nombre || !grado || !division) return { error: 'Completá nombre, grado y división' }

  const supabase = createClient()
  const { error } = await supabase
    .from('alumnos')
    .update({ nombre_completo: nombre, grado, division })
    .eq('id', id)
  if (error) return { error: 'No se pudo guardar los cambios' }

  revalidatePath('/alumnos')
  revalidatePath(`/alumnos/${id}`)
  return { ok: true }
}

export async function agregarContacto(formData: FormData): Promise<Result | void> {
  await requireRole(['operadora'])
  const alumnoId = String(formData.get('alumno_id') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const telefono = String(formData.get('telefono') ?? '').trim()
  const relacion = String(formData.get('relacion') ?? 'madre') as typeof RELACIONES[number]

  if (!alumnoId || !nombre || !telefono) return { error: 'Completá nombre y teléfono' }
  if (!RELACIONES.includes(relacion)) return { error: 'Relación inválida' }

  const supabase = createClient()
  const { error } = await supabase
    .from('contactos')
    .insert({ alumno_id: alumnoId, nombre, telefono, relacion })
  if (error) return { error: 'No se pudo agregar el contacto' }

  revalidatePath(`/alumnos/${alumnoId}`)
  return { ok: true }
}

/** Usado directo como `<form action={borrarContacto}>`. No devuelve error para satisfacer el typing del form action. */
export async function borrarContacto(formData: FormData): Promise<void> {
  await requireRole(['operadora'])
  const id = String(formData.get('id') ?? '')
  const alumnoId = String(formData.get('alumno_id') ?? '')
  if (!id || !alumnoId) return
  const supabase = createClient()
  await supabase.from('contactos').delete().eq('id', id)
  revalidatePath(`/alumnos/${alumnoId}`)
}
