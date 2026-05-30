'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import type { TipoMenu } from '@/lib/supabase/types'

export async function marcarAusencia(formData: FormData): Promise<{ error?: string } | void> {
  await requireRole(['encargada', 'administrativo'])
  const id = String(formData.get('pedido_id') ?? '')
  if (!id) return { error: 'Falta el pedido' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_marcar_ausencia', { p_pedido_id: id })
  if (error) return { error: error.message || 'No se pudo marcar la ausencia' }

  revalidatePath('/encargada')
}

export async function darViandaExtra(input: {
  alumno_id: string
  menu: TipoMenu
  precio_vianda: number
}): Promise<{ error?: string; sin_credito?: boolean; ok?: boolean }> {
  await requireRole(['encargada', 'administrativo'])

  const supabase = createClient()
  const { data, error } = await supabase.rpc('fn_dar_vianda_extra', {
    p_alumno_id: input.alumno_id,
    p_menu: input.menu,
    p_precio_vianda: input.precio_vianda,
  })
  if (error) return { error: error.message || 'No se pudo dar la vianda' }

  // fn_dar_vianda_extra devuelve jsonb { ok: true | false, motivo?: 'sin_credito' }
  const payload = (data ?? {}) as { ok?: boolean; motivo?: string; pedido_id?: string }
  if (payload.ok === false && payload.motivo === 'sin_credito') {
    return { sin_credito: true }
  }

  revalidatePath('/encargada')
  return { ok: true }
}

export async function cobrarEfectivo(formData: FormData): Promise<{ error?: string } | void> {
  await requireRole(['encargada', 'administrativo'])
  const alumno_id = String(formData.get('alumno_id') ?? '')
  const monto = Number(formData.get('monto') ?? 0)
  const menu = (formData.get('menu') ?? null) as string | null
  if (!alumno_id) return { error: 'Falta el alumno' }
  if (!Number.isFinite(monto) || monto <= 0) return { error: 'Monto inválido' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_cobrar_efectivo', {
    p_alumno_id: alumno_id,
    p_monto: monto,
    p_menu: menu && menu.length > 0 ? menu : null,
  })
  if (error) return { error: error.message || 'No se pudo registrar el cobro' }

  revalidatePath('/encargada')
  revalidatePath('/caja')
  redirect('/encargada')
}
