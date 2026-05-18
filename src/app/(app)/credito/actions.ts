'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'

type Result = { error?: string; ok?: boolean; viandas?: number }

export async function cargarPago(formData: FormData): Promise<Result | void> {
  await requireRole(['administrativo'])

  const alumnoId = String(formData.get('alumno_id') ?? '')
  const monto = Number(formData.get('monto') ?? 0)
  const precio = Number(formData.get('precio_vianda') ?? 0)
  const formaPago = String(formData.get('forma_pago') ?? 'transferencia')

  if (!alumnoId) return { error: 'Elegí un alumno' }
  if (!Number.isFinite(monto) || monto <= 0) return { error: 'Monto inválido' }
  if (!Number.isFinite(precio) || precio <= 0) return { error: 'Precio de vianda inválido' }
  if (!['transferencia', 'efectivo'].includes(formaPago)) return { error: 'Forma de pago inválida' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_cargar_credito', {
    p_alumno_id: alumnoId,
    p_monto: monto,
    p_precio_vianda: precio,
    p_forma_pago: formaPago,
  })
  if (error) return { error: error.message || 'No se pudo cargar el pago' }

  revalidatePath('/credito')
  revalidatePath(`/credito/${alumnoId}`)
  redirect(`/credito/${alumnoId}`)
}

export async function actualizarPrecioVianda(formData: FormData): Promise<Result | void> {
  await requireRole(['administrativo'])
  const precio = Number(formData.get('precio') ?? 0)
  if (!Number.isFinite(precio) || precio <= 0) return { error: 'Precio inválido' }

  const supabase = createClient()
  const { error } = await supabase
    .from('configuracion')
    .upsert({ key: 'precio_vianda_actual', value: String(Math.round(precio)) }, { onConflict: 'key' })
  if (error) return { error: 'No se pudo actualizar el precio' }

  revalidatePath('/credito')
  return { ok: true }
}
