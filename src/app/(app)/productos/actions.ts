'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

type Result = { error?: string; ok?: boolean }

export async function crearProducto(formData: FormData): Promise<Result | void> {
  await requireRole(['operadora', 'administrativo'])
  const nombre = String(formData.get('nombre') ?? '').trim()
  const precio = Number(formData.get('precio') ?? 0)
  const categoria = String(formData.get('categoria') ?? 'bebida')

  if (!nombre) return { error: 'Falta el nombre del producto' }
  if (!Number.isFinite(precio) || precio < 0) return { error: 'Precio inválido' }
  if (!['bebida', 'extra'].includes(categoria)) return { error: 'Categoría inválida' }

  const supabase = createClient()
  const { error } = await supabase
    .from('productos')
    .insert({ nombre, precio, categoria, activo: true })
  if (error) return { error: 'No se pudo guardar el producto' }

  revalidatePath('/productos')
  return { ok: true }
}

export async function actualizarProducto(formData: FormData): Promise<Result | void> {
  await requireRole(['operadora', 'administrativo'])
  const id = String(formData.get('id') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const precio = Number(formData.get('precio') ?? 0)
  const categoria = String(formData.get('categoria') ?? 'bebida')
  const activo = formData.get('activo') === 'on' || formData.get('activo') === 'true'

  if (!id) return { error: 'Falta el id' }
  if (!nombre) return { error: 'Falta el nombre' }
  if (!Number.isFinite(precio) || precio < 0) return { error: 'Precio inválido' }

  const supabase = createClient()
  const { error } = await supabase
    .from('productos')
    .update({ nombre, precio, categoria, activo })
    .eq('id', id)
  if (error) return { error: 'No se pudo guardar el cambio' }

  revalidatePath('/productos')
  return { ok: true }
}
