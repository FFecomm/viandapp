'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

type HijoInput = {
  nombre_completo: string
  grado: string
  division: string
  relacion: 'madre' | 'padre' | 'tutor' | 'otro'
}

export async function vincularHijos(
  hijos: HijoInput[],
): Promise<{ error?: string } | void> {
  await requireRole(['padre'])

  if (!hijos.length) return { error: 'Agregá al menos un hijo' }

  const supabase = createClient()
  for (const h of hijos) {
    if (!h.nombre_completo.trim()) return { error: 'Falta el nombre de algún hijo' }
    if (!h.grado.trim() || !h.division.trim()) return { error: 'Faltan grado o división' }
    const { error } = await supabase.rpc('fn_vincular_hijo', {
      p_nombre_completo: h.nombre_completo,
      p_grado: h.grado,
      p_division: h.division,
      p_relacion: h.relacion,
    })
    if (error) return { error: error.message || 'No se pudo vincular un hijo' }
  }

  revalidatePath('/familia')
  redirect('/familia')
}
