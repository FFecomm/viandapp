'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

type HijoInput = {
  nombre_completo: string
  grado: string
  division: string
  fecha_nacimiento: string
  relacion: 'madre' | 'padre' | 'tutor' | 'otro'
}

/**
 * Carga uno o más hijos NUEVOS (el primer padre los crea). Cada hijo necesita
 * fecha de nacimiento para que el segundo padre pueda vincularse después.
 */
export async function vincularHijos(
  hijos: HijoInput[],
): Promise<{ error?: string } | void> {
  await requireRole(['padre'])

  if (!hijos.length) return { error: 'Agregá al menos un hijo' }

  const supabase = createClient()
  for (const h of hijos) {
    if (!h.nombre_completo.trim()) return { error: 'Falta el nombre de algún hijo' }
    if (!h.grado.trim() || !h.division.trim()) return { error: 'Faltan grado o división' }
    if (!h.fecha_nacimiento) return { error: 'Falta la fecha de nacimiento' }
    const { error } = await supabase.rpc('fn_vincular_hijo', {
      p_nombre_completo: h.nombre_completo,
      p_grado: h.grado,
      p_division: h.division,
      p_fecha_nacimiento: h.fecha_nacimiento,
      p_relacion: h.relacion,
    })
    if (error) return { error: error.message || 'No se pudo vincular un hijo' }
  }

  revalidatePath('/familia')
  redirect('/familia')
}

type VincularExistenteInput = {
  nombre_completo: string
  grado: string
  division: string
  fecha_nacimiento: string
  relacion: 'madre' | 'padre' | 'tutor' | 'otro'
}

/**
 * Vincula al usuario logueado con un alumno YA cargado por otra persona
 * (segundo padre). Los 4 datos del alumno tienen que coincidir exactamente.
 */
export async function vincularAlumnoExistente(
  input: VincularExistenteInput,
): Promise<{ error?: string } | void> {
  await requireRole(['padre'])

  if (!input.nombre_completo.trim()) return { error: 'Falta el nombre del alumno' }
  if (!input.grado.trim() || !input.division.trim()) return { error: 'Faltan grado o división' }
  if (!input.fecha_nacimiento) return { error: 'Falta la fecha de nacimiento' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_vincular_alumno_existente', {
    p_nombre_completo: input.nombre_completo,
    p_grado: input.grado,
    p_division: input.division,
    p_fecha_nacimiento: input.fecha_nacimiento,
    p_relacion: input.relacion,
  })
  if (error) return { error: error.message || 'No pudimos vincularte al alumno' }

  revalidatePath('/familia')
  redirect('/familia')
}

/**
 * Permite a un padre completar la fecha de nacimiento de un hijo legacy
 * (alumno cargado antes de la migración 0015 que no la tiene). Una vez
 * cargada, no se puede modificar desde acá — solo el admin.
 */
export async function completarFechaNacimiento(
  alumno_id: string,
  fecha_nacimiento: string,
): Promise<{ error?: string; ok?: boolean }> {
  await requireRole(['padre'])
  if (!alumno_id) return { error: 'Falta el alumno' }
  if (!fecha_nacimiento) return { error: 'Falta la fecha' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_actualizar_fecha_nacimiento', {
    p_alumno_id: alumno_id,
    p_fecha: fecha_nacimiento,
  })
  if (error) return { error: error.message || 'No pudimos guardar la fecha' }

  revalidatePath('/familia')
  return { ok: true }
}
