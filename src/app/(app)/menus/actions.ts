'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

export async function actualizarMenu(formData: FormData): Promise<{ error?: string; ok?: boolean } | void> {
  await requireRole(['administrativo'])
  const id = String(formData.get('id') ?? '')
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  if (!id || !descripcion) return { error: 'Falta la descripción' }

  const supabase = createClient()
  const { error } = await supabase.from('menu_ciclo').update({ descripcion }).eq('id', id)
  if (error) return { error: 'No se pudo guardar' }
  revalidatePath('/menus')
  return { ok: true }
}
