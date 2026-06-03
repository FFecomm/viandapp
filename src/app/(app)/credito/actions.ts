'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { registrarAudit } from '@/lib/audit'

type Result = { error?: string; ok?: boolean; viandas?: number }

export async function cargarPago(formData: FormData): Promise<Result | void> {
  const profile = await requireRole(['administrativo'])

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

  await registrarAudit({
    actor_id: profile.id,
    accion: 'credito_cargado_manual',
    recurso_tipo: 'alumno',
    recurso_id: alumnoId,
    detalle: { monto, precio, forma_pago: formaPago },
  })

  revalidatePath('/credito')
  revalidatePath(`/credito/${alumnoId}`)
  redirect(`/credito/${alumnoId}`)
}

export async function actualizarPrecioVianda(formData: FormData): Promise<Result | void> {
  const profile = await requireRole(['administrativo'])
  const precio = Number(formData.get('precio') ?? 0)
  if (!Number.isFinite(precio) || precio <= 0) return { error: 'Precio inválido' }
  // Tope superior para evitar errores de tipeo (ej. agregar un cero de más).
  // Si el negocio realmente vende a más de $100k la vianda, ajustar acá.
  if (precio > 100_000) return { error: 'Precio sospechosamente alto. Verificá el valor.' }

  const supabase = createClient()
  // Leer el precio anterior para dejarlo en el audit (diff legible).
  const { data: prev } = await supabase
    .from('configuracion')
    .select('value')
    .eq('key', 'precio_vianda_actual')
    .maybeSingle()
  const precioAnterior = prev ? Number((prev as { value: string }).value) : null

  const { error } = await supabase
    .from('configuracion')
    .upsert({ key: 'precio_vianda_actual', value: String(Math.round(precio)) }, { onConflict: 'key' })
  if (error) return { error: 'No se pudo actualizar el precio' }

  await registrarAudit({
    actor_id: profile.id,
    accion: 'precio_vianda_actualizado',
    recurso_tipo: 'configuracion',
    recurso_id: 'precio_vianda_actual',
    detalle: { anterior: precioAnterior, nuevo: Math.round(precio) },
  })

  revalidatePath('/credito')
  return { ok: true }
}
