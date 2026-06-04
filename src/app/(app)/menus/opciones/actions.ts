'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

const MENUS_VALIDOS = new Set(['A', 'B', 'C', 'Hamburguesa', 'Fideos', 'Sandwich'])

export async function crearOpcion(input: {
  menu: string
  texto: string
}): Promise<{ error?: string } | void> {
  await requireRole(['administrativo'])
  if (!MENUS_VALIDOS.has(input.menu)) return { error: 'Menú inválido' }
  const texto = input.texto.trim()
  if (!texto) return { error: 'El texto no puede estar vacío' }
  if (texto.length > 80) return { error: 'El texto es muy largo (máx 80 caracteres)' }

  const supabase = createClient()
  const { data: maxOrden } = await supabase
    .from('menu_opciones')
    .select('orden')
    .eq('menu', input.menu)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = ((maxOrden as { orden?: number } | null)?.orden ?? 0) + 1

  const { error } = await supabase
    .from('menu_opciones')
    .insert({ menu: input.menu, texto, orden, activa: true })

  if (error) return { error: error.message }
  revalidatePath('/menus/opciones')
}

export async function editarOpcion(input: {
  id: string
  texto: string
}): Promise<{ error?: string } | void> {
  await requireRole(['administrativo'])
  const texto = input.texto.trim()
  if (!texto) return { error: 'El texto no puede estar vacío' }
  if (texto.length > 80) return { error: 'El texto es muy largo (máx 80 caracteres)' }

  const supabase = createClient()
  const { error } = await supabase
    .from('menu_opciones')
    .update({ texto })
    .eq('id', input.id)

  if (error) return { error: error.message }
  revalidatePath('/menus/opciones')
}

export async function alternarOpcion(input: {
  id: string
  activa: boolean
}): Promise<{ error?: string } | void> {
  await requireRole(['administrativo'])
  const supabase = createClient()
  const { error } = await supabase
    .from('menu_opciones')
    .update({ activa: input.activa })
    .eq('id', input.id)

  if (error) return { error: error.message }
  revalidatePath('/menus/opciones')
}

export async function borrarOpcion(id: string): Promise<{ error?: string } | void> {
  await requireRole(['administrativo'])
  const supabase = createClient()
  const { error } = await supabase.from('menu_opciones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/menus/opciones')
}
