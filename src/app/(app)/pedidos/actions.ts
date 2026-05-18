'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

export async function borrarPedido(formData: FormData): Promise<{ error?: string } | void> {
  await requireRole(['operadora'])
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Falta el id' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_borrar_pedido', { p_pedido_id: id })
  if (error) return { error: 'No se pudo borrar el pedido' }

  revalidatePath('/pedidos')
}
